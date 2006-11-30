#   Copyright (c) 2006 Open Source Applications Foundation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

from wsgiref.simple_server import make_server
from wsgiref.util import request_uri
from urlparse import urlparse, urljoin
import os.path
import httplib, copy, time, socket

CORE_PATH = os.path.abspath('../core')
PORT = 4444

# wsgiref.utils.is_hop_by_hop doesn't pick up proxy-connection so we need to write our own
_hoppish = {
    'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
    'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
    'upgrade':1, 'proxy-connection':1 }
    
def is_hop_by_hop(header):
    return _hoppish.has_key(header.lower())
        

class WindmillServApplication(object):
    """Application to serve out windmill provided"""
    
    def __init__(self, path=CORE_PATH):
        self.path = path
    
    def handler(self, environ, start_response):
        """Application to serve out windmill provided"""
        url = urlparse(environ['PATH_INFO'])
        serve_file = url[2].replace('/windmill-serv/', '')
        #Open file
        try:
            f = open('%s/%s' % (CORE_PATH, serve_file), 'r')
        except:
            start_response('404 Not found', [('Content-Type', 'text/plain')])
            return ['404 Not Found']
        content_type = self.guess_content_type(environ['PATH_INFO'])
        start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                                  ('Content-Type', content_type)])
        return [f.read()]

    def guess_content_type(self, path_info):
        if path_info.endswith('.js'):
            return 'application/x-javascript'
        elif path_info.endswith('.html'):
            return 'text/html'
        else:
            return 'text/plain'
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)            
                
class WindmillJSONRPCApplication(object):
    """Application to handle requests to the JSONRPC service"""
    
    def handler(self, environ, start_response):
        """JSONRPC service for windmill browser core to communicate with"""
        
        start_response("200 OK", [('Content-Type','text/plain')])
        return ['']
    
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)    

class WindmillXMLRPCApplication(object):
    """Application to handle requests to the XMLRPC service"""

    def __init__(self):
        """Create windmill xmlrpc dispatcher"""
        
        from windmill_xmlrpc import make_windmill_dispatcher        
        self.dispatcher = make_windmill_dispatcher()

    def handler(self, environ, start_response):
        """XMLRPC service for windmill browser core to communicate with"""

        if environ['REQUEST_METHOD'] == 'POST':
            return self.handle_POST(environ, start_response)
        else:
            start_response("400 Bad request", [('Content-Type','text/plain')])
            return ['']
        
    def handle_POST(self, environ, start_response):
        """Handles the HTTP POST request.

        Attempts to interpret all HTTP POST requests as XML-RPC calls,
        which are forwarded to the server's _dispatch method for handling.
        """
        
        try:
            # Get arguments by reading body of request.
            # We read this in chunks to avoid straining
            # socket.read(); around the 10 or 15Mb mark, some platforms
            # begin to have problems (bug #792570).

            length = int(environ['CONTENT_LENGTH'])
            data = environ['wsgi.input'].read(length)
            
            max_chunk_size = 10*1024*1024
            size_remaining = length

            # In previous versions of SimpleXMLRPCServer, _dispatch
            # could be overridden in this class, instead of in
            # SimpleXMLRPCDispatcher. To maintain backwards compatibility,
            # check to see if a subclass implements _dispatch and dispatch
            # using that method if present.
            response = self.dispatcher._marshaled_dispatch(
                    data, getattr(self.dispatcher, '_dispatch', None)
                )
        except: # This should only happen if the module is buggy
            # internal error, report as HTTP server error
            start_response("500 Server error", [('Content-Type', 'text/plain')])
            return []
        else:
            # got a valid XML RPC response
            start_response("200 OK", [('Content-Type','text/xml')])
            return [response]
            

    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)    


class WindmillProxyApplication(object):
    """Application to handle requests that need to be proxied"""
    
    def handler(self, environ, start_response):
        """Proxy for requests to the actual http server"""
        if environ['QUERY_STRING'] != '':
            request = environ['PATH_INFO']+'?'+environ['QUERY_STRING']
        else:
            request = environ['PATH_INFO']

        url = urlparse(request)
    
        # Create connection object
        if url[0] == 'http':
            try:
                connection = httplib.HTTPConnection(url[1])
                # Build path
                path = request.replace('http://%s' % url[1], '')
            except:
                start_response("501 Gateway error", [('Content-Type', 'text/html')])
                return ['<H1>Could not connect</H1>']
        else:
            # We don't currently support SSL or any other scheme
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            return ['<H1>Gateway does not support scheme</H1>']
            
        # Read in request body if it exists    
        body = None
        if environ.get('CONTENT_LENGTH'):
            length = int(environ['CONTENT_LENGTH'])
            body = environ['wsgi.input'].read(length)
        
        # Build headers
        headers = {}
        for key in environ.keys():
            # Keys that start with HTTP_ are all headers
            if key.startswith('HTTP_'):
                # This is a hacky way of getting the header names right
                value = environ[key]
                key = key.replace('HTTP_', '').swapcase().replace('_', '-')
                if is_hop_by_hop(key) is False:
                    headers[key] = value
    
        # Add our host if one isn't defined
        if not headers.has_key('host'):
            headers['host'] = environ['SERVER_NAME']   
    
        # Make the remote request
        try:
            connection.request(environ['REQUEST_METHOD'], path, body=body, headers=headers)
        except:
            # We need exception handling in the case the server fails, it's an edge case but I've seen it
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            return ['<H1>Could not connect</H1>']

        response = connection.getresponse()
    
        # Return the proper wsgi response
        response_body = response.read()
        hopped_headers = response.getheaders()
        headers = copy.copy(hopped_headers)
        for header in hopped_headers:
            if is_hop_by_hop(header[0]):
                headers.remove(header)
        start_response(response.status.__str__()+' '+response.reason, headers)
        return [response_body]
    
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)
    
class WindmillChooserApplication(object):
    """Application to handle choosing the proper application to handle each request"""
    def __init__(self, windmill_serv_app, windmill_jsonrpc_app, windmill_xmlrpc_app, windmill_proxy_app):
        self.windmill_serv_app = windmill_serv_app
        self.windmill_jsonrpc_app = windmill_jsonrpc_app
        self.windmill_xmlrpc_app = windmill_xmlrpc_app
        self.windmill_proxy_app = windmill_proxy_app

    def handler(self, environ, start_response):
        """Windmill app chooser"""
        
        print 'environ["PATH_INFO"] = ' + environ['PATH_INFO']
        print environ['PATH_INFO'].find('/windmill-serv/')
        if environ['PATH_INFO'].find('/windmill-serv/') is not -1:
            print 'windmill_serv_app called'
            return self.windmill_serv_app(environ, start_response)
        elif environ['PATH_INFO'].find('/windmill-jsonrpc/') is not -1:
            return self.windmill_jsonrpc_app(environ, start_response)
        elif environ['PATH_INFO'].find('/windmill-xmlrpc/') is not -1:
            return self.windmill_xmlrpc_app(environ, start_response)
        else:
            return self.windmill_proxy_app(environ, start_response)
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)


import SocketServer

class ServerStopError(BaseException):
    """Could not stop server in timeout"""
    pass

class ThreadedWSGIServer(SocketServer.ThreadingTCPServer):
    """Threaded WSGI Server. Does not inherit from wsgiref.simple_server.WSGIServer because
    of a static call to BaseHTTPServer.HTTPServer"""

    application = None
    timeout = 10

    def server_bind(self):
        """Override server_bind to store the server name."""
        
        # We do a lot of testing where we bring down the server and put it back up again very quickly. 
        # Unfortunately there are states where you can't make client socket connections anymore but still can't bind to the socket, this left us with no alternative than to try binding to the socket for timeout
        timer = 0
        while 1:
            try:
                SocketServer.ThreadingTCPServer.server_bind(self)
                break
            except:
                time.sleep(.5)
                timer = timer + 1
            
            if timer > self.timeout * 2:
                raise 'Failed to bind to socket'
        
        # Set some values that would have been set by HTTPServer
        # These two lines, the removal of a call to BaseHTTPServer.HTTPServer, and the inheritance change
        # are the only changes to the original WSGIServer code
        self.server_name = self.server_address[0]
        self.server_port = self.server_address[1]
        
        self.setup_environ()

    def setup_environ(self):
        # Set up base environment
        env = self.base_environ = {}
        env['SERVER_NAME'] = self.server_name
        env['GATEWAY_INTERFACE'] = 'CGI/1.1'
        env['SERVER_PORT'] = str(self.server_port)
        env['REMOTE_HOST']=''
        env['CONTENT_LENGTH']=''
        env['SCRIPT_NAME'] = ''

    def get_app(self):
        return self.application

    def set_app(self,application):
        self.application = application
        
        # From here down I implement conditional serving to make it easier to quit when I'm running this in a thread
    def serve_until(self):
        self._run = True
        self._active = True
        while self._run is True:
            self.handle_request()
        self._active = False
    
    def server_stop(self):
        self._run = False
        #This is a bit of a hack, but we need to make one last connection to make self.handle_request() return
        if self._active is False:
            conn = httplib.HTTPConnection(self.server_name, self.server_port)
            conn.request('GET', '/endingrequest')
            conn.getresponse()
        time.sleep(.5)
        if self.is_alive():
            raise ServerStopError
    
    def is_alive(self):
        return self._active 
        
def make_windmill_server(port=PORT, core_path=CORE_PATH):
    windmill_serv_app = WindmillServApplication(core_path)
    windmill_proxy_app = WindmillProxyApplication()
    windmill_jsonrpc_app = WindmillJSONRPCApplication()
    windmill_xmlrpc_app =  WindmillXMLRPCApplication()
    windmill_chooser_app = WindmillChooserApplication(windmill_serv_app, windmill_jsonrpc_app,
                                                      windmill_xmlrpc_app, windmill_proxy_app)
    return make_server('', port, windmill_chooser_app, server_class=ThreadedWSGIServer)

def main(port=PORT):
    httpd = make_windmill_server()
    print "Serving HTTP on port %s..." % port

    # Respond to requests until process is killed
    httpd.serve_forever()
    
if __name__ == "__main__":
    
    main()
