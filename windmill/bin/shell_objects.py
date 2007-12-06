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

import windmill
import sys, os, logging
from time import sleep
from windmill.authoring import frame
from threading import Thread
import functest

logger = logging.getLogger(__name__)

jsonrpc_client = windmill.tools.make_jsonrpc_client()
xmlrpc_client = windmill.tools.make_xmlrpc_client()

from StringIO import StringIO
test_stream_object = StringIO()

def clear_queue():
    """Clear the Service's current queue of tests/actions."""
    xmlrpc_client.clear_queue()
        
windmill.settings['controllers'] = []
        
def start_firefox():
    """Start the Firefox web browser configured for windmill"""
    controller = windmill.browser.get_firefox_controller()
    controller.start()
    windmill.settings['controllers'].append(controller)
    return controller
    
def start_ie():
    """Start the Internet Explorer web browser configured for windmill"""
    controller = windmill.browser.get_ie_controller()
    controller.start()
    windmill.settings['controllers'].append(controller)
    return controller
    
def start_safari():
    """Start the Safari web browser configured for windmill"""
    controller = windmill.browser.get_safari_controller()
    controller.start()
    windmill.settings['controllers'].append(controller)
    return controller
    
# def run_json_test_file(*args):
#     """Run the json test files passed to this function"""
#     filename = ','.join(args)
#     if filename.find(',') is not -1:
#         for testfile in filename.split(','):
#             run_json_test_file(testfile)
#         return
#     f = open(filename)
#     test_strings = [line for line in f.read().splitlines() if line.startswith('{')]
#     jsonrpc_client.start_suite(filename.split(os.path.sep)[-1])
#     jsonrpc_client.run_json_tests(test_strings)
#     jsonrpc_client.stop_suite()
#     logger.info('Added tests from %s' % filename)

def show_queue():
    """Return the current queue of tests and commands in windmill"""
    return windmill.settings['shell_objects']['httpd'].controller_queue.queue

def do_test(filename, load=False):
    """Run or load the test file or directory passed to this function"""
    def json_test(filename):
        return os.path.dirname(os.path.abspath(filename)), [
                               f for f in filename.split('/') if f != ''][-1].split('.')[0]
    def python_test(filename):
        return os.path.abspath(filename), ''
    def directory_test(filename):
        return os.path.abspath(filename), ''
    
    module_name, filter_string = {'.py' :python_test, 
                                  'json':json_test}.get(filename.split('.')[-1],
                                                        directory_test)(filename)
    
    def run_functest():
        functest.global_settings.test_filter = filter_string
        from windmill.authoring import WindmillFunctestRunner
        functest.run_framework(test_args=[module_name], test_runner=WindmillFunctestRunner())
        if load:
            xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':True, 'priority':'normal'}})
    run_functest_thread = Thread(target=run_functest)
    from windmill.bin import admin_lib
    admin_lib.on_ide_awake.append(run_functest_thread.start)

run_test = lambda filename : do_test(filename, load=False)
run_test.__name__ = 'run_test'
run_test.__doc__ = "Run the test file or directory passed to this function"

load_test = lambda filename : do_test(filename, load=True)    
load_test.__name__ = 'load_test'
run_test.__doc__ = "Load the test file or directory passed to this function"   
    
# def load_python_tests(filename):
#     """Load a python test file's controller actions in to the server and pass to the IDE without running."""
#     xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':False}})
#     run_python_test(filename, load=True)
#     
# def load_json_test_file(filename):
#     """Load a JSON test file's controller actions in to the server and pass to the IDE without running."""
#     # xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':False}})
#     # run_json_test_file(filename)
#     # xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':True, 'priority':'normal'}})
# 
# def load_json_test_dir(filename):
#     """Load a JSON test dir's controller actions in to the server and pass to the IDE without running."""
#     xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':False}})
#     run_json_test_dir(filename)
#     xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':True, 'priority':'normal'}})
#     
# def run_js_test_dir(dirname):
#     """Mount the directory and send all javascript file links to the IDE in order to execute those test urls under the jsUnit framework"""
#     # Mount the fileserver application for tests
#     from wsgi_fileserver import WSGIFileServerApplication
#     application = WSGIFileServerApplication(root_path=os.path.abspath(dirname), mount_point='/windmill-jstest/')
#     from windmill.server import wsgi
#     wsgi.add_namespace('windmill-jstest', application)
#     # Build list of files and send to IDE
#     base_url = windmill.settings['TEST_URL']+'/windmill-jstest'
#     
#     js_files = []
#     def parse_files(x, directory, files):
#         if not os.path.split(directory)[-1].startswith('.'):
#             additional_dir = directory.replace(dirname, '')
#             js_files.extend( [additional_dir+'/'+f for f in files if f.endswith('.js')]  )
#     os.path.walk(dirname, parse_files, 'x') 
#     
#     xmlrpc_client.add_command({'method':'commands.jsTests', 
#                                'params':{'tests':[base_url+f for f in js_files ]}})
#     
# def run_json_test_dir(*args):
#     """Run the directory[s] of JSON tests."""
#     # Try to import test_conf
#     directory = ','.join(args)
#     if directory.find(',') is not -1:
#         for testdir in directory.split(','):
#             run_json_test_dir(testdir)
#         return
#     
#     try:
#         sys.path.insert(0, os.path.abspath(directory))
#         import test_conf
#         test_list = test_conf.test_list
#         sys.modules.pop(test_conf.__name__)
#         sys.path.pop(0)
#     except ImportError:
#         print 'No test_conf.py for this directory, executing all test in directory'
#         test_list = [test_name for test_name in os.listdir(os.path.abspath(directory)) if ( 
#                      not test_name.startswith('.') and test_name.endswith('.json') )]
#         
#     for test in test_list:
#         run_json_test_file(os.path.abspath(directory)+os.path.sep+test)
# 
# def run_given_test_dir():
#     """Run the directory[s] of JSON tests that are currently set in windmill. These can be set as a command line option or by a local setting preference."""
#     run_json_test_dir(windmill.settings['TEST_DIR'])
#     
#     logger = logging.getLogger(__name__)

