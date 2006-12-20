#   Copyright (c) 2006 Open Source Applications Foundation
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

        
class JSONRPCMethods(object):
    
    def __init__(self, queue):
        """Assign _queue to class"""
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
        
    def next_action(self):
        """The next action for the browser to execute"""
        action = self._queue.next_action()
        if action is not None:
            self._logger.debug('queue has next_action %s' % str(action))
            return action
        else:
            self._logger.debug('queue has no next_action, returning "pause" method')
            action = copy.copy(callback)
            action.update({'method':'pause'})
            return action
            
    def add_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        self._logger.debug('Adding command object %s' % str(test))
        self._queue.add_test(test)    
        
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
            
    def __init__(self, queue):
        """Assign _queue to class"""
        self._queue = queue
        self._logger = logging.getLogger('jsonrpc_methods_instance')
            
    def add_json_test(self, json):
        """Add test from json object with 'method' and 'params' defined"""
        test = copy.copy(callback)
        test.update(simplejson.loads(json))
        self._queue.add_test(test)    
        
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
            
            
            
            
            