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

"""This module provides the communication and management between the various 
server interfaces and the browser's js interface"""

import copy, os 
import simplejson
import logging
from uuid import uuid1
import windmill
from dateutil.parser import parse as dateutil_parse

test_results_logger = logging.getLogger('test_results')

class ControllerQueue(object):
    
    def __init__(self):
        
        self.command_queue = []
        self.test_queue = []
        
    def add_command(self, command):
        
        self.command_queue.append(command)
    
    def add_test(self, test):
        
        self.test_queue.append(test)
        
    def command(self, command):
        
        self.command_queue.insert(0, command)
        
    def next_action(self):
        
        if len(self.command_queue) is not 0:
            return self.command_queue.pop(0)
        elif len(self.test_queue) is not 0:
            return self.test_queue.pop(0)
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

    def resolve(self, result, uuid, starttime, endtime, debug=None):
        """Resolve test by uuid"""
        starttime = dateutil_parse(starttime)
        endtime = dateutil_parse(endtime)
        test = self.unresolved.pop(uuid)
        test['result'] = result
        test['starttime'] = starttime
        test['endtime'] = endtime
        test['totaltime'] = endtime - starttime
        self.resolved[uuid] = test
                
        if result is False:
            test_results_logger.error('Test Failue in test %s' % test)
        elif result is True:
            test_results_logger.debug('Test Success in test %s' % test)
        
        if self.result_processor is not None:
            if result is False:
                self.result_processor.failure(test, debug=debug)
            elif result is True:
                self.result_processor.success(test, debug=debug)
                
        if test.has_key('result_callback'):
            test['result_callback'](result, debug)
            
    def start_suite(self, suite_name):
        self.current_suite = suite_name
        
    def stop_suite(self):
        self.current_suite = None
        
    def add(self, test, suite_name=None):
        if suite_name is None and not test.get('suite_name'):
            suite_name = self.current_suite
        test['suite_name'] = suite_name
        self.unresolved[test['params']['uuid']] = test
        
class CommandResolutionSuite(object):
    
    def __init__(self):
        self.unresolved = {}
        self.resolved ={}
        
    def resolve(self, status, uuid, result):
        """Resolve command by uuid"""
        command = self.unresolved.pop(uuid)
        command['status'] = status
        command['result'] = result
        self.resolved[uuid] = command

        if status is False:
            test_results_logger.error('Command Failure in command %s' % command)
        elif status is True:
            test_results_logger.debug('Command Succes in command %s' % command)
            
        if command.has_key('result_callback'):
            command['result_callback'](status, result)
    
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
        return 200
    
    def stop_suite(self):
        self._test_resolution_suite.stop_suite()
        return 200
        
    def add_object(self, queue_method, resolution_suite, action_object, suite_name=None):
        """Procedue neutral addition method"""
        callback_object = copy.copy(callback)
        callback_object.update(action_object)
        if not callback_object['params'].get('uuid'): 
            callback_object['params']['uuid'] = str(uuid1())
        self._logger.debug('Adding object %s' % str(callback_object))
        queue_method(callback_object)    
        resolution_suite.add(callback_object, suite_name)
        return callback_object['params']['uuid']
    
    def add_json_test(self, json, suite_name=None):
        """Add test from json object with 'method' and 'params' defined"""
        action_object = simplejson.loads(json)
        self.add_object(self._queue.add_test, self._test_resolution_suite, action_object, suite_name)
        return 200
        
    def add_test(self, test_object, suite_name=None):
        self.add_object(self._queue.add_test, self._test_resolution_suite, test_object, suite_name)
        return 200

    def add_json_command(self, json):    
        """Add command from json object with 'method' and 'params' defined"""
        action_object = simplejson.loads(json)
        self.add_object(self._queue.add_command, self._command_resolution_suite, action_object)
        return 200
        
    def add_command(self, command_object):
        """Add command from object"""
        self.add_object(self._queue.add_command, self._command_resolution_suite, command_object)
        return 200
        
    def execute_object(self, queue_method, resolution_suite, action_object):
        """Procedure neutral blocking exeution of a given object."""
        uuid = self.add_object(queue_method, resolution_suite, action_object)

        while not resolution_suite.resolved.get(uuid):
            pass
        
        return resolution_suite.resolved[uuid]['result']

    def execute_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined, block until it returns, return the result"""
        action_object = simplejson.loads(json)
        return self.execute_object(self._queue.add_command, self._command_resolution_suite, action_object)

    def execute_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined, block until it returns, return the result"""
        action_object = simplejson.loads(json)
        return self.execute_object(self._queue.add_test, self._test_resolution_suite, action_object)
        
    def execute_command(self, action_object):
        """Add command from dict object with 'method' and 'params' defined, block until it returns, return the result"""
        return self.execute_object(self._queue.add_command, self._command_resolution_suite, action_object)
        
    def execute_test(self, action_object):
        """Add test from dict object with 'method' and 'params' defined, block until it returns, return the result"""
        return self.execute_object(self._queue.add_test, self._test_resolution_suite, action_object)
        
    def run_json_tests(self, tests):
        """Run list of json tests"""
        for test in tests:
            self.add_json_test(test)
        return 200

    def run_tests(self, tests):
        """Run list of tests"""
        for test in tests:
            self.add_test(test)
        return 200
    
        
class JSONRPCMethods(RPCMethods):
        
    def next_action(self):
        """The next action for the browser to execute"""
        action = self._queue.next_action()
        if action is not None:
            self._logger.debug('queue has next_action %s' % str(action))
            return action
        else:
            self._logger.debug('queue has no next_action, returning "pause" method')
            action = copy.copy(callback)
            action.update({'method':'defer'})
            return action
            
    def report(self, uuid, result, starttime, endtime, debug=None):
        """Report fass/fail for a test"""
        self._test_resolution_suite.resolve(result, uuid, starttime, endtime, debug)
        
    def command_result(self, status, uuid, result):
        self._command_resolution_suite.resolve(status, uuid, result)
        
    def status_change(self, status):
        pass
        
    def restart_test_run(self, tests):
        self.clear_queue()
        self._test_resolution_suite.unresolved = {}
        for test in tests:
            self.add_test(test, suite_name=test.get('suite_name'))
                
    def create_json_save_file(self, tests):
        filename = str(uuid1())+'.json'
        f = open(os.path.join(windmill.settings['JS_PATH'], 'saves', filename), 'w')
        for test in tests:
            f.write(simplejson.dumps(test))
            f.write('\n')
        f.flush()
        f.close()
        return '%s/windmill-serv/saves/%s' % (windmill.settings['TEST_URL'], filename)
        
        
    def clear_queue(self):
        """Clear the server queue"""
        self._queue.command_queue = []
        self._queue.test_queue = []
        
class XMLRPCMethods(RPCMethods):
    pass
        
            
            
            