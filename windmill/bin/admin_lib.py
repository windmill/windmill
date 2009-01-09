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
import logging
from time import sleep
import os, sys
from datetime import datetime
from threading import Thread
import shutil
import socket
import functest
functest.configure()

def process_options(argv_list):
    """Process all the command line options"""
    import admin_options
    admin_options.process_module(admin_options)
    argv_list.pop(0)
    
    action = None
    
    # This might be the hairiest code in windmill :)
    # We have a very specific way we need to parse arguments 
    # because of the way different arguments interact with each other
    # 8/27/2007 Gawd this is ugly, i would love to refactor this but I've
    # forgotten what it does -Mikeal
    # 12/15/2007 Oh man, I'm going to add a feature to this without refactoring it.
    # The issue with this code remains the same and no standard arg parsing 
    # module can do what we need.
    for index in range(len(argv_list)):
        if index <= len(argv_list):
            # Grab the test url if one is given
            if argv_list[index].startswith('http://'):
                windmill.settings['TEST_URL'] = argv_list[index]
                functest.registry['url'] = argv_list[index]
            elif not argv_list[index].startswith('-'):
                # Any argument not starting with - is a regular named option
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
                else:
                     print argv_list[index].split('=')[0]+' is not a windmill argument. Sticking in functest registry.'
                     if argv_list[index].find('=') is not -1:
                         name, value = argv_list[index].split('=')
                         functest.registry[name] = value
                     else:
                         functest.registry[argv_list[index]] = True
                            
            elif argv_list[index].startswith('-'):
                # Take something like -efg and set the e, f, and g options
                options = argv_list[index].replace('-', '')
                for option in options:
                    admin_options.flags_dict[option]()
    
    if action is None:
        # If an action is not defined we default to running the service in the foreground
        return action_mapping['runserver']
    else:
        return action

def setup_servers(console_level=logging.INFO):
    """Setup the server and return httpd and loggers"""
    windmill.is_active = True
    windmill.ide_is_awake = False
    console_handler = logging.getLogger().handlers[0]
    console_handler.setLevel(console_level)
    httpd = windmill.server.wsgi.make_windmill_server()
    return httpd, console_handler

def run_threaded(console_level=logging.INFO):
    """Run the server threaded."""

    httpd, console_handler = setup_servers(console_level)
    
    httpd_thread = Thread(target=httpd.start)
    getattr(httpd_thread, 'setDaemon', lambda x: x)(True)
    httpd_thread.start()
    while not httpd.ready:
        sleep(.25)
    
    return httpd, httpd_thread, console_handler

def configure_global_settings():
    """Configure that global settings for the current run"""
    
    # This logging stuff probably shouldn't be here, it should probably be abstracted
    logging.getLogger().setLevel(0)
    
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter('%(name)-12s: %(levelname)-8s %(message)s')
    console.setFormatter(formatter)
    logging.getLogger().addHandler(console)

    if os.environ.has_key('WINDMILL_CONFIG_FILE'):
        local_settings = os.environ['WINDMILL_CONFIG_FILE']
    else:
        local_settings = None

    windmill.settings = windmill.conf.configure_settings(localSettings=local_settings)
    
    port = windmill.settings['SERVER_HTTP_PORT']
    
    while 1:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(('127.0.0.1', port))
            s.close()
            port += 1
        except socket.error:
            break
    
    windmill.settings['SERVER_HTTP_PORT'] = port
    
    return windmill.settings

on_ide_awake = []

def setup():
    """Setup server and shell objects"""
    global shell_objects_dict
    shell_objects_dict = {}
        
    windmill.settings['shell_objects'] = shell_objects_dict
    assert not windmill.settings.get('setup_has_run', False)

    httpd, httpd_thread, console_log_handler = run_threaded(windmill.settings['CONSOLE_LOG_LEVEL'])

    shell_objects_dict['httpd'] = httpd
    shell_objects_dict['httpd_thread'] = httpd_thread
    
    from windmill.bin import shell_objects
    
    if windmill.settings['CONTINUE_ON_FAILURE'] is not False:
        shell_objects.jsonrpc_client.add_json_command('{"method": "commands.setOptions", "params": {"stopOnFailure" : false}}')
        
    if windmill.settings['EXTENSIONS_DIR'] is not None:
        shell_objects.load_extensions_dir(windmill.settings['EXTENSIONS_DIR'])
                
    if windmill.settings['RUN_TEST'] is not None:
        shell_objects.run_test(windmill.settings['RUN_TEST'])
    if windmill.settings['LOAD_TEST'] is not None:
        shell_objects.load_test(windmill.settings['LOAD_TEST'])
         
    if windmill.settings['JAVASCRIPT_TEST_DIR']:
        shell_objects.run_js_tests(windmill.settings['JAVASCRIPT_TEST_DIR'], 
                                      windmill.settings['JAVASCRIPT_TEST_FILTER'],
                                      windmill.settings['JAVASCRIPT_TEST_PHASE'])
         
    browser = [setting for setting in windmill.settings.keys() if setting.startswith('START_') and \
                                                                  windmill.settings[setting] is True]

    import shell_objects

    if len(browser) is 1:
        shell_objects_dict['browser'] = getattr(shell_objects, browser[0].lower())()

    for attribute in dir(shell_objects):
        shell_objects_dict[attribute] = getattr(shell_objects, attribute)

    shell_objects_dict['setup_has_run'] = True
                
    return shell_objects_dict

def teardown(shell_objects):
    """Teardown the server, threads, and open browsers."""
    if windmill.is_active:
        windmill.is_active = False
    
        shell_objects['clear_queue']()
    
        for controller in windmill.settings['controllers']:
            controller.stop()
            del(controller)
        
        for directory in windmill.teardown_directories:
            if os.path.isdir(directory):
                shutil.rmtree(directory)

        while shell_objects['httpd_thread'].isAlive():
            try:
                shell_objects['httpd'].stop()
            except:
                pass
                
            # Hacking workaround for port locking up on linux.
            try: 
                shell_objects['httpd'].socket.shutdown()
            except:
                pass

def runserver_action(shell_objects):
    """Run the server in the foreground with the options given to the command line"""
    try:
        print 'Server running...'
        if windmill.settings['EXIT_ON_DONE'] and not windmill.settings['JAVASCRIPT_TEST_DIR']:
            while windmill.block_exit or ( 
                    len(shell_objects['httpd'].controller_queue.queue) is not 0 ) or (
                    len(shell_objects['httpd'].test_resolution_suite.unresolved) is not 0 ):
                sleep(.25)
        elif ( windmill.settings['RUN_TEST'] ):
            windmill.runserver_running = True
            while windmill.runserver_running:
                sleep(.25)
        
        else:
            windmill.runserver_running = True
            while windmill.runserver_running:
                sleep(.25)
            
        teardown(shell_objects)

    except KeyboardInterrupt:
        teardown(shell_objects)


def shell_action(shell_objects):
    """Start the windmill shell environment"""
    windmill.in_shell = True
    # If ipython is installed and we weren't given the usecode option
    try:
        assert not windmill.settings['USECODE']
        from IPython.Shell import IPShellEmbed
        ipshell = IPShellEmbed()

        ipshell(local_ns=shell_objects)
    except:
        import code
        code.interact(local=shell_objects)    

    teardown(shell_objects)
    
    
# def wxui_action(shell_objects):
#     """Start the wxPython based service GUI"""
#     try:
#         import wxui
#         app = wxui.App(shell_objects)
#         shell_objects['wxui_app'] = app
#         app.MainLoop()
#         teardown(shell_objects)
#     except ImportError:
#         print 'Failed to import wx, defaulting to the shell'
#         shell_action(shell_objects)    
    
# def tinderbox_action(shell_objects):
#     """Tinderbox action for continuous integration"""
#     shell_objects['jsonrpc_client'].add_json_command('{"method": "commands.setOptions", "params": {"stopOnFailure" : false}}')
#     
#     class ResultsProcessor(object):
#         passed = 0
#         failed = 0
#         def success(self, test, debug):
#             self.passed += 1
#         def failure(self, test, debug):
#             self.failed += 1
#             
#     result_processor = ResultsProcessor()
#     shell_objects['httpd'].test_resolution_suite.result_processor = result_processor
#     
#     starttime = datetime.now()
#     result = None
#         
#     if windmill.settings['RUN_TEST']:    
#         try:
#             while ( len(shell_objects['httpd'].controller_queue.queue) is not 0 ) or (
#                     len(shell_objects['httpd'].test_resolution_suite.unresolved) is not 0 ):
#                 sleep(1)
#         
#             print '#TINDERBOX# Testname = FullSuite'  
#             print '#TINDERBOX# Time elapsed = %s' % str (datetime.now() - starttime)
#             
#             if result_processor.failed > 0 or result_processor.passed is 0:
#                 result = "FAILED"
#             else:
#                 result = "PASSED"
#             
#             print '#TINDERBOX# Status = %s' % result
#             teardown(shell_objects)
#             if result == "FAILED":
#                 sys.exit(1)
# 
#         except KeyboardInterrupt:
#             teardown(shell_objects)
#             if result == "FAILED":
#                 sys.exit(1)
#     else:
#         try:
#             while not windmill.TESTS_COMPLETED:
#                 sleep(1)
#         except KeyboardInterrupt:
#             teardown(shell_objects)
#             if result == "FAILED":
#                 sys.exit(1)
#         
#         print '#TINDERBOX# Testname = FullSuite'  
#         print '#TINDERBOX# Time elapsed = %s' % str (datetime.now() - starttime)
#         if windmill.RESULTS['fail'] > 0 or windmill.RESULTS['pass'] is 0:
#             result = "FAILED"
#         else:
#             result = "PASSED"
#         
#         print '#TINDERBOX# Status = %s' % result
#         teardown(shell_objects)
#         if result == "FAILED":
#             sys.exit(1)

def start_windmill():
    """Start windmill and return shell_objects"""
    configure_global_settings()
    shell_objects = setup()
    return shell_objects

def command_line_startup():
    """Command line startup"""
    windmill.stdout, windmill.stdin = sys.stdout, sys.stdin

    configure_global_settings()

    action = process_options(sys.argv)

    shell_objects = setup()

    action(shell_objects)
            

action_mapping = {'shell':shell_action, 'runserver':runserver_action, 
                  'run_service':runserver_action}

