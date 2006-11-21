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
import httplib

CORE_PATH = os.path.abspath('../core')
PORT = 4444

# wsgiref.utils.is_hop_by_hop doesn't pick up proxy-connection so we need to write our own

_hoppish = {
    'connection':1, 'keep-alive':1, 'proxy-authenticate':1,
    'proxy-authorization':1, 'te':1, 'trailers':1, 'transfer-encoding':1,
    'upgrade':1, 'proxy-connection':1 }
    
    
def is_hop_by_hop(header):
    return _hoppish.has_key(header.lower())
        

def guess_content_type(path_info):
    if path_info.endswith('.js'):
        return 'application/x-javascript'
    elif path_info.endswith('.html'):
        return 'text/html'
    else:
        return 'text/plain'
        

def windmill_serv_app(environ, start_response):
    """Application to serve out windmill provided"""
    url = urlparse(environ['PATH_INFO'])
    serve_file = url[2].replace('/windmill-serv/', '')
    #Open file
    f = open('%s/%s' % (CORE_PATH, serve_file), 'r')
    content_type = guess_content_type(environ['PATH_INFO'])
    start_response('200 OK', [('Cache-Control','no-cache'), ('Pragma','no-cache'),
                              ('Content-Type', content_type)])
    return [f.read()]
    
    
def windmill_jsonrpc_app(environ, start_response):
    """JSONRPC service for windmill browser core to communicate with"""
    
    start_response("200 OK", [('Content-Type','text/plain')])
    return ['']
    
    
def windmill_proxy(environ, start_response):
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
    headers = response.getheaders()
    for header in headers:
        if is_hop_by_hop(header[0]):
            headers.remove(header)
    start_response(response.status.__str__()+' '+response.reason, headers)
    return [response_body]
    

def windmill_app_chooser(environ, start_response):
    """Windmill app chooser"""
    print environ['PATH_INFO']
    if environ['PATH_INFO'].find('/windmill-serv/') is not -1:
        return windmill_serv_app(environ, start_response)
    elif environ['PATH_INFO'].find('/windmill-jsonrpc/') is not -1:
        return windmill_jsonrpc_app(environ, start_response)
    else:
        return windmill_proxy(environ, start_response)


import SocketServer

class ThreadedWSGIServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):

    """Threaded WSGI Server. Does not inherit from wsgiref.simple_server.WSGIServer because
    of a static call to BaseHTTPServer.HTTPServer"""

    application = None

    def server_bind(self):
        """Override server_bind to store the server name."""
        SocketServer.TCPServer.server_bind(self)
        
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

def main(port=PORT):
    httpd = make_server('', port, windmill_app_chooser, server_class=ThreadedWSGIServer)
    print "Serving HTTP on port %s..." % port

    # Respond to requests until process is killed
    httpd.serve_forever()
