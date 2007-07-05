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
        
    def __init__(self):
        """Assign all available attributes to instance so they are easily introspected"""        
        
        self.method_proxy = windmill.tools.make_xmlrpc_client()
        
        class ExecuteTest(object):
            def __init__(self, method_proxy, command_name):
                self.method_proxy = method_proxy
                self.command_name = command_name
            def __call__(self, *args, **kwargs):
                getattr(self.method_proxy, self.command_name)(*args, **kwargs)
        
        class ExecuteCommand(object):
            def __init__(self, method_proxy, command_name):
                self.method_proxy = method_proxy
                self.command_name = command_name
            def __call__(self, *args, **kwargs):
                getattr(self.method_proxy, self.command_name)(*args, **kwargs)
                
        class Nothing(object):
            pass
        
        def set_sub_controller_action(base, type_string, attribute_name):
            """Attach a controller action to the base client in a proper heirarchy"""
            if not hasattr(base, type_string) and type_string is not None: 
                setattr(base, type_string, Nothing())
            if type_string == None:
                setattr(base.controller, attribute_name, ExecuteTest(self.method_proxy, attribute_name))
            elif type_string == 'command':
                setattr(base.command, attribute_name, ExecuteCommand(self.method_proxy, attribute_name))
            else:
                print "I'm confused!!!!!!!!!!!!!!!!"
        
        for attribute in self.method_proxy.command.getControllerMethods():
            if attribute.find('.') is -1:
                set_sub_controller_action(self, None, attribute)
            else:
                attribute_list = attribute.split('.')
                if attribute_list[0] == 'command':
                    set_sub_controller(self, 'command', attribute_list[1])
                else:
                    if not hasattr(self, attribute_list[0]): 
                        setattr(self, attribute_list[0], Nothing())
                    if len(attribute_list) > 2:
                        set_sub_controller(getattr(self, attribute_list[0]), attribute_list[1], attribute_list[2])
                    if len(attribute_list) is 2:
                       set_sub_controller(getattr(self, attribute_list[0]), None, attribute_list[1]) 
        
                
                
    
    def enable_unittest(self, unittest_cls_inst):
        self._unittest_cls_inst = cls_inst
    
    def _exec_controller_test(self, name, **kwargs):
        result = getattr(self.method_proxy, name)(**kwargs)
        if self._enable_unittest:
            self._unittest_cls_inst.assertEqual(result, True)
        if self.enable_assertions:
            assert result is True
        return result
    
    def _exec_controller_command(self, name, **kwargs):
        result = getattr(self.method_proxy, name)(**kwargs)
        if self._enable_unittest:
            self._unittest_cls_inst.failUnless(result, 'remote call did not return proper result')
        if self.enable_assertions:
            assert result is not False
            assert result is not ''
            assert result is not None
        return result
            
                    
    
        

