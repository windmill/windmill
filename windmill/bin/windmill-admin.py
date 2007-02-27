#!/usr/bin/env python
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

import os, sys

WINDMILL_DIR = os.path.abspath(os.path.abspath(sys.modules[__name__].__file__)+'/'+os.path.pardir+'/'+os.path.pardir+'/'+os.path.pardir)
sys.path.insert(0, WINDMILL_DIR)

import windmill

from threading import Thread
import logging

def configure_global_settings():
    # Get local config
    
    if os.environ.has_key('WINDMILL_CONFIG_FILE'):
        sys.path.insert(0, os.path.dirname(os.path.abspath(os.environ['WINDMILL_CONFIG_FILE'])))
        local_settings = __import__(os.path.basename(os.path.abspath(os.environ['WINDMILL_CONFIG_FILE'])))
        sys.path.remove(os.path.dirname(os.path.abspath(os.environ['WINDMILL_CONFIG_FILE'])))
    else:
        try:
            import windmill_settings as local_settings
        except:
            local_settings = object()
            
    windmill.settings = windmill.conf.configure_settings(local_settings)
    
    
def runserver(cmd_options):
    import windmill
    
    if cmd_options.has_key('daemon'):
        httpd, httpd_thread, console_log_handler = windmill.bin.run_server.run_threaded()
        httpd_thread.setDaemon(True)
        if windmill.settings['TEST_FILE'] is not None:
            jsonrpc_client = windmill.tools.make_jsonrpc_client()
            windmill.bin.run_tests.run_test_file(windmill.settings['TEST_FILE'], jsonrpc_client)
    else:
        httpd, loggers = windmill.bin.run_server.setup_servers(windmill.settings['CONSOLE_LOG_LEVEL'])
        try:
            httpd_thread = Thread(target=httpd.start)
            httpd_thread.start()
            if windmill.settings['TEST_FILE'] is not None:
                jsonrpc_client = windmill.tools.make_jsonrpc_client()
                windmill.bin.run_tests.run_test_file(windmill.settings['TEST_FILE'], jsonrpc_client)
        except KeyboardInterrupt:
            while httpd.is_alive():
                httpd.stop()
            sys.exit()
    
def shell(cmd_options):
    import windmill, simplejson 
    if cmd_options['debug'] is True:
        import pdb
    
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
    
    # Run unittests
    def unittest():
        logger = logging.getLogger('unittests')
        setup_dict = {'httpd':httpd, 'httpd_thread':httpd_thread, 'jsonrpc_client':jsonrpc_client,
                'xmlrpc_client':xmlrpc_client, 'run_test_file':run_test_file}

        for test in windmill.test.tests:
            test(setup_dict)
    
    # If we have a test file we should add all the tests
    if windmill.settings['TEST_FILE'] is not None:
        windmill.bin.run_tests.run_test_file(windmill.settings['TEST_FILE'], jsonrpc_client)
        
    if windmill.settings['TEST_DIR'] is not None:
        # Try to import test_conf
        sys.path.insert(0, windmill.settings['TEST_DIR'])
        try:
            import test_conf
            test_list = test_conf.test_list
        except:
            print 'No test_conf.py for this directory, executing all test in directory'
            test_list = [test_name for test_name in os.listdir(windmill.settings['TEST_DIR']) if not test_name.startswith('.') and test_name.endswith('.json')]
        
        print test_list
        
        for test in test_list:
            run_test_file(windmill.settings['TEST_DIR']+'/'+test)
            
        
        
    def clear_queue():
        response = jsonrpc_client.next_action()
        while response['result']['method'] != 'defer':
            response = jsonrpc_client.next_action()

    # If ipython is installed and we weren't given the usecode option
    if hasattr(windmill.tools.dev_environment, 'IPyShell') is True and cmd_options['usecode'] is False:
        import IPython
        shell = IPython.Shell.IPShell(user_ns=locals(), shell_class=windmill.tools.dev_environment.IPyShell)
        shell.IP.httpd = httpd
        shell.IP.httpd_thread = httpd_thread

        shell.mainloop()
    else:
        try:
            import code
            code.interact(local=locals())    
        except KeyboardInterrupt:
            while httpd_thread.isAlive() is True:
                httpd.stop()
                time.sleep(.5)
            sys.exit()
                
                    
action_mapping = {'shell':shell, 'runserver':runserver}

def loglevel(value):
    import logging
    level = getattr(logging, value)
    windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, value)
    return level
    
def debug(value):
    import logging
    windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, 'DEBUG')
    
def testfile(value):
    windmill.settings['TEST_FILE'] = os.path.abspath(value)
    
def testdir(value):
    windmill.settings['TEST_DIR'] = os.path.abspath(value)

cmd_parse_mapping = {'loglevel':loglevel, 'debug':debug, 'testfile':testfile, 'testdir':testdir}

def parse_commands():
    
    action = sys.argv[1]
    sys.argv.pop(0)
    sys.argv.pop(0)
    # Set defaults
    cmd_options = {'debug':False, 'usecode':False}
    for option in sys.argv:
        if option.startswith('http'):
            windmill.settings.TEST_URL = option
            key = False
        elif option.find('=') is not -1:
            key, value = option.split('=')
            cmd_options[key] = value
        else:
            key = option
            cmd_options[key] = True
            
        if cmd_parse_mapping.has_key(key):
            cmd_options[key] = cmd_parse_mapping[key](cmd_options[key])
    
    return action, cmd_options
    
    

if __name__ == "__main__":

    
    configure_global_settings()
    action, cmd_options = parse_commands()
    
    action_mapping[action](cmd_options)
    
    








