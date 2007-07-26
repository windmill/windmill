#   Copyright (c) 2007 Open Source Applications Foundation
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

import os, sys, pdb, inspect, traceback

results = {'pass':0, 'failed':0}
modules_run = []

try:
    import windmill
    wm_settings = windmill.settings
except:
    # Windmill is either not available or settings haven't been initialized
    wm_settings = {}


settings = {'pytest_on_failure': lambda x, e: sys.stdout.write('%s failed' % x.__name__), 
            'pytest_on_traceback': lambda x, e: sys.stdout.write('%s failed due to traceback' % x.__name__),
            'pytest_on_success': lambda x: sys.stdout.write('%s succeeded' % x.__name__)}
            
settings.update(wm_settings)

def get_module(directory):
    directory = os.path.abspath(directory)
    if os.path.split(directory)[-1] == '.':
        directory = os.path.join(os.path.split(directory).pop(-1))
    sys.path.insert(1, os.path.dirname(directory))
    test_module = reload(__import__(os.path.split(directory)[-1].replace('.py', '')))
    sys.path.pop(1)
    return test_module
    
def get_test_module(test_path):
    if os.path.isfile(test_path):
        root_module = get_module(os.path.dirname(test_path))
        test_module = get_module(test_path)
        setattr(root_module, test_module.__name__, test_module)
    elif os.path.isdir(test_path):
        root_module = get_module(test_path)
        test_module = root_module
    return root_module, test_module
    
def run_test_module(test_module, root_module=None):
    if hasattr(test_module, '_depends_') and ( root_module is not None ):
        for test in [getattr(root_module, x) for x in test_module._depends_ if (
                     getattr(root_module, x) not in modules_run)]:
            run_test_module(test, root_module)
            if not windmill.is_active:
                return False         
    
    if hasattr(test_module, 'setup_module'):
        # Wrap the setup_module call in run_test_callable so that it can be debugged
        run_test_callable( lambda : test_module.setup_module(test_module))
    
    test_modules = [getattr(test_module, x) for x in dir(test_module) if (
                    inspect.ismodule(getattr(test_module, x)) )]
             
    for mod in test_modules:
        run_test_module(mod)
    
    tests = [getattr(test_module, x) for x in dir(test_module) if x.startswith('test') and (
             callable(getattr(test_module, x)) )]
    
    for test in tests:
        run_test_callable(test)
        if not windmill.is_active:
            return False
    modules_run.append(test_module)
        
def wm_post_mortem():
    t = sys.exc_info()[2]
    while t.tb_next is not None:
        t = t.tb_next
    if windmill.stdout is sys.stdout and windmill.stdin is sys.stdin:
        p = pdb.Pdb()
    else:    
        p = pdb.Pdb(stdin=windmill.stdout, stdout=windmill.stdout)
    p.reset()
    p.interaction(t.tb_frame, t)
        
def run_test_callable(test):
    try:
        test()
        settings['pytest_on_success'](test)
        results['pass'] += 1
    except AssertionError, e:
        print traceback.format_exc()
        if windmill.settings.get('ENABLE_PDB', None):
            wm_post_mortem()
        settings['pytest_on_failure'](test, e)
        results['failed'] += 1
    except Exception, e:
        print traceback.format_exc()
        if windmill.settings.get('ENABLE_PDB', None):
            wm_post_mortem()
        settings['pytest_on_failure'](test, e)
        results['failed'] += 1
        
def collect_and_run_tests(file_path):
    if os.path.split(file_path)[-1] == '__init__.py':
        file_path = os.path.dirname(os.path.abspath(file_path))
    else:
        file_path = os.path.abspath(file_path)
    root_module, test_module = get_test_module(file_path)
    run_test_module(test_module, root_module)

