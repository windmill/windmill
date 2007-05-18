#   Copyright (c) 2006-2007 Open Source Applications Foundation
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

from urlparse import urlparse, urljoin
import httplib, os.path, copy, time, socket, logging, sys, traceback, random
from StringIO import StringIO

import jsonrpc, logger
import windmill

import logging
logger = logging.getLogger('server.wsgi')

PORT = 4444

START_DST_PORT = 32000
CURRENT_DST_PORT = [random.randint(32000, 34000)]

LOCAL_IP_ADDRESS = socket.gethostbyname(socket.gethostname())

# wsgiref.utils.is_hop_by_hop doesn't pick up proxy-connection so we need to write our own
_hoppish = {
    'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
    'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
    'upgrade':1, 'proxy-connection':1 }
    
def is_hop_by_hop(header):
    return _hoppish.has_key(header.lower())
    
def reconstruct_url(environ):
    # From WSGI spec, PEP 333
    from urllib import quote
    url = environ['wsgi.url_scheme']+'://'

    if environ.get('HTTP_HOST'):
        url += environ['HTTP_HOST']
    else:
        url += environ['SERVER_NAME']

        if environ['wsgi.url_scheme'] == 'https':
            if environ['SERVER_PORT'] != '443':
               url += ':' + environ['SERVER_PORT']
        else:
            if environ['SERVER_PORT'] != '80':
               url += ':' + environ['SERVER_PORT']

    url += quote(environ.get('SCRIPT_NAME',''))
    url += quote(environ.get('PATH_INFO',''))
    if environ.get('QUERY_STRING'):
        url += '?' + environ['QUERY_STRING']
    
    environ['reconstructed_url'] = url
        
    return url
        

class WindmillServApplication(object):
    """Application to serve out windmill provided"""
    
    def __init__(self, logger, js_path):
        self.path = js_path
        self.logger = logger
    
    def handler(self, environ, start_response):
        """Application to serve out windmill provided"""
        url = urlparse(reconstruct_url(environ))
        split_url = url.path.split('/windmill-serv/')
        serve_file = split_url[1]
        
        #Open file
        try:
            f = open('%s/%s' % (self.path, serve_file), 'r')
            self.logger.debug('opened file %s' % serve_file)
        except:
            self.logger.error('failed to open file %s/%s' % (self.path, serve_file))
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
        elif path_info.endswith('.css'):
            return 'text/css'
        else:
            return 'text/plain'
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)            
        
                
class WindmillJSONRPCApplication(object):
    """Application to handle requests to the JSONRPC service"""
    
    def __init__(self, json_methods_instance, logger):
        """Create windmill jsonrpc dispatcher"""
        self.jsonrpc_dispatcher = jsonrpc.WSGIJSONRPCDispatcher(instance=json_methods_instance)
        self.logger = logger
    
    def handler(self, environ, start_response):
        """JSONRPC service for windmill browser core to communicate with"""
        
        return self.jsonrpc_dispatcher.handler(environ, start_response)
    
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)    
        

class WindmillXMLRPCApplication(object):
    """Application to handle requests to the XMLRPC service"""

    def __init__(self, xmlrpc_methods_instance, logger):
        """Create windmill xmlrpc dispatcher"""
        from SimpleXMLRPCServer import SimpleXMLRPCDispatcher  
        self.dispatcher = SimpleXMLRPCDispatcher(allow_none=False, encoding=None)
        self.dispatcher.register_instance(xmlrpc_methods_instance)
        self.dispatcher.register_introspection_functions()
        self.logger = logger

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
        
        Most code taken from SimpleXMLRPCServer with modifications for wsgi and my custom dispatcher.
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
            # check to see if a subclass implements _dispatch and 
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
                        
                
class HTTPConnection(httplib.HTTPConnection):
    
    def connect(self):
        """Connect to the host and port specified in __init__."""
        msg = "getaddrinfo returns an empty list"
        for res in socket.getaddrinfo(self.host, self.port, 0,
                                      socket.SOCK_STREAM):
            af, socktype, proto, canonname, sa = res
            try:
                self.sock = socket.socket(af, socktype, proto)
                if self.debuglevel > 0:
                    print "connect: (%s, %s)" % (self.host, self.port)
                if CURRENT_DST_PORT[0] > START_DST_PORT+20000:
                    CURRENT_DST_PORT[0] = copy.copy(START_DST_PORT)
                CURRENT_DST_PORT[0] = CURRENT_DST_PORT[0]+1
                self.sock.bind((LOCAL_IP_ADDRESS, CURRENT_DST_PORT[0]))
                self.sock.connect(sa)
            except socket.error, msg:
                if self.debuglevel > 0:
                    print 'connect fail:', (self.host, self.port)
                if self.sock:
                    self.sock.close()
                self.sock = None
                continue
            break
        if not self.sock:
            raise socket.error, msg
            
    def __del__(self):
        if self.sock is not None:
            self.sock.close()
            
            
class WindmillProxyApplication(object):
    """Application to handle requests that need to be proxied"""
    
    def __init__(self, logger):
        self.logger = logger
        
    ConnectionClass = HTTPConnection
    
    def handler(self, environ, start_response):
        """Proxy for requests to the actual http server"""
        url = urlparse(environ['reconstructed_url'])
    
        # Create connection object
        try:
            connection = self.ConnectionClass(url.netloc)
            # Build path
            path = url.geturl().replace('%s://%s' % (url.scheme, url.netloc), '')
        except Exception, e:
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            self.logger.exception('Could not Connect')
            return ['<H1>Could not connect</H1>']

            
        # Read in request body if it exists    
        body = None
        if environ.get('CONTENT_LENGTH'):
            length = int(environ['CONTENT_LENGTH'])
            body = environ['wsgi.input'].read(length)
            
            
        # Build headers
        headers = {}
        self.logger.debug('Environ ; %s' % str(environ))
        for key in environ.keys():
            # Keys that start with HTTP_ are all headers
            if key.startswith('HTTP_'):
                # This is a hacky way of getting the header names right
                value = environ[key]
                key = key.replace('HTTP_', '', 1).swapcase().replace('_', '-')
                if is_hop_by_hop(key) is False:
                    headers[key] = value
    
        # Handler headers that aren't HTTP_ in environ
        if environ.get('CONTENT_TYPE'):
            headers['content-type'] = environ['CONTENT_TYPE']
        
        # Add our host if one isn't defined
        if not headers.has_key('host'):
            headers['host'] = environ['SERVER_NAME']   
    
        # Make the remote request
        try:
            self.logger.debug('%s %s %s' % (environ['REQUEST_METHOD'], path, str(headers)))
            connection.request(environ['REQUEST_METHOD'], path, body=body, headers=headers)
        except:
            # We need exception handling in the case the server fails, it's an edge case but I've seen it
            start_response("501 Gateway error", [('Content-Type', 'text/html')])
            self.logger.exception('Could not Connect')
            return ['<H1>Could not connect</H1>']

        response = connection.getresponse()

        hopped_headers = response.getheaders()
        headers = copy.copy(hopped_headers)
        for header in hopped_headers:
            if is_hop_by_hop(header[0]):
                headers.remove(header)
        
        start_response(response.status.__str__()+' '+response.reason, headers)
    
    
        # Return the proper wsgi response
        # response_body = response.read()
        # 737019
        return [response.read(response.length)]
        
    
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)
    
class WindmillSSLProxyApplication(WindmillProxyApplication):
    
    ConnectionClass = httplib.HTTPSConnection
    
class WindmillChooserApplication(object):
    """Application to handle choosing the proper application to handle each request"""
    def __init__(self, windmill_serv_app, windmill_jsonrpc_app, windmill_xmlrpc_app, windmill_proxy_app, logger):
        self.windmill_serv_app = windmill_serv_app
        self.windmill_jsonrpc_app = windmill_jsonrpc_app
        self.windmill_xmlrpc_app = windmill_xmlrpc_app
        self.windmill_proxy_app = windmill_proxy_app
        self.logger = logger

    def handler(self, environ, start_response):
        """Windmill app chooser"""
        
        reconstruct_url(environ)
        
        if environ['PATH_INFO'].find('/windmill-serv/') is not -1:
            self.logger.debug('dispatching request %s to WindmillServApplication' % environ['reconstructed_url'])
            return self.windmill_serv_app(environ, start_response)
        elif environ['PATH_INFO'].find('/windmill-jsonrpc/') is not -1:
            self.logger.debug('dispatching request %s to WindmillJSONRPCApplication' % environ['reconstructed_url'])
            return self.windmill_jsonrpc_app(environ, start_response)
        elif environ['PATH_INFO'].find('/windmill-xmlrpc/') is not -1:
            self.logger.debug('dispatching request %s to WindmillXMLRPCApplication' % environ['reconstructed_url'])
            return self.windmill_xmlrpc_app(environ, start_response)
        else:
            self.logger.debug('dispatching request %s to WindmillProxyApplication' % reconstruct_url(environ))
            return self.windmill_proxy_app(environ, start_response)
            
    def __call__(self, environ, start_response):
        return self.handler(environ, start_response)
                          
        
def make_windmill_server(http_port=None, js_path=None):
    
    if http_port is None:
        http_port = windmill.settings['SERVER_HTTP_PORT']
    if js_path is None:
        js_path = windmill.settings['JS_PATH']
        
    import convergence
    queue = convergence.ControllerQueue()
    test_resolution_suite = convergence.TestResolutionSuite()
    command_resolution_suite = convergence.CommandResolutionSuite()
    xmlrpc_methods_instance = convergence.XMLRPCMethods(queue, test_resolution_suite, command_resolution_suite)
    jsonrpc_methods_instance = convergence.JSONRPCMethods(queue, test_resolution_suite, command_resolution_suite)
    
    windmill_serv_app = WindmillServApplication(logger=logging.getLogger('server.serv'), js_path=js_path)
    windmill_proxy_app = WindmillProxyApplication(logger=logging.getLogger('server.proxy'))
    windmill_xmlrpc_app =  WindmillXMLRPCApplication(xmlrpc_methods_instance, logger=logging.getLogger('server.xmlrpc'))
    windmill_jsonrpc_app = WindmillJSONRPCApplication(jsonrpc_methods_instance,
                                                      logger=logging.getLogger('server.jsonrpc'))
    windmill_chooser_app = WindmillChooserApplication(windmill_serv_app, windmill_jsonrpc_app,
                                                      windmill_xmlrpc_app, windmill_proxy_app,
                                                      logger=logging.getLogger('server.chooser'))
    
    
    import cherrypy
    httpd =  cherrypy.wsgiserver.CherryPyWSGIServer(('', http_port), windmill_chooser_app, server_name='windmill-http')

    httpd.controller_queue = queue
    httpd.test_resolution_suite = test_resolution_suite
    httpd.command_resolution_suite = command_resolution_suite
    httpd.xmlrpc_methods_instance = xmlrpc_methods_instance
    httpd.jsonrpc_methods_instance = jsonrpc_methods_instance
    
    return httpd

