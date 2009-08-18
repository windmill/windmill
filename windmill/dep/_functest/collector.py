#   Copyright (c) 2007 Mikeal Rogers
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

import os
import sys
import inspect
import new
import imp
import copy
from time import sleep

class Collector(object):
    
    post_collection_functions = []

    def import_module(self, path):
        if os.path.isfile(path):
            sys.path.insert(0, os.path.dirname(path))
            name = os.path.split(path)[-1].split('.')[0]
            filename, pathname, description = imp.find_module(name, [os.path.dirname(path)])
            module = imp.load_module(name, filename, pathname, description)
            module.functest_module_path = path
            module.__file__ = os.path.abspath(path)
            sys.path.pop(0)
        elif os.path.isdir(path):
            if os.path.isfile(os.path.join(path, '__init__.py')):
                sys.path.insert(0, os.path.abspath(os.path.join(path, os.path.pardir)))
                name = os.path.split(path)[-1]
                filename, pathname, description = imp.find_module(
                    name, [os.path.abspath(os.path.join(path, os.path.pardir))])
                module = imp.load_module(name, filename, pathname, description)
                module.functest_module_path = path
                module.__file__ = os.path.abspath(os.path.join(path, '__init__.py'))
                sys.path.pop(0)
            else:
                module = new.module(os.path.split(path)[-1])
                module.functest_module_path = path
        else:
            raise ImportError('path is not file or directory')
        return module

    def create_module_chain(self, path):
        path = os.path.abspath(path)
        module_chain = []
        if not os.path.isdir(path):
            path = os.path.dirname(path)
        # For every valid python module the test is in we need to import it incase it contains setup/teardown
        while os.path.isfile(os.path.join(path, '__init__.py')):
            module_chain.append(self.import_module(path))
            path = os.path.join(*os.path.split(path)[:-1])
        module_chain.reverse()
        return module_chain
    
    def create_test_module(self, path):
        path = os.path.abspath(path)
        if os.path.isfile(path):
            test_module = self.import_module(path)
            for func in self.post_collection_functions:
                func(test_module)
        elif os.path.isdir(path):
            test_module = self.import_module(path)
            for func in self.post_collection_functions:
                func(test_module)
            for filename in [ f for f in os.listdir(path) if ( not f.startswith('.') ) and 
                             ( f.startswith('test') ) and
                             ( ( f.endswith('.py') ) or 
                               ( os.path.isdir(os.path.join(path, f)) and        
                                 os.path.isfile(os.path.join(path, f, '__init__.py')) 
                               ) 
                             ) 
                             ]:
                setattr(test_module, filename.split('.')[0], self.create_test_module(os.path.join(path, filename)))
        else:
            sys.__stdout__.write(path+' is not a valid python module path or filename\n')
            sys.__stdout__.flush()
            sleep(.5)
            sys.exit()
        return test_module
            
def register_post_collection(func):
    test_collector.post_collection_functions.append(func)

