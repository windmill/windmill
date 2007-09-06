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

logger = logging.getLogger(__name__)

jsonrpc_client = windmill.tools.make_jsonrpc_client()
xmlrpc_client = windmill.tools.make_xmlrpc_client()

from StringIO import StringIO
test_stream_object = StringIO()

def clear_queue():
    xmlrpc_client.clear_queue()
        
windmill.settings['controllers'] = []
        
def start_firefox():
    controller = windmill.browser.get_firefox_controller()
    controller.start()
    windmill.settings['controllers'].append(controller)
    return controller
    
def start_ie():
    controller = windmill.browser.get_ie_controller()
    controller.start()
    windmill.settings['controllers'].append(controller)
    return controller
    
def run_json_test_file(*args):
    filename = ','.join(args)
    if filename.find(',') is not -1:
        for testfile in filename.split(','):
            run_json_test_file(testfile)
        return
    f = open(filename)
    test_strings = [line for line in f.read().splitlines() if line.startswith('{')]
    jsonrpc_client.start_suite(filename.split(os.path.sep)[-1])
    jsonrpc_client.run_json_tests(test_strings)
    jsonrpc_client.stop_suite()
    logger.info('Added tests from %s' % filename)
    
def show_queue():
    return windmill.settings['shell_objects']['httpd'].controller_queue.queue
    
def run_python_test(filename):
    test_run_method = lambda : frame.collect_and_run_tests(filename)
    while not windmill.ide_is_awake:
        sleep(1)
    test_run_method()
    
def load_python_tests(filename):
    xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':False}})
    run_python_test(filename)
    xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':True, 'priority':'normal'}})
    
def load_json_test_file(filename):
    xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':False}})
    run_json_test_file(filename)
    xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':True, 'priority':'normal'}})

def load_json_test_dir(filename):
    xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':False}})
    run_json_test_dir(filename)
    xmlrpc_client.add_command({'method':'commands.setOptions', 'params':{'runTests':True, 'priority':'normal'}})
    
def load_js_tests(dirname):
    # Mount the fileserver application for tests
    from wsgi_fileserver import WSGIFileServerApplication
    application = WSGIFileServerApplication(root_path=os.path.abspath(dirname), mount_point='/windmill-jstest/')
    from windmill.server import wsgi
    wsgi.add_namespace('windmill-jstest', application)
    # Build list of files and send to IDE
    base_url = windmill.settings['TEST_URL']+'/windmill-jstest/'
    xmlrpc_client.add_command({'method':'commands.jsTests', 
                               'params':{'tests':[base_url+f for f in os.listdir(dirname) if f.endswith('.js') ]}})
    
    
def run_json_test_dir(*args):
    # Try to import test_conf
    directory = ','.join(args)
    if directory.find(',') is not -1:
        for testdir in directory.split(','):
            run_json_test_dir(testdir)
        return
    
    try:
        sys.path.insert(0, os.path.abspath(directory))
        import test_conf
        test_list = test_conf.test_list
        sys.modules.pop(test_conf.__name__)
        sys.path.pop(0)
    except ImportError:
        print 'No test_conf.py for this directory, executing all test in directory'
        test_list = [test_name for test_name in os.listdir(os.path.abspath(directory)) if ( 
                     not test_name.startswith('.') and test_name.endswith('.json') )]
        
    for test in test_list:
        run_json_test_file(os.path.abspath(directory)+os.path.sep+test)

def run_given_test_dir():
    run_json_test_dir(windmill.settings['TEST_DIR'])
    
    logger = logging.getLogger(__name__)

