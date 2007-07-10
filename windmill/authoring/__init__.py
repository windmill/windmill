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
import new

class WindmillTestClient(object):
    
    _enable_unittest = False
    enable_assertions = True
    browser_debugging = False
        
    def __init__(self, method_proxy):
        """Assign all available attributes to instance so they are easily introspected"""
        
        self.method_proxy = method_proxy
                
        def exec_command(command_name, **kwargs):
            command = {'method':command_name, 'params':kwargs}
            if not self.browser_debugging:
                return self.method_proxy.execute_command(command_name)
            else:
                return self.method_proxy.add_command(command_name)
        
        def exec_test(test_name, **kwargs):
            test = {'method':test_name, 'params':kwargs}
            if not self.browser_debugging:
                return self.method_proxy.execute_test(test)
            else:
                return self.method_proxy.add_test(test)
        
        for action in self.method_proxy.execute_command({'method':'commands.getControllerMethods','params':{}}):
            if action.find('command') is not -1:
                setattr(self, 
                        action.split('.')[-1], 
                        lambda **kwargs: exec_command(action, **kwargs)
                        )
            else:
                setattr(self, 
                        action.split('.')[-1], 
                        lambda **kwargs: exec_test(action, **kwargs)
                        )
        
            
                    
    
        

