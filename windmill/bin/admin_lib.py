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

import windmill
import logging, time
import os, sys, inspect, shutil
from datetime import datetime
from threading import Thread

def process_options(argv_list):
    """Process all the command line options"""
    import admin_options
    admin_options.process_module(admin_options)
    argv_list.pop(0)
    
    action = None
    
    for index in range(len(argv_list)):
        if index <= len(argv_list):
            if argv_list[index].startswith('http://'):
                windmill.settings['TEST_URL'] = argv_list[index]
            elif not argv_list[index].startswith('-'):
                if argv_list[index][0].islower():
                    value = None
                    if argv_list[index].find('=') is not -1:
                        name, value = argv_list[index].split('=')
                    else:
                        name = argv_list[index]
                    
                    if admin_options.options_dict.has_key(name):    
                        processor = admin_options.options_dict[name]
                        if value is None:
                            processor()
                        else:
                            processor(value)
                    elif name in action_mapping.keys():
                        action = action_mapping[name]
                elif argv_list[index][0].isupper():
                    value = argv_list[index][0]
                    if value.find('=') is not -1:
                        name, value = value.split('=')
                        windmill.settings[name] = value
                    else:
                        if windmill.settings[value] is True:
                            windmill.settings[value] = False
                        elif windmill.settings[value] is False:
                            windmill.settings[value] = True
                            
            elif argv_list[index].startswith('-'):
                options = argv_list[index].replace('-')
                for option in options:
                    admin_options.flags_dict[option]()
              
            
                    
    if action is None:
        return action_mapping['runserver']
    else:
        return action
                

def setup_servers(console_level=logging.INFO):
    """Setup the server and return httpd and loggers"""
    console_handler = windmill.server.logger.setup_root_logger(console_level=console_level)
    httpd = windmill.server.wsgi.make_windmill_server()
    return httpd, console_handler

def run_threaded(console_level=logging.INFO):
    """Run the server with various values"""

    httpd, console_handler = setup_servers(console_level)
    
    httpd_thread = Thread(target=httpd.start)
    httpd_thread.start()
    
    time.sleep(1)
    return httpd, httpd_thread, console_handler

def configure_global_settings():
    # Get local config

    if os.environ.has_key('WINDMILL_CONFIG_FILE'):
        sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.expanduser(os.environ['WINDMILL_CONFIG_FILE']))))
        local_settings = __import__(os.path.basename(os.environ['WINDMILL_CONFIG_FILE'].split('.')[0]))
        sys.path.remove(os.path.abspath(os.path.dirname(os.path.expanduser(os.environ['WINDMILL_CONFIG_FILE']))))
    else:
        try:
            import windmill_settings as local_settings
        except:
            local_settings = object()

    windmill.settings = windmill.conf.configure_settings(local_settings)



def setup():
    """Setup server and shell objects"""
    from windmill.bin import admin_lib

    shell_objects_dict = {}

    httpd, httpd_thread, console_log_handler = admin_lib.run_threaded(windmill.settings['CONSOLE_LOG_LEVEL'])

    shell_objects_dict['httpd'] = httpd
    shell_objects_dict['httpd_thread'] = httpd_thread
    
    from windmill.bin import shell_objects
    
    if windmill.settings['CONTINUE_ON_FAILURE'] is not False:
        jsonrpc_client.add_json_command('{"method": "setOptions", "params": {"stopOnFailure" : false}}')

    if windmill.settings['TEST_FILE'] is not None:
         shell_objects.run_test_file(windmill.settings['TEST_FILE'], jsonrpc_client)

    if windmill.settings['TEST_DIR'] is not None:
         shell_objects.run_given_test_dir() 
         
    browser = [setting for setting in windmill.settings.keys() if setting.startswith('START_') and \
                                                                  windmill.settings[setting] is True]

    import shell_objects

    if len(browser) is 1:
        shell_objects_dict['browser'] = getattr(shell_objects, browser[0].lower())()

    for attribute in dir(shell_objects):
        shell_objects_dict[attribute] = getattr(shell_objects, attribute)

    windmill.settings['shell_objects'] = shell_objects_dict
    return shell_objects_dict


def teardown(shell_objects):

    for controller in windmill.settings['controllers']:
        controller.stop()
        time.sleep(1)
        
    if windmill.settings['MOZILLA_REMOVE_PROFILE_ON_EXIT'] is True:
        shutil.rmtree(windmill.settings['MOZILLA_PROFILE_PATH'])

    while shell_objects['httpd_thread'].isAlive():
        shell_objects['httpd'].stop()

def runserver_action(shell_objects):

    try:
        
        print 'Server running...'
        if not windmill.settings['EXIT_ON_DONE']:
            while 1:
                pass
        else:
            while len(shell_objects['httpd'].controller_queue.test_queue) is not 0 or \
                  len(shell_objects['httpd'].controller_queue.command_queue) is not 0:
                pass
            
            teardown(shell_objects)

    except KeyboardInterrupt:
        teardown(shell_objects)

def shell_action(shell_objects):

    # If ipython is installed and we weren't given the usecode option
    try:
        from IPython.Shell import IPShellEmbed
        ipshell = IPShellEmbed()

        ipshell(local_ns=shell_objects)
    except:
        import code
        code.interact(local=shell_objects)    

    teardown(shell_objects)
    
def tinderbox_action(shell_objects):
    
    shell_objects['jsonrpc_client'].add_json_command('{"method": "setOptions", "params": {"stopOnFailure" : false}}')
    
    class ResultsProcessor(object):
        passed = 0
        failed = 0
        def success(self, test):
            self.passed += 1
        def failure(self, test):
            self.failed += 1
            
    result_processor = ResultsProcessor()
    shell_objects['httpd'].test_resolution_suite.result_processor = result_processor
        
    try:
        starttime = datetime.now()
        while len(shell_objects['httpd'].controller_queue.test_queue) is not 0 or \
              len(shell_objects['httpd'].controller_queue.command_queue) is not 0:
            pass
        
        print '#TINDERBOX# Testname = FullSuite'  
        print '#TINDERBOX# Time elapsed = %s' % str (datetime.now() - starttime)
            
        if result_processor.failed > 0 or result_processor.passed is 0:
            result = "FAILED"
        else:
            result = "PASSED"
            
        print '#TINDERBOX# Status = %s' % result
        teardown(shell_objects)
        if result == "FAILED":
            sys.exit(1)

    except KeyboardInterrupt:
        teardown(shell_objects)
        if result == "FAILED":
            sys.exit(1)

action_mapping = {'shell':shell_action, 'runserver':runserver_action, 'tbox':tinderbox_action}

