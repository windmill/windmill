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

## Note: This file is very trim now because we've broken wsgi_fileserver, wsgi_proxy, wsgi_jsonrpc, and wsgi_xmlrpc 
## in to their own libraries which are now distributed on their own and treated as dependencies 

import httplib
import copy
import socket 
import random
from urlparse import urlparse
import logging
logger = logging.getLogger(__name__)

import windmill
import wsgi_jsonrpc
import wsgi_xmlrpc
import wsgi_proxy
import wsgi_fileserver

PORT = 4444

START_DST_PORT = 32000
CURRENT_DST_PORT = [random.randint(32000, 34000)]
    
def reconstruct_url(environ):
    # From WSGI spec, PEP 333
    from urllib import quote
    url = environ['wsgi.url_scheme']+'://'
    if environ.get('HTTP_HOST'): url += environ['HTTP_HOST']
    else:
        url += environ['SERVER_NAME']
        if environ['wsgi.url_scheme'] == 'https':
            if environ['SERVER_PORT'] != '443':
               url += ':' + environ['SERVER_PORT']
        else:
            if environ['SERVER_PORT'] != '80':
               url += ':' + environ['SERVER_PORT']
    url += quote(environ.get('SCRIPT_NAME',''))
    url += quote(environ.get('PATH_INFO','')).replace(url.replace(':', '%3A'), '')
    if environ.get('QUERY_STRING'):
        url += '?' + environ['QUERY_STRING']
    environ['reconstructed_url'] = url
    return url
    
         
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
                self.sock.bind((None, CURRENT_DST_PORT[0]))
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

HTTPConnection = httplib.HTTPConnection            
            
WindmillProxyApplication = wsgi_proxy.WSGIProxyApplication
WindmillProxyApplication.ConnectionClass = HTTPConnection            


class WindmillChooserApplication(object):
    """Application to handle choosing the proper application to handle each request"""
    def __init__(self, windmill_serv_app, windmill_jsonrpc_app, windmill_xmlrpc_app, windmill_proxy_app):
        self.windmill_serv_app = windmill_serv_app
        self.windmill_jsonrpc_app = windmill_jsonrpc_app
        self.windmill_xmlrpc_app = windmill_xmlrpc_app
        self.windmill_proxy_app = windmill_proxy_app

    def handler(self, environ, start_response):
        """Windmill app chooser"""
        
        reconstruct_url(environ)
        
        if environ['PATH_INFO'].find('/windmill-serv/') is not -1:
            logger.debug('dispatching request %s to WindmillServApplication' % environ['reconstructed_url'])
            return self.windmill_serv_app(environ, start_response)
        elif environ['PATH_INFO'].find('/windmill-jsonrpc/') is not -1:
            logger.debug('dispatching request %s to WindmillJSONRPCApplication' % environ['reconstructed_url'])
            return self.windmill_jsonrpc_app(environ, start_response)
        elif environ['PATH_INFO'].find('/windmill-xmlrpc/') is not -1:
            logger.debug('dispatching request %s to WindmillXMLRPCApplication' % environ['reconstructed_url'])
            return self.windmill_xmlrpc_app(environ, start_response)
        else:
            logger.debug('dispatching request %s to WindmillProxyApplication' % reconstruct_url(environ))
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
    
    windmill_serv_app = wsgi_fileserver.WSGIFileServerApplication(root_path=js_path, mount_point='/windmill-serv/')
    windmill_proxy_app = WindmillProxyApplication()
    windmill_xmlrpc_app =  wsgi_xmlrpc.WSGIXMLRPCApplication(instance=xmlrpc_methods_instance)
    windmill_jsonrpc_app = wsgi_jsonrpc.WSGIJSONRPCApplication(instance=jsonrpc_methods_instance)
    windmill_chooser_app = WindmillChooserApplication(windmill_serv_app, windmill_jsonrpc_app,
                                                      windmill_xmlrpc_app, windmill_proxy_app)
    
    import cherrypy
    httpd = cherrypy.wsgiserver.CherryPyWSGIServer(('', http_port), windmill_chooser_app, server_name='windmill-http')

    # Attach some objects to httpd for convenience
    httpd.controller_queue = queue
    httpd.test_resolution_suite = test_resolution_suite
    httpd.command_resolution_suite = command_resolution_suite
    httpd.xmlrpc_methods_instance = xmlrpc_methods_instance
    httpd.jsonrpc_methods_instance = jsonrpc_methods_instance
    
    return httpd

