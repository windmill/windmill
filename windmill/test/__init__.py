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

import logging

logger = logging.getLogger(__name__)

def set_up(logger=logger):
    import windmill, simplejson 

    httpd, httpd_thread, console_log_handler = windmill.bin.run_server.run_threaded(windmill.settings['CONSOLE_LOG_LEVEL'])

    # setup all usefull objects
    jsonrpc_client = windmill.tools.make_jsonrpc_client()
    xmlrpc_client = windmill.tools.make_xmlrpc_client()

    # Convenience callable class for running a text test file.
    class _RunTestFile(object):
        client = jsonrpc_client
        def __call__(self, filename):
            windmill.bin.run_tests.run_test_file(filename, self.client)        
    run_test_file = _RunTestFile()

    return {'httpd':httpd, 'httpd_thread':httpd_thread, 'logger':logger, 'jsonrpc_client':jsonrpc_client,
            'xmlrpc_client':xmlrpc_client, 'run_test_file':run_test_file}
            
import test_all, test_browser, test_jsonrpc, test_proxy, test_xmlrpc
tests = [test_jsonrpc.test_json_tests]