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

import windmill
from windmill.bin import admin_lib
import logging
from windmill.dep import functest
import transforms
from windmill.dep import json
import os, sys, re
from time import sleep

logger = logging.getLogger(__name__)

class NSWrapper(object):
    def __init__(self, ):
        pass        
        
def setup_module(module):
    """setup_module function for functest based python tests"""
    if functest.registry.get('functest_cli', False):
        assert functest.registry.has_key('browser') # Make sure browser= was passed to functest
    
    import windmill
    if not hasattr(windmill, 'settings'):
        admin_lib.configure_global_settings(logging_on=False)
    
    if functest.registry.get('url', False):
        windmill.settings['TEST_URL'] = functest.registry['url']
    if functest.registry.get('functest_cli', False):
        windmill.settings['START_'+functest.registry.get('browser').upper()] = True
        
    if functest.registry.get('browser_debugging', False):
        WindmillTestClient.browser_debugging = True
        
    if not windmill.is_active:
        module.windmill_dict = admin_lib.setup()
    else:
        module.windmill_dict = admin_lib.shell_objects_dict

def teardown_module(module):
    """teardown_module function for functest based python tests"""
    try:
        while functest.registry.get('browser_debugging', False):
            sleep(.25)
    except KeyboardInterrupt:
        pass
    # Incase we're in runserver mode and test were passed to the windmill command line
    if hasattr(windmill, 'settings') and windmill.settings['EXIT_ON_DONE'] and windmill.runserver_running:
        module.windmill_dict['xmlrpc_client'].stop_runserver() 
    else:
        admin_lib.teardown(module.windmill_dict)
    sleep(.25)
    
class RunJsonFile(object):
    def __init__(self, name, lines):
        self.name = name ; self.lines = [line for line in lines if line.startswith('{')]
        if functest.registry.get('browser_debugging', False):
            self.do_test = 'add_json_test' ; self.do_command = 'add_json_command'
            self.debugging = True
        else:
            self.do_test = 'execute_json_test' ; self.do_command = 'execute_json_command'
            self.debugging = False
        
    def __call__(self):
        from windmill.bin import shell_objects
        client = shell_objects.xmlrpc_client
        self.do_test = getattr(client, self.do_test)
        self.do_command = getattr(client, self.do_command)
        client.start_suite(self.name)
        for line in self.lines:
            if json.loads(line)['method'].find('command') is -1:
                result = self.do_test(line)
                if not self.debugging:  
                    assert result['result']
            else:
                result = self.do_command(line)
                if not self.debugging:  
                    assert result

expression = re.compile("\{.*\}")

def post_collector(module):
    if os.path.isdir(module.functest_module_path):
        directory = module.functest_module_path
    elif os.path.isfile(module.functest_module_path):
        directory = None
    else:
        print 'functest created a module with a path that does not exist; '+module.__name__
        directory = None
    
    if directory:
        # Assign json files to module
        for filename in [os.path.join(directory, f) for f in os.listdir(directory)
                         if f.endswith('.json')]:
            lines = expression.findall(open(filename, 'r').read())
            name = os.path.split(filename)[-1].split('.json')[0]
            func = RunJsonFile(name+'.json', lines)
            func.__name__ = 'test_'+name
            setattr(module, 'test_'+name, func)
    
def enable_collector():
    if post_collector not in functest.collector.test_collector.post_collection_functions:
        functest.collector.register_post_collection(post_collector)

class WindmillFunctestRunner(functest.runner.FunctestRunnerInterface):
    def test_function_passed(self, test):
        logger.debug('Functest test passed: '+test.__name__)
    def test_function_failed(self, test):
        logger.error('Functest test failed: '+test.__name__)
        windmill.test_has_failed = True

class WindmillTestClientException(AssertionError):
    def __init__(self, result):
        self.result = result
    def __str__(self):
        self.result.pop('version', None)
        self.result['params'].pop('uuid', None)
        return repr(self.result)

class WindmillTestClient(object):
    """Windmill controller implementation for python test authoring library"""
    assertions = True
    browser_debugging = False
        
    def __init__(self, suite_name, assertions=None, browser_debugging=None, method_proxy=None):
        """Assign all available attributes to instance so they are easily introspected"""
        
        if method_proxy is None:
            method_proxy = windmill.tools.make_jsonrpc_client()
        
        self._method_proxy = method_proxy
        
        if assertions is not None:
            self.assertions = assertions
        if browser_debugging is not None:
            self.browser_debugging = browser_debugging
            
        if functest.registry.get('browser_debugging', False):
            self.browser_debugging = True
            self.assertions = False
            
        class ExecWrapper(object):
            """In line callable wrapper class for execute/load methods"""
            def __init__(self, exec_method, action_name):
                self.action_name = action_name
                self.exec_method = exec_method
            def __call__(self, **kwargs):
                result = self.exec_method(self.action_name, **kwargs)

                class ResultDict(dict):
                  def exists(self):
                    return self['result']

                #if we have a lookup, wrap the object so we have .exists
                try:
                    if result['method'] == 'lookup':
                      new_results = ResultDict(result)
                    else:
                      new_results = result
                except Exception:
                    new_results = result

                return new_results


        class NSWrapper(object):
            """Namespace wrapper"""
            def __init__(self, name):
                self.name = name

        for action in self._method_proxy.execute_command(
                                   {'method':'commands.getControllerMethods','params':{}})['result']['result']:
            parent = self
            if action.find('.') is not -1:
                for name in [a for a in action.split('.') if not action.endswith(a) ]:
                    if not hasattr(parent, name): 
                        setattr(parent, name, NSWrapper(name))
                    parent = getattr(parent, name) 
            
            #Bind every available test and action to self, flatten them as well
            if action.find('command') is not -1:
                setattr(parent, 
                        action.split('.')[-1], 
                        ExecWrapper(self._exec_command, action)
                        )
            else:
                setattr(parent, 
                        action.split('.')[-1], 
                        ExecWrapper(self._exec_test, action)
                        )
        # We'll need to start the suite for the name passed to the initializer
        self._method_proxy.start_suite(suite_name)
                        
    def _exec_command(self, command_name, assertion=None, **kwargs):
        """Execute command, if browser_debugging then just add it to queue"""
        if assertion is None:
            assertion = self.assertions
        command = {'method':command_name, 'params':kwargs}
        if not self.browser_debugging:
            result = self._method_proxy.execute_command({'method':command_name, 'params':kwargs})
            if not result and assertion:
                raise WindmillTestClientException(result)
            else:
                return result['result']
        else:
            return self._method_proxy.add_command({'method':command_name, 'params':kwargs})
            

    def _exec_test(self, test_name, assertion=None, **kwargs):
        """Execute test, if browser_debugging then just add it to queue"""
        if assertion is None:
            assertion = self.assertions
        test = {'method':test_name, 'params':kwargs}
        if not self.browser_debugging:
            result = self._method_proxy.execute_test({'method':test_name, 'params':kwargs})
            if not result['result']['result'] and assertion:
                if result['result']['method'] != 'lookup':
                  raise WindmillTestClientException(result['result'])
                else:
                  return result['result']
            else:
                return result['result']
        else:
            return self._method_proxy.add_test({'method':test_name, 'params':kwargs})     
            
# def get_test_client(name):
#     """Convenience method for gettign windmill test client"""
#     client = WindmillTestClient(name)
#     
#     if windmill.settings.get('BROWSER_DEBUGGING', None):
#         client.browser_debugging = True
#         
#     if windmill.settings.get('ENABLE_PDB', None): 
#         import pdb
#         client.browser_debugging = False
#         client.assertions = True
#     else:
#         pdb = None
