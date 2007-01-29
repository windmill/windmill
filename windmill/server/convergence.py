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

import copy, simplejson, logging

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
    def __init__(self):
        self.unresolved_tests = []
        self.resolved_tests = []
        
    def find_test(self, test_dict):
        for test in self.unresolved_tests:
            if test['method'] == test_dict['method'] and test['params'] == test_dict['params']:
                return test
        else:
            return None

    def resolve_test(self, result, test_dict, debug=None):
        test = self.find_test(test_dict)
        if test is not None:
            test['result'] = result
            test['debug'] = debug
            self.resolved_tests.append(self.unresolved_tests.pop(self.unresolved_tests.index(test)))
            
    def add_test(self, test):
        self.unresolved_tests.append(test)
        
        
class JSONRPCMethods(object):
    
    def __init__(self, queue, test_resolution_suite):
        """Assign _queue to class"""
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
        self._test_resolution_suite = test_resolution_suite
        
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
            
    def report(self, status=None, test=None, debug=None, result=None):
        """Report fass/fail and status"""
        if status is not None:
            self._status = status
        elif test is not None:
            if debug is not None:
                self._test_resolution_suite.resolve_test(result, test, debug)
            else:
                self._test_resolution_suite.resolve_test(result, test)
        else:
            self._logger.error('Report object does not adhere to 0.1 specification. Does not contain key "status" or key "test"')
            raise Exception,  'Report object does not adhere to 0.1 specification. Does not contain key "status" or key "test"' 
        
            
    def add_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        self._logger.debug('Adding command object %s' % str(test))
        self._queue.add_test(test)    
        self._test_resolution_suite.add_test(test)
        
    def add_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        self._logger.debug('Adding command object %s' % str(command))
        self._queue.add_command(command)
        
    def json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        self._logger.debug('Adding command object %s' % str(command))
        self._queue.command(command)
        
class XMLRPCMethods(object):
            
    def __init__(self, queue, test_resolution_suite):
        """Assign _queue to class"""
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
        self._test_resolution_suite = test_resolution_suite
            
    def add_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        self._queue.add_test(test)    
        self._test_resolution_suite.add_test(test) 
        
    def add_json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        self._queue.add_command(command)
        
    def json_command(self, json):
        """Add command from json object with 'method' and 'params' defined"""
        command = copy.copy(callback)
        command.update(simplejson.loads(json))
        self._queue.command(command)     
            
            
            
            
            