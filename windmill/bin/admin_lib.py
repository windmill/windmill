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
import os, sys, inspect
from threading import Thread

def process_options(argv_list):
    """Process all the command line options"""
    import admin_options
    admin_options.process_module(admin_options)
    argv_list.pop(0)
    
    action = None
    
    for index in range(len(argv_list)):
        if index <= len(argv_list):
            if argv_list[index].startswith('--') or not argv_list[index].startswith('-'):
                value = None
                if argv_list[index].find('=') is not -1:
                    name, value = argv_list[index].split('=')
                    name = name.replace('--', '')
                else:
                    name = argv_list[index].replace('--', '')    
                    
                if admin_options.options_dict.has_key(name):    
                    processor = admin_options.options_dict[name]
                    if value is None:
                        try:
                            processor()
                        except TypeError:
                            processor(argv_list.pop(index+1))
                    else:
                        processor(value)
                elif name in action_mapping.keys():
                    action = action_mapping[name]
                    
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

    shell_objects = {}

    httpd, httpd_thread, console_log_handler = admin_lib.run_threaded(windmill.settings['CONSOLE_LOG_LEVEL'])

    shell_objects['httpd'] = httpd
    shell_objects['httpd_thread'] = httpd_thread
    
    from windmill.bin import shell_commands

    if windmill.settings['TEST_FILE'] is not None:
         shell_commands.run_test_file(windmill.settings['TEST_FILE'], jsonrpc_client)

    if windmill.settings['TEST_DIR'] is not None:
         shell_commands.run_given_test_dir() 

    import shell_commands
    for attribute in dir(shell_commands):
        if callable(getattr(shell_commands, attribute)):
            shell_objects[attribute] = getattr(shell_commands, attribute)

    return shell_objects


def teardown(shell_objects):

    for controller in windmill.settings['controllers']:
        controller.stop()
        time.sleep(1)

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

action_mapping = {'shell':shell_action, 'runserver':runserver_action}

