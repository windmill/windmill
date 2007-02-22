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


def setup_module(module):
    import windmill, simplejson 
    
    windmill.conf.configure_settings()
    
    httpd, httpd_thread, console_log_handler = windmill.bin.run_server.run_threaded()

    # setup all usefull objects
    jsonrpc_client = windmill.tools.make_jsonrpc_client()
    xmlrpc_client = windmill.tools.make_xmlrpc_client()

    module.httpd = httpd
    module.httpd_thread = httpd_thread
    module.console_log_handler = console_log_handler
    module.jsonrpc_client = jsonrpc_client
    module.xmlrpc_client = xmlrpc_client
    
    if hasattr(module, 'test_dict'):
        for key, test in module.test_dict.items():
            test.httpd = httpd
            test.httpd_thread = httpd_thread
            test.console_log_handler = console_log_handler
            test.jsonrpc_client = jsonrpc_client
            test.xmlrpc_client = xmlrpc_client
    
def teardown_module(module):
    
    while module.httpd_thread.isAlive():
        module.httpd.stop()
    
