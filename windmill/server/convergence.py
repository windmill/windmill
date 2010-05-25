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

"""This module provides the communication and management between the various 
server interfaces and the browser's js interface"""

import copy, os, sys
from windmill.dep import json
import logging
from windmill.dep import uuid
import windmill
from time import sleep

test_results_logger = logging.getLogger('test_results')

class ControllerQueue(object):
    
    def __init__(self, command_resolution_suite, test_resolution_suite): 
        self.resolution_suites = {'test': test_resolution_suite,
                                  'command': command_resolution_suite}
        self.queue = []
        self.current_suite = None
        
    def add_command(self, command, suite_name=None):
        """Add Command to the controller queue"""
        if suite_name is None and not command.get('suite_name'):
            suite_name = self.current_suite
        command['suite_name'] = suite_name
        
        if command['params'].get('priority', None):
            priority = command['params'].pop('priority')
        else:
            priority = None
        
        command['type'] = 'command'
            
        if type(priority) is int:
            self.queue.insert(priority, command)
        else:
            self.queue.append(command)
    
    def add_test(self, test, suite_name=None):
        if suite_name is None and not test.get('suite_name'):
            suite_name = self.current_suite
        test['suite_name'] = suite_name
        
        test['type'] = 'test'
        
        self.queue.append(test)
        
    def start_suite(self, suite_name):
        self.current_suite = suite_name

    def stop_suite(self):
        self.current_suite = None
        
    # def command(self, command):        
    #     self.command_queue.insert(0, command)
        
    def next_action(self):
        
        if len(self.queue) is not 0:
            controller_action = self.queue.pop(0)
            self.resolution_suites[controller_action.pop('type')].add(controller_action)
            return controller_action
        else:
            return None
            
callback = {'version':'0.1'}

class TestResolutionSuite(object):
    """Collection of tests run and results"""
    result_processor = None
    
    def __init__(self):
        self.unresolved = {}
        self.resolved = {}
        self.current_suite = None

    def resolve(self, result, uuid, starttime, endtime, debug=None, output=None):
        """Resolve test by uuid"""
        test = self.unresolved.pop(uuid)
        if debug:
            test['debug'] = debug
        test['result'] = result
        test['starttime'] = starttime
        test['endtime'] = endtime
        test['output'] = output
        self.resolved[uuid] = test
                
        if result is False:
            test_results_logger.error('Test Failure in test %s' % repr(test))
        elif result is True:
            test_results_logger.debug('Test Success in test %s' % repr(test))
        
        if self.result_processor is not None:
            if result is False:
                self.result_processor.failure(test, debug=debug)
            elif result is True:
                self.result_processor.success(test, debug=debug)
    
    def report_without_resolve(self, result, uuid, starttime, endtime, suite_name, debug=None, output=None):
        test = {'result':result, 'uuid':uuid, 'starttime':starttime, 'endtime':endtime, 
                'suite_name':suite_name, 'debug':debug, 'output':output}
        # if result is False:
        #     test_results_logger.error('Test Failure in test %s' % repr(test))
        # elif result is True:
        #     test_results_logger.debug('Test Success in test %s' % repr(test))
    
        if self.result_processor is not None:
            if result is False:
                self.result_processor.failure(test, debug=debug)
                windmill.test_has_failed = True
            elif result is True:
                self.result_processor.success(test, debug=debug)
            
    def start_suite(self, suite_name):
        self.current_suite = suite_name
        
    def stop_suite(self):
        self.current_suite = None
        
    def add(self, test, suite_name=None):
        self.unresolved[test['params']['uuid']] = test
        
class CommandResolutionSuite(object):
    
    def __init__(self):
        self.unresolved = {}
        self.resolved ={}
        
    def resolve(self, status, uuid, result):
        """Resolve command by uuid"""
        command = self.unresolved.pop(uuid, None)
        command['status'] = status
        command['result'] = result
        self.resolved[uuid] = command

        if status is False:
            test_results_logger.error('Command Failure in command %s' % command)
        elif status is True:
            test_results_logger.debug('Command Succes in command %s' % command)
    
    def add(self, command, suite_name=None):
        self.unresolved[command['params']['uuid']] = command
        
        
class RecursiveRPC(object):

    def __init__(self, execution_method):
        self.execution_method = execution_method

    def __getattr__(self, key):    
        """Call a method on the controller as if it was a local method"""
        class ExecuteJSONRecursiveAttribute(object):
            def __init__(self, name, execution_method):
                self.name = name
                self.execution_method = execution_method
            def __call__(self, **kwargs):
                rpc = {'method':self.name, 'params':kwargs}
                return self.execution_method(rpc)
            def __getattr__(self, key):
                return ExecuteRecursiveAttribute(self.name+'.'+key, self.execution_method)

        return ExecuteRecursiveAttribute(key, self.execution_method)
        
class RPCMethods(object):
    
    def __init__(self, queue, test_resolution_suite, command_resolution_suite):
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
        self._test_resolution_suite = test_resolution_suite
        self._command_resolution_suite = command_resolution_suite
        
    def start_suite(self, suite_name):
        self._test_resolution_suite.start_suite(suite_name)
        self._queue.start_suite(suite_name)
        return 200
    
    def stop_suite(self):
        self._test_resolution_suite.stop_suite()
        return 200
        
    def add_object(self, queue_method, action_object, suite_name=None):
        """Procedue neutral addition method"""
        callback_object = copy.copy(callback)
        callback_object.update(action_object)
        if not callback_object['params'].get('uuid'): 
            callback_object['params']['uuid'] = str(uuid.uuid1())
        self._logger.debug('Adding object %s' % str(callback_object))
        queue_method(callback_object, suite_name=suite_name)    
        return callback_object['params']['uuid']
    
    def add_json_test(self, json, suite_name=None):
        """Add test from json object with 'method' and 'params' defined"""
        action_object = json.loads(json)
        self.add_object(self._queue.add_test,  action_object, suite_name)
        return 200
        
    def add_test(self, test_object, suite_name=None):
        self.add_object(self._queue.add_test,  test_object, suite_name)
        return 200

    def add_json_command(self, json):    
        """Add command from json object with 'method' and 'params' defined"""
        action_object = json.loads(json)
        self.add_object(self._queue.add_command, action_object)
        return 200
        
    def add_command(self, command_object):
        """Add command from object"""
        self.add_object(self._queue.add_command, command_object)
        return 200
        
    def execute_object(self, queue_method, resolution_suite, action_object):
        """Procedure neutral blocking exeution of a given object."""
        uuid = self.add_object(queue_method, action_object)

        while not resolution_suite.resolved.get(uuid):
            sleep(.25)
        
        result = resolution_suite.resolved[uuid]
        result.pop('totaltime', None)
        return result

    def execute_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined, block until it returns, return the result"""
        action_object = json.loads(json)
        return self.execute_object(self._queue.add_command, self._command_resolution_suite, action_object)

    def execute_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined, block until it returns, return the result"""
        action_object = json.loads(json)
        return self.execute_object(self._queue.add_test, self._test_resolution_suite, action_object)
        
    def execute_command(self, action_object):
        """Add command from dict object with 'method' and 'params' defined, block until it returns, return the result"""
        return self.execute_object(self._queue.add_command, self._command_resolution_suite, action_object)
        
    def execute_test(self, action_object):
        """Add test from dict object with 'method' and 'params' defined, block until it returns, return the result"""
        return self.execute_object(self._queue.add_test, self._test_resolution_suite, action_object)
        
    def run_json_tests(self, tests):
        """Run list of json tests"""
        return self.run_tests([json.loads(test) for test in tests])

    def run_tests(self, tests):
        """Run list of tests"""
        for test in tests:
            if test['method'].find('command') is -1:
                self.add_test(test)
            else:
                self.add_command(test)
        return 200

    def clear_queue(self):
        """Clear the server queue"""
        self._queue.queue = []
        return 200
    
        
class JSONRPCMethods(RPCMethods):
        
    def next_action(self):
        """The next action for the browser to execute"""
        windmill.ide_is_awake = True
        from windmill.bin import admin_lib
        if len(admin_lib.on_ide_awake) is not 0:
            for func in copy.copy(admin_lib.on_ide_awake):
                func()
                admin_lib.on_ide_awake.remove(func)
        
        action = self._queue.next_action()
        if action is not None:
            self._logger.debug('queue has next_action %s' % str(action))
            return action
        else:
            self._logger.debug('queue has no next_action, returning "pause" method')
            action = copy.copy(callback)
            action.update({'method':'defer'})
            return action
            
    def report(self, uuid, result, starttime, endtime, debug=None, output=None):
        """Report fass/fail for a test"""
        self._test_resolution_suite.resolve(result, uuid, starttime, endtime, debug, output)
        return 200
        
    def report_without_resolve(self, uuid, result, starttime, endtime, suite_name, debug=None, output=None):
        self._test_resolution_suite.report_without_resolve(result, uuid, starttime, endtime, suite_name, debug, output)
        if result is True:
            sys.stdout.write('.')
        else:
            sys.stdout.write(self.format_failure_message(suite_name, debug))
        sys.stdout.flush()
        return 200
    
    count = 0    
        
    def format_failure_message(self, suite_name, debug):
        if debug is None: return 'F'
        subject = 'Failure: ' + suite_name
        message = '\n' + subject
        if debug.__class__ == dict:
            message += '\n' + '=' * len(subject)
            message += '\nMessage:\t%s\n' % debug['message']
            if 'lineNumber' in debug:
                message += 'Line:\t\t%d\n' % debug['lineNumber']
            if 'stack' in debug:
                message += 'Stack:\n%s' + debug['stack']
        else:
            message += debug
        return message + "\n"
        
    def command_result(self, status, uuid, result):
        self._command_resolution_suite.resolve(status, uuid, result)
        
    def status_change(self, status):
        pass
        
    def set_test_url(self, url):
        windmill.settings['FORWARDING_TEST_URL'] = url
        windmill.server.proxy.clearForwardingRegistry()
        return 200
        
    def restart_test_run(self, tests):
        self.clear_queue()
        self._test_resolution_suite.unresolved = {}
        self._command_resolution_suite.unresolved ={}
        for test in tests:
            self.add_test(test, suite_name=test.get('suite_name'))
                
    def create_save_file(self, transformer, suite_name, tests):
        from windmill.authoring import transforms
        if not windmill.settings['SAVES_PATH']:
            transforms.create_saves_path()
        for test in tests:
            if test.get('suite_name'):
                test.pop('suite_name')
            if test['params'].get('uuid'): 
                test['params'].pop('uuid')
        return transforms.registry[transformer](suite_name, tests)
        
    def teardown(self, tests):
        """teardown_module function for functest based python tests"""
        import windmill
        if getattr(windmill, "js_framework_active", False) is True:
            sys.stdout.write('\n'); sys.stdout.flush();
            if tests["testFailureCount"] is not 0:
                for k, v in tests.items():
                    if type(v) is dict and v.get(u'result') is False:
                        print "Failed: "+k
                windmill.test_has_failed = True
            total_string = "Total Tests Run: "+str(tests["testCount"])+" "
            total_string += "Total Passed: "+str(tests["testCount"] - tests["testFailureCount"])+" "
            total_string += "Total Failed: "+str(tests["testFailureCount"])
            print total_string
            
        if windmill.settings['EXIT_ON_DONE']:
            from windmill.bin import admin_lib    
            admin_lib.teardown(admin_lib.shell_objects_dict)
            windmill.runserver_running = False
            sleep(.25)
        
class XMLRPCMethods(RPCMethods):
    def stop_runserver(self):
        import windmill
        windmill.runserver_running = False
        
            
            
            