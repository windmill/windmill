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

import global_settings

import sys

usage = """functest test framework.
    functest [options] [test1.py] [test2.py] [filter=test]
    
Available Options:
    (help, --help)  Print this help menu. 
    (pdb, --pdb)  Stop on failure and enter pdb debugger.
    (nowrap, --nowrap)  Don't wrap output to print at end of test run for both stdout and stderr. 
        Allows output from tests as they run.
    (stdout, --stdout)  Don't wrap stdout.
    (stderr, --stderr)  Don't wrap stderr.
    (bigtb, --bigtb)  Only available if pygments is installed. 
        This prints a much larger traceback, with the preceeding 4 lines of code in each line of the traceback.
    (filter=)  Only run tests where the name contains this filter."""

def main(test_args):
    # tests = []
    # cli_runner = runner.CLIRunner()
    # cli_runner.start()
    # if len(args) is not 0:
    #     for arg in args:
    #         tests.append( [ collector.create_test_module(arg), collector.create_module_chain(arg) ] )
    # else:
    #     tests.append([collector.create_test_module(os.path.curdir), collector.create_module_chain(os.path.curdir) ])
    # cli_runner.wrap_stdout(global_settings.wrap_stdout, global_settings.wrap_stderr)
    # global_settings.test_runner = cli_runner
    # totals = frame.execute(tests)
    # cli_runner.summary(totals)
    # sleep(.5)    
    
    from windmill.dep import functest
    functest.run_framework(test_args)

    
def process_args():
    from windmill.dep import functest
    functest.configure()
    functest.registry['functest_cli'] = True
    
    args = list(sys.argv)
    if args[0].endswith('functest') or args[0].endswith('functest.py') or args[0].endswith('functest.exe'):
        args.pop(0)
    
    # Create options
    def set_pdb(x): global_settings.pdb = True; global_settings.wrap_stdout = False
    def set_nowrap(x): global_settings.wrap_stdout = False ; global_settings.wrap_stderr = False
    def set_stdout(x): global_settings.wrap_stdout = False
    def set_stdout(x): global_settings.wrap_stderr = False
    def set_bigtb(x): global_settings.bigtb = True
    def set_filter(x): global_settings.test_filter = x
    def set_help(x): print(usage); sys.exit()
    builtin_options = dict([ (k.replace('set_', ''), v,) for k, v in locals().items() if k.startswith('set_') ])
    
    options = [ x.replace('--', '') for x in args ]
    
    for option in options:
        if option.find('=') is not -1:
            key, value = option.split('=')
        else:
            key = option; value = None
        if key in builtin_options.keys():
            builtin_options[key](value)
        elif value is not None:
            functest.registry[key] = value
        else:
            functest.modules_passed.append(option)
            
    return functest.modules_passed

def cli():
    main(process_args())
