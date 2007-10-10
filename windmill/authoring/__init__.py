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
import xmlrpclib
import new, copy
import transforms

class WindmillTestClient(object):
    """Windmill controller implementation for python test authoring library"""
    assertions = True
    browser_debugging = False
        
    def __init__(self, suite_name, assertions=None, browser_debugging=None, method_proxy=None):
        """Assign all available attributes to instance so they are easily introspected"""
        
        if method_proxy is None:
            method_proxy = windmill.tools.make_xmlrpc_client()
        
        self._method_proxy = method_proxy
        
        if assertions is not None:
            self.assertions = assertions
        if browser_debugging is not None:
            self.browser_debugging = browser_debugging
            
        import functest
        if functest.registry.get('browser_debugging', False):
            self.browser_debugging = True
            self.assertions = False
            
        class ExecWrapper(object):
            """In line callable wrapper class for execute/load methods"""
            def __init__(self, exec_method, action_name):
                self.action_name = action_name
                self.exec_method = exec_method
            def __call__(self, **kwargs):
                return self.exec_method(self.action_name, **kwargs)
                
                
        for action in self._method_proxy.execute_command(
                                   {'method':'commands.getControllerMethods','params':{}})['result']:
            
            #Bind every available test and action to self, flatten them as well
            if action.find('command') is not -1:
                setattr(self, 
                        action.split('.')[-1], 
                        ExecWrapper(self._exec_command, action)
                        )
            else:
                setattr(self, 
                        action.split('.')[-1], 
                        ExecWrapper(self._exec_test, action)
                        )
        # We'll need to start the suite for the name passed to the initializer
        self._method_proxy.start_suite(suite_name)
                        
    def _exec_command(self, command_name, **kwargs):
        """Execute command, if browser_debugging then just add it to queue"""
        command = {'method':command_name, 'params':kwargs}
        if not self.browser_debugging:
            result = self._method_proxy.execute_command({'method':command_name, 'params':kwargs})
            if not result and self.assertions:
                assert result
            else:
                return result
        else:
            return self._method_proxy.add_command({'method':command_name, 'params':kwargs})
            

    def _exec_test(self, test_name, **kwargs):
        """Execute test, if browser_debugging then just add it to queue"""
        test = {'method':test_name, 'params':kwargs}
        if not self.browser_debugging:
            result = self._method_proxy.execute_test({'method':test_name, 'params':kwargs})
            if not result['result'] and self.assertions:
                assert result['result']
            else:
                return result
        else:
            return self._method_proxy.add_test({'method':test_name, 'params':kwargs})        
            
def get_test_client(name):
    """Convenience method for gettign windmill test client"""
    client = WindmillTestClient(name)
    
    if windmill.settings.get('BROWSER_DEBUGGING', None):
        client.browser_debugging = True
        
    if windmill.settings.get('ENABLE_PDB', None): 
        import pdb
        client.browser_debugging = False
        client.assertions = True
    else:
        pdb = None
