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
import os, sys, logging

class LogLevel(object):
    """Log level command, sets the global logging level."""
    option_names = (None, 'loglevel')
    
    def __call__(self, value):
        level = getattr(logging, value)
        windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, value)
        
        return level
        
class ExitOnDone(object):
    """Exit after all tests have run."""
    option_names = ('e', 'exit')
    
    def __call__(self):
        windmill.settings['EXIT_ON_DONE'] = True
    
class Debug(object):    
    """Turn on debugging."""    
    option_names = ('d', 'debug')
    
    def __call__(self):
        windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, 'DEBUG')
    
class TestFile(object):
    """Set the test file to run on startup."""
    option_names = (None, 'testfile')
    
    def __call__(self, value):
        windmill.settings['TEST_FILE'] = os.path.abspath(os.path.expanduser(value))
    
class TestDir(object):
    """Set the test directory to run on startup."""
    option_names = (None, 'testdir')
    
    def __call__(self, value):
        windmill.settings['TEST_DIR'] = os.path.abspath(os.path.expanduser(value))
        
class GeneralBoolSettingToTrue(object):
    """Base class for setting a generic value to True."""
    def __call__(self):
        windmill.settings[self.setting] = True
        
class GeneralBoolSettingToFalse(object):
    """Base class for setting a generic value to False."""
    def __call__(self):
        windmill.settings[self.setting] = False
        
class StartFirefox(GeneralBoolSettingToTrue):
    """Start the firefox browser."""
    option_names = ('m', 'firefox')
    setting = 'START_FIREFOX'
    
class StartIE(GeneralBoolSettingToTrue):
    """Start the internet explorer browser. Windmows Only."""
    option_names = ('x', 'ie')
    setting = 'START_IE'
    
class RunPythonTests(object):
    """Run a set of python tests. If no test file is specified the current directory is used."""
    option_names = ('t', 'test')
    setting = 'PYTHON_TEST_FRAME'
    def __call__(self, value=None):
        windmill.settings[self.setting] = True
        windmill.settings['PYTHON_TEST_FILE'] = value

class PDB(GeneralBoolSettingToTrue):
    """Enable pdb debugging when running python tests."""
    option_names = ('p', 'pdb')
    setting = 'ENABLE_PDB'
    
class BrowserDebugging(GeneralBoolSettingToTrue):
    """Enable browser debugging. Python tests will all load in to the server at once."""
    option_names = (None, 'browserdebug')
    setting = 'BROWSER_DEBUGGING'
    
class ContinueOnFailure(GeneralBoolSettingToTrue):
    """Keep the browser running tests after failure"""
    option_names = ('c', 'continueonfailure')
    setting = 'CONTINUE_ON_FAILURE'
    
class UseCode(GeneralBoolSettingToTrue):
    """Use the code module rather than ipython"""
    option_names = (None, 'usecode')
    setting = 'USECODE'
        
def process_module(module):
    """Process this modules option list"""
    options_dict = {}
    flags_dict = {}
    
    for klass in [getattr(module, cname) for cname in dir(module) if hasattr(getattr(module, cname), 'option_names')]:
        if klass.option_names[0] is not None:
            flags_dict[klass.option_names[0]] = klass()
        options_dict[klass.option_names[1]] = klass()
        
    module.options_dict = options_dict
    module.flags_dict = flags_dict
    
def help():
    module = sys.modules[__name__]
    from windmill.conf import global_settings
    for option in [getattr(module, x) for x in dir(module) if (
                   hasattr(getattr(module, x), 'option_names')) and (
                   getattr(module, x).__doc__ is not None ) ]:
        if hasattr(option, 'setting'):
            default = ' Defaults to %s' % str(getattr(global_settings, option.setting, None))
        else:
            default = ''
        print ' = '.join([str(option.option_names), option.__doc__]) + default
    



