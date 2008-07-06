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
from time import sleep
logger = logging.getLogger(__name__)

import windmill
from windmill.server import proxy
import wsgi_jsonrpc
import wsgi_xmlrpc
import wsgi_fileserver

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
    url += environ.get('SCRIPT_NAME','')
    url += environ.get('PATH_INFO','')
    # Fix ;arg=value in url
    if url.find('%3B') is not -1:
        url, arg = url.split('%3B', 1)
        url = ';'.join([url, arg.replace('%3D', '=')])
    # Stick query string back in
    if environ.get('QUERY_STRING'):
        url += '?' + environ['QUERY_STRING']
    # Stick it in environ for convenience     
    environ['reconstructed_url'] = url
    return url

HTTPConnection = httplib.HTTPConnection            
            
WindmillProxyApplication = proxy.WindmillProxyApplication
WindmillProxyApplication.ConnectionClass = HTTPConnection            

add_namespace = None

class WindmillChooserApplication(object):
    """Application to handle choosing the proper application to handle each request"""
    def __init__(self, apps, proxy):
        self.namespaces = dict([ (arg.ns, arg) for arg in apps ])
        self.proxy = proxy
        
    def add_namespace(self, name, application):
        """Add an application to a specific url namespace in windmill"""
        self.namespaces[name] = application

    def handler(self, environ, start_response):
        """Windmill app chooser"""
        sleep(.2)
        reconstruct_url(environ)

        for key in self.namespaces.keys():
            if environ['PATH_INFO'].find('/'+key+'/') is not -1:
                logger.debug('dispatching request %s to %s' % (environ['reconstructed_url'], key))
                return self.namespaces[key](environ, start_response)

        logger.debug('dispatching request %s to WindmillProxyApplication' % reconstruct_url(environ))
        response = self.proxy(environ, start_response)
        return response
            
    def __call__(self, environ, start_response):
        response = self.handler(environ, start_response)
        for x in response:
            yield x
        
def make_windmill_server(http_port=None, js_path=None):
    
    if http_port is None:
        http_port = windmill.settings['SERVER_HTTP_PORT']
    if js_path is None:
        js_path = windmill.settings['JS_PATH']
        
    # Start up all the convergence objects    
    import convergence
    test_resolution_suite = convergence.TestResolutionSuite()
    command_resolution_suite = convergence.CommandResolutionSuite()
    queue = convergence.ControllerQueue(command_resolution_suite, test_resolution_suite)
    xmlrpc_methods_instance = convergence.XMLRPCMethods(queue, test_resolution_suite, command_resolution_suite)
    jsonrpc_methods_instance = convergence.JSONRPCMethods(queue, test_resolution_suite, command_resolution_suite)
    
    # Start up all the wsgi applications
    windmill_serv_app = wsgi_fileserver.WSGIFileServerApplication(root_path=js_path, mount_point='/windmill-serv/')
    windmill_proxy_app = WindmillProxyApplication()
    windmill_xmlrpc_app =  wsgi_xmlrpc.WSGIXMLRPCApplication(instance=xmlrpc_methods_instance)
    windmill_jsonrpc_app = wsgi_jsonrpc.WSGIJSONRPCApplication(instance=jsonrpc_methods_instance)
    windmill_serv_app.ns = 'windmill-serv'
    windmill_xmlrpc_app.ns = 'windmill-xmlrpc'
    windmill_jsonrpc_app.ns = 'windmill-jsonrpc'
    windmill_chooser_app = WindmillChooserApplication(apps=[windmill_serv_app, windmill_jsonrpc_app,
                                                      windmill_xmlrpc_app], proxy=windmill_proxy_app)
    
    # Make add_namespace available at the module level
    global add_namespace
    add_namespace = windmill_chooser_app.add_namespace
    
    from cherrypy import wsgiserver
    httpd = wsgiserver.CherryPyWSGIServer(('0.0.0.0', http_port), 
                       windmill_chooser_app, server_name='windmill-http', numthreads=50)

    # Attach some objects to httpd for convenience
    httpd.controller_queue = queue
    httpd.test_resolution_suite = test_resolution_suite
    httpd.command_resolution_suite = command_resolution_suite
    httpd.xmlrpc_methods_instance = xmlrpc_methods_instance
    httpd.jsonrpc_methods_instance = jsonrpc_methods_instance
    
    return httpd

