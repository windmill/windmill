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

from SimpleXMLRPCServer import SimpleXMLRPCDispatcher
from datetime import datetime
import simplejson

class JSTask(object):
    
    def __init__(self, json):
        
        self.json_decoded = simplejson.loads(json)
        self.json_encoded = json
        self.status = 'loaded'
        self.loaded_time = datetime.now()
        self.time_changes = []
        
    def change_status(self, status):
        
        self.status = status
        self.time_changes.append(datetime.now())

class XMLRPCHandler(object):
    
    def __init__(self):
        
        self.test_queue = []
        self.command_queue = []
        self.completed = []
        self.status = ''
        
    def add_test(self, data):
        
        task = JSTask(data)
        self.run_queue.append(task)
    
    def add_command(self, data):
        
        task = JSTask(data)
        self.command_queue.append(task)
        
    def get_status(self, data):
        
        return self.status
        
def make_dispatcher(rpc):
    
    dispatcher = SimpleXMLRPCDispatcher(allow_none=False, encoding=None)
    dispatcher.register_introspection_functions()
    dispatcher.register_instance(rpc)
    return dispatcher
    
def make_windmill_dispatcher():
    
    rpc = XMLRPCHandler()
    return make_dispatcher(rpc), rpc
    
    