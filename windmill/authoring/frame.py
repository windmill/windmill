#   Copyright (c) 2007 Open Source Applications Foundation
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

# This is a quick discovery based framework for the windmill python test authoring library
# Hopefully this can all get removed and replaced with functest.



# import os
# import sys
# import pdb
# import inspect
# import traceback
# import new
# 
# modules_run = []
# 
# try:
#     import windmill
#     wm_settings = windmill.settings
#     results = windmill.RESULTS
# except:
#     # Windmill is either not available or settings haven't been initialized
#     wm_settings = {}
#     results = {'pass':0, 'failed':0}
# 
# 
# settings = {'pytest_on_failure': lambda x, e: sys.stdout.write('%s failed' % x.__name__), 
#             'pytest_on_traceback': lambda x, e: sys.stdout.write('%s failed due to traceback' % x.__name__),
#             'pytest_on_success': lambda x: sys.stdout.write('%s succeeded' % x.__name__)}
#             
# settings.update(wm_settings)
# 
# def get_module(directory):
#     """Import and return a python module by directory"""
#     directory = os.path.abspath(directory)
#     if os.path.split(directory)[-1] == '.':
#         directory = os.path.join(os.path.split(directory).pop(-1))
#     sys.path.insert(1, os.path.dirname(directory))
#     test_module = reload(__import__(os.path.split(directory)[-1].replace('.py', '')))
#     sys.path.pop(1)
#     return test_module
#     
# def get_test_module(test_path):
#     """Import and return test module"""
#     if os.path.isfile(test_path):
#         if os.path.isfile(os.path.join(os.path.dirname(test_path), '__init__.py')):
#             root_module = get_module(os.path.dirname(test_path))
#         else:
#             root_module = new.module('root_test_module')
#             for fn in [fn for fn in os.listdir(os.path.dirname(test_path)) if fn.endswith('.py')]:
#                 try:
#                     mod = get_module(os.path.join(os.path.dirname(test_path), fn))
#                     setattr(root_module, mod.__name__, mod)
#                 except:
#                     pass # If any of the other file fail to import just ignore them
#         test_module = get_module(test_path)
#         setattr(root_module, test_module.__name__, test_module)
#     elif os.path.isdir(test_path):
#         root_module = get_module(test_path)
#         test_module = root_module
#     return root_module, test_module
#     
# def run_test_module(test_module, root_module=None):
#     """Run individual test module"""
#     if hasattr(test_module, '_depends_') and ( root_module is not None ):
#         for test in [getattr(root_module, x) for x in test_module._depends_ if (
#                      getattr(root_module, x) not in modules_run)]:
#             run_test_module(test, root_module)
#             if not windmill.is_active:
#                 return False         
#     
#     if hasattr(test_module, 'setup_module'):
#         # Wrap the setup_module call in run_test_callable so that it can be debugged
#         run_test_callable( lambda : test_module.setup_module(test_module))
#     
#     test_modules = [getattr(test_module, x) for x in dir(test_module) if (
#                     inspect.ismodule(getattr(test_module, x)) )]
#              
#     for mod in test_modules:
#         run_test_module(mod)
#     
#     tests = [getattr(test_module, x) for x in dir(test_module) if x.startswith('test') and (
#              callable(getattr(test_module, x)) )]
#     
#     for test in tests:
#         run_test_callable(test)
#         if not windmill.is_active:
#             return False
#     modules_run.append(test_module)
#         
# def wm_post_mortem():
#     """Wrapper around pdb.pm so that we can eventually route stdin and stdout to a GUI front end"""
#     t = sys.exc_info()[2]
#     while t.tb_next is not None:
#         t = t.tb_next
#     if windmill.stdout is sys.stdout and windmill.stdin is sys.stdin:
#         p = pdb.Pdb()
#     else:    
#         p = pdb.Pdb(stdin=windmill.stdout, stdout=windmill.stdout)
#     p.reset()
#     p.interaction(t.tb_frame, t)
#         
# def run_test_callable(test):
#     """Run test callable extracted from test module"""
#     try:
#         test()
#         settings['pytest_on_success'](test)
#         results['pass'] += 1
#     except AssertionError, e:
#         # handle assertion error, explicit comparison failures in tests
#         print traceback.format_exc()
#         if windmill.settings.get('ENABLE_PDB', None):
#             wm_post_mortem()
#         settings['pytest_on_failure'](test, e)
#         results['fail'] += 1
#     except Exception, e:
#         # handle exception in python
#         print traceback.format_exc()
#         if windmill.settings.get('ENABLE_PDB', None):
#             wm_post_mortem()
#         settings['pytest_on_failure'](test, e)
#         results['fail'] += 1
#         
# def collect_and_run_tests(file_path):
#     """Collect the entire set of tests and run."""
#     if os.path.split(file_path)[-1] == '__init__.py':
#         file_path = os.path.dirname(os.path.abspath(file_path))
#     else:
#         file_path = os.path.abspath(file_path)
#     root_module, test_module = get_test_module(file_path)
#     run_test_module(test_module, root_module)
