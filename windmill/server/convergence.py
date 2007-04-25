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

import copy
import simplejson
import logging
import uuid
import windmill

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
        self.unresolved_tests = {}
        self.resolved_tests = {}

    def resolve_test(self, result, uuid, starttime=None, endtime=None, debug=None):
        
        test = self.unresolved_tests.pop(uuid)
        test['result'] = result
        test['starttime'] = starttime
        test['endtime'] = endtime
        test['totaltime'] = endtime - starttime
        self.resolved_tests[uuid] = test
                
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
        
    def add_test(self, test):
        self.unresolved_tests[test['uuid']] = test
        
class CommandResolutionSuite(object):
    
    def __init__(self):
        self.unresolved_commands = {}
        self.resolved_commands ={}
        
    def resolve_command(self, status, uuid, result=None):
        
        command = self.unresolved_commands.pop(uuid)
        command['status'] = status
        command['result'] = result
        self.resolved_commands[uuid] = command
        
        if status is False:
            test_results_logger.error('Command Failure in command %s' % command)
        elif status is True:
            test_results_logger.debug('Command Succes in command %s' % command)
            
        if command.has_key('result_callback'):
            command['result_callback'](status, result)
    
    def add_command(self, command):
        self.unresolved_commands[command['uuid']] = command
        
class JSONRPCMethods(object):
    
    def __init__(self, queue, test_resolution_suite, command_resolution_suite):
        """Assign _queue to class"""
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
        self._test_resolution_suite = test_resolution_suite
        self._command_resolution_suite = command_resolution_suite
        
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
        self.test_resolution_suite.resolve_test(result, uuid, debug, starttime, endtime)
        
    def callback_result(self, status, uuid, result):
        self.command_resolution_suite.resolve_command(status, uuid, result)
            
    def add_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        test['uuid'] = str(uuid.uuid1())
        self._logger.debug('Adding command object %s' % str(test))
        self._queue.add_test(test)    
        self._test_resolution_suite.add_test(test)
        
    def add_json_command(self, json):    
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        command['uuid'] = str(uuid.uuid1())
        self._logger.debug('Adding command object %s' % str(command))
        self._queue.add_command(command)
        self._command_resolution_suite.add_command(command)
        
    def execute_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        command['uuid'] = str(uuid.uuid1())
        self._logger.debug('Adding command object %s' % str(command))
        self._queue.add_command(command)
        
        returned_result = None
        def result_callback(status, result):
            if status is True:
                returned_result = result
            else:
                returned_result = False

        command['result_callback'] = result_callback
        self._command_resolution_suite.add_command(command)
        
        while returned_result is None:
            pass
            
        return returned_result
        
    def execute_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        test['uuid'] = str(uuid.uuid1())
        self._logger.debug('Adding test object %s' % str(test))
        self._queue.add_test(test)

        returned_result = None
        def result_callback(status, result):
            if status is True:
                returned_result = result
            else:
                returned_result = False

        test['result_callback'] = result_callback
        self._test_resolution_queue.add_test(test)

        while returned_result is None:
            pass

        return returned_result
        
class XMLRPCMethods(object):
            
    def __init__(self, queue, test_resolution_suite, command_resolution_suite):
        """Assign _queue to class"""
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
        self._test_resolution_suite = test_resolution_suite
        self._command_resolution_suite = command_resolution_suite
            
    def add_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        test['uuid'] = str(uuid.uuid1())
        self._queue.add_test(test)    
        self._test_resolution_suite.add_test(test) 
        
    def add_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        command['uuid'] = str(uuid.uuid1())
        self._queue.add_command(command)
        self._command_resolution_suite.add_command(command)
        
    def execute_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        command['uuid'] = str(uuid.uuid1())
        self._queue.add_command(command)     
        
        returned_result = None
        def result_callback(status, result):
            if status is True:
                returned_result = result
            else:
                returned_result = False
                
        command['result_callback'] = result_callback
        self._command_resolution_suite.add_command(command)
            
        while returned_result is None:
            pass
            
        return returned_result
        
    def execute_json_test(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        test['uuid'] = str(uuid.uuid1())
        self._queue.add_test(test)     

        returned_result = None
        def result_callback(result, debug):
            returned_result = result

        test['result_callback'] = result_callback
        self._test_resolution_queue.add_test(test)
        
        while returned_result is None:
            pass
            
        return returned_result
            
            
            
            