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

from StringIO import StringIO
import global_settings
import sys
from time import sleep

class IOWrapper(StringIO):
    fileno = sys.__stderr__.fileno 

class FunctestRunnerInterface(object):
    """Simple class that returns a stub function if one of the methods isn't implemented"""
    def __getattr__(self, name):
        return lambda *args, **kwargs : None

class CLIRunner(object):
    
    indentation = 0
    
    def start(self): pass
    def wrap_stdout(self, stdout_bool, stderr_bool):
        self.out_io = IOWrapper()
        self.output = sys.__stdout__
        if stdout_bool == True:
            sys.stdout = self.out_io
        if stderr_bool == True: 
            sys.stderr = self.out_io
        self.stdout_wrap = ''
            
    def begin_execute(self, tests):
        self.indent = global_settings.indent
    
    def begin_run_module_setup(self, module):
        self.indentation += self.indent    
        
    def end_run_module_setup(self, module):
        self.indentation -= self.indent
        
    def begin_module_has_setup(self, module):
        self.output.write(self.indentation*' ')
        self.output.flush()
        
    def end_module_has_setup(self, module):
        self.output.write('\n')
        
    def begin_module_setup(self, module):
        self.output.write(module.__name__+'.'+'setup_module()')
        self.output.flush()
    
    def begin_module_teardown(self, module):
        self.output.write(module.__name__+'.'+'teardown_module()')
        self.output.flush()
        
    def module_setup_passed(self, module):
        self.output.write(' . ')
        self.output.flush()
        
    def module_setup_failed(self, module):
        self.output.write(' x ')
        self.output.flush()
        
    module_teardown_passed = module_setup_passed
    module_teardown_failed = module_setup_failed
    
    def begin_run_test_module(self, module): pass
    
    def begin_tests_in_module(self, module, tests):
        self.output.write(self.indentation*' '+module.__name__+'.tests:')
        self.output.flush()
        
    def test_function_passed(self, test):
        self.output.write(' .')
        self.output.flush()
    
    def test_function_failed(self, test):
        self.output.write(' x')
        self.output.flush()
    
    def test_function_skipped(self, test):
        self.output.write(' s')
        self.output.flush()
        
    def end_run_test_module(self, module): pass
    
    def end_tests_in_module(self, module, tests):
        self.output.write('\n')
    
    def get_stdout_wrap(self):
        self.stdout_wrap += self.out_io.getvalue()
        self.out_io = IOWrapper()
        return self.stdout_wrap
    
    def print_wrapped_output(self):
        outs = self.get_stdout_wrap()
        if len(outs) > 1:
            self.output.write('-------------------------------------\n')
        self.output.write(outs)
        self.output.flush()

    def summary(self, totals):
        self.print_wrapped_output()
        self.output.flush()
        total = zip(['Passed: ', 'Failed: ', 'Skipped: '],[str(totals['pass']), 
                                                           str(totals['fail']), 
                                                           str(totals['skip']),
                                                            ]
                    )
        self.output.write( ', '.join( [ e[0]+e[1] for e in total ] )+'\n' )
        self.output.flush()
    
    def final(self, totals):
        if totals['fail'] is not 0:
            sleep(.5)
            sys.exit(1)
    
