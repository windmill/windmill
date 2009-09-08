#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
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

initial_forwarding_conditions = [
    lambda e : 'google.com/safebrowsing/downloads' not in e['reconstructed_url'],
    lambda e : 'mozilla.org/en-US/firefox/livebookmarks.html' not in e['reconstructed_url'],
    lambda e : e.get('CONTENT_TYPE') != 'application/x-shockwave-flash',
    lambda e : not e['reconstructed_url'].endswith(".mozilla.com/firefox/headlines.xml")
    ]
# 
# def add_forward_condition(condition):
#     forwarding_conditions.append(condition)
#     
# def remove_forward_condition(condition):
#     while condition in forwarding_conditions:
#         forwarding_conditions.remove(condition)
# 
import os

from webenv.rest import RestApplication
from webenv.applications.file_server import FileServerApplication

import windmill
import https
from proxy import ProxyApplication
from jsonrpc import JSONRPCApplication
from xmlrpc import XMLRPCApplication
from convergence import XMLRPCMethods, JSONRPCMethods, TestResolutionSuite, CommandResolutionSuite, ControllerQueue
from compressor import CompressorApplication

# 
# class RestIntegrator(object):
#     def __init__(self, name, application):
#         application.ns = name
#         
#     
#     def rest_handler(self, request, *path):
#         

class WindmillApplication(RestApplication):
    def __init__(self, js_path=None, compression_enabled=None):
        super(WindmillApplication, self).__init__()
        
        if js_path is None:
            js_path = windmill.settings['JS_PATH']
        if compression_enabled is None:
            compression_enabled = not windmill.settings['DISABLE_JS_COMPRESS']
        
        self.proxy_application = ProxyApplication()
        self.test_resolution_suite = TestResolutionSuite()
        self.command_resolution_suite = CommandResolutionSuite()
        self.queue = ControllerQueue(self.command_resolution_suite, self.test_resolution_suite)
        self.xmlrpc_methods_instance = XMLRPCMethods(self.queue, self.test_resolution_suite, 
                                                     self.command_resolution_suite, 
                                                     proxy=self.proxy_application)
        self.jsonrpc_methods_instance = JSONRPCMethods(self.queue, self.test_resolution_suite, 
                                                       self.command_resolution_suite, 
                                                       proxy=self.proxy_application)
        
        self.add_resource('windmill-jsonrpc', JSONRPCApplication(instance=self.jsonrpc_methods_instance))
        self.add_resource('windmill-serv', FileServerApplication(js_path))
        self.add_resource('windmill-xmlrpc', XMLRPCApplication(instance=self.xmlrpc_methods_instance))
        self.add_resource('windmill-compressor', CompressorApplication(os.path.join(js_path, 'js'), 
                                                                       compression_enabled))
    def handler(self, request, *path):
        return self.proxy_application.handler(request)

def make_server(http_port=None, js_path=None, compression_enabled=None):
    if http_port is None:
        http_port = windmill.settings['SERVER_HTTP_PORT']
            
    if windmill.has_ssl:
        import certificate
        cc = certificate.CertificateCreator()
    else:
        cc = None
    
    application = WindmillApplication(js_path=js_path, compression_enabled=compression_enabled)    
    httpd = https.WindmillHTTPServer(('0.0.0.0', http_port),
                                     https.WindmillHTTPRequestHandler, cc,
                                     application)

    # Attach some objects to httpd for convenience and reverse compatibility 
    httpd.controller_queue = application.queue
    httpd.test_resolution_suite = application.test_resolution_suite
    httpd.command_resolution_suite = application.command_resolution_suite
    httpd.xmlrpc_methods_instance = application.xmlrpc_methods_instance
    httpd.jsonrpc_methods_instance = application.jsonrpc_methods_instance
    
    # Global declarations.
    # Eventually it would be great to get rid of these provided we have some way of passing 
    # the current server instance to test modules.
    global add_namespace
    add_namespace = application.add_resource
    
    # These globals are renamed for reverse compatibility
    global add_forward_condition
    add_forward_condition = application.proxy_application.fm.add_environ_condition
    global remove_forward_condition
    remove_forward_condition = application.proxy_application.fm.remove_environ_condition

    for c in initial_forwarding_conditions:
        add_forward_condition(c)

    return httpd