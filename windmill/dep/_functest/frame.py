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

import sys, copy
import traceback
import global_settings
import pdb
import os
import inspect
from datetime import datetime

import reports

try:
    import pygments
    import formatter
except:
    pygments = None

totals = {'pass':0, 'fail':0, 'skip':0}

indentation = 0
parent_module_names = []

def execute(tests):
    """Execute the given tests and dependencies """
    global_settings.test_runner.begin_execute(tests)
    for test_module, dependency_chain in tests:
        dependency_chain.append(test_module)
        if run_setup_module(dependency_chain):
            # Only execute tests if setup doesn't fail
            global_settings.test_runner.begin_run_module_setup(test_module)
            run_test_module(test_module)
            for mod in [getattr(test_module, m) for m in dir(test_module) if (
                           inspect.ismodule(getattr(test_module, m)) ) and (
                           m.startswith('test')) ]:
                execute( [(mod, [],)], )
            global_settings.test_runner.end_run_module_setup(test_module)
        run_teardown_module(dependency_chain)
    return totals

def setup_and_teardown_module(st_string, dependency_chain):
    has_setup = False
    results = []
    for module in dependency_chain:
        if hasattr(module, st_string+'_module'):
            if hasattr(module, st_string+'_executed') and (
               getattr(module, st_string+'_executed') is True ):
                pass
            else:
                if has_setup is not True:
                    has_setup = True
                    global_settings.test_runner.begin_module_has_setup(module)
                    # rn replace; output.write(indentation*' ')
                    # rn replace; output.flush()
                getattr(global_settings.test_runner, 'begin_module_'+st_string)(module)
                # rn replace; output.write(module.__name__+'.'+st_string+'_module()')
                # rn replace; output.flush()
                
                # Create module setup or teardown function that run_test_function can process
                mod_func = getattr(module, st_string+'_module')
                mod_func.test_type = st_string+'_module'
                mod_func.module = module
                setattr(mod_func, st_string+'_module', getattr(module, st_string+'_module'))
                result = run_test_function(mod_func, args=[module])
                
                setattr(module, st_string+'_executed', True)
                if result is True:
                    getattr(global_settings.test_runner, 'module_'+st_string+'_passed')(module)
                    # rn replaced; output.write(' . ')
                else:
                    getattr(global_settings.test_runner, 'module_'+st_string+'_failed')(module)
                    # rn replaced; output.write(' x ')
                # rn replaced in two places; output.flush()
                results.append(result)
    if has_setup is True:
        global_settings.test_runner.end_module_has_setup(module)
    return False not in results

def run_setup_module(dependency_chain):
    return setup_and_teardown_module('setup', dependency_chain)

def run_teardown_module(dependency_chain):
    dependency_chain = copy.copy(dependency_chain)
    dependency_chain.reverse()
    return setup_and_teardown_module('teardown', dependency_chain) 
    
def setup_and_teardown_function(st_string, function):
    pass # TODO           

def run_test_module(module):
    global_settings.test_runner.begin_run_test_module(module)
    has_tests = False
    test_functions = [getattr(module, f) for f in dir(module) if f.startswith('test') and callable(getattr(module, f))]
    ordered_tests = []
    if len(test_functions) is not 0:
        try:
            inspect.getsourcelines(test_functions[0])
            for t in test_functions: 
                ordered_tests.append( (inspect.getsourcelines(t)[-1], t,) )
        except:
            ordered_tests = [ (i, test_functions[i]) for i in range(len(test_functions)) ]
        
    tests = [f[1] for f in sorted(ordered_tests)]
    for func in tests:
        if not has_tests:
            global_settings.test_runner.begin_tests_in_module(module, tests)
            # rn replaced; output.write(indentation*' '+module.__name__+'.tests:')
            has_tests = True
        if func.__name__.find(global_settings.test_filter) is not -1:
            func.test_type = 'test_function'
            func.module = module
            result = run_test_function(func)
            if result is True:
                global_settings.test_runner.test_function_passed(func)
                # rn replaced; output.write(' .')
            else:
                global_settings.test_runner.test_function_failed(func)
                # rn replaced; output.write(' x')
        else:
            global_settings.test_runner.test_function_skipped(func)
            # rn replaced; output.write(' s')
            totals['skip'] += 1
        
        # rn replaced in both; output.flush()
    if has_tests:
        global_settings.test_runner.end_tests_in_module(module, tests)
        # rn replaced; output.write('\n')
        # rn replaced; output.flush()
    global_settings.test_runner.end_run_test_module(module)


def run_test_function(test, args=[]):
    try:
        test.starttime = datetime.now()
        test(*args)
        test.endtime = datetime.now()
        totals['pass'] += 1
        test.result = True
        reports.report_test_function(test)
        return True
    except AssertionError, inst:
        test.endtime = datetime.now()
        if pygments and sys.stderr.isatty():
            formatter.highlight_traceback(sys.exc_info())
        else:
            tb = traceback.format_exception(*sys.exc_info())
            tb.pop(1)
            print 'Failed '+test.__name__
            print ''.join(tb)
        if global_settings.pdb:
            pdb.post_mortem(sys.exc_info()[2])
        totals['fail'] += 1
        test.result = False
        test.tb = traceback.format_exception(*sys.exc_info())
        test.e = inst
        reports.report_test_function(test)
        return False
    except Exception, inst:
        test.endtime = datetime.now()
        if pygments and sys.stderr.isatty():
            formatter.highlight_traceback(sys.exc_info())
        else:
            tb = traceback.format_exception(*sys.exc_info())
            tb.pop(1)
            print 'Failed '+test.__name__
            print ''.join(tb)
        if global_settings.pdb:
            pdb.post_mortem(sys.exc_info()[2])
        else:
            pass
        totals['fail'] += 1
        test.result = False
        test.tb = traceback.format_exception(*sys.exc_info())
        test.e = inst
        reports.report_test_function(test)
        return False
