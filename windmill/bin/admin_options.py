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
import os, sys, logging
from windmill.dep import functest

class LogLevel(object):
    """Log level command, sets the global logging level."""
    option_names = (None, 'loglevel')
    def __call__(self, value):
        level = getattr(logging, value)
        windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, value)
        return level
    
# class TestFile(object):
#     """Set the test file to run on startup."""
#     option_names = (None, 'testfile')
#     
#     def __call__(self, value):
#         windmill.settings['TEST_FILE'] = os.path.abspath(os.path.expanduser(value))
#     
# class TestDir(object):
#     """Set the test directory to run on startup."""
#     option_names = (None, 'testdir')
#     
#     def __call__(self, value):
#         windmill.settings['TEST_DIR'] = os.path.abspath(os.path.expanduser(value))

class RunTest(object):
    """Run the given test file/dir"""
    option_names = ('t', 'test')
    def __call__(self, value):
        windmill.settings['RUN_TEST'] = os.path.abspath(os.path.expanduser(value))
        
class LoadTest(object):
    """Run the given test file/dir"""
    option_names = ('l', 'loadtest')
    def __call__(self, value):
        windmill.settings['LOAD_TEST'] = os.path.abspath(os.path.expanduser(value))    
        
class GeneralBool(object):
    pass        
        
class GeneralBoolSettingToTrue(GeneralBool):
    """Base class for setting a generic value to True."""
    def __call__(self):
        windmill.settings[self.setting] = True
        
class GeneralBoolSettingToFalse(GeneralBool):
    """Base class for setting a generic value to False."""
    def __call__(self):
        windmill.settings[self.setting] = False

class ExitOnDone(GeneralBoolSettingToTrue):
    """Exit after all tests have run."""
    option_names = ('e', 'exit')
    setting = 'EXIT_ON_DONE'

class Debug(GeneralBoolSettingToTrue):    
    """Turn on debugging."""    
    option_names = ('d', 'debug')
    def __call__(self):
        windmill.settings['CONSOLE_LOG_LEVEL'] = getattr(logging, 'DEBUG')
        
class StartFirefox(GeneralBoolSettingToTrue):
    """Start the firefox browser."""
    option_names = ('m', 'firefox')
    setting = 'START_FIREFOX'
    
class StartIE(GeneralBoolSettingToTrue):
    """Start the internet explorer browser. Windows Only."""
    option_names = ('x', 'ie')
    setting = 'START_IE'
    
class StartSafari(GeneralBoolSettingToTrue):
    """Start the Safari browser."""
    option_names = ('s', 'safari')
    setting = 'START_SAFARI'
    
class StartChrome(GeneralBoolSettingToTrue):
    """Start the Chrome browser. Windows Only."""
    option_names = (None, 'chrome')
    setting = 'START_CHROME'
    
# class RunPythonTests(object):
#     """Run a set of python tests. 
#         If no test file is specified the current directory is used."""
#     option_names = ('t', 'tests')
#     setting = 'PYTHON_TEST_FRAME'
#     def __call__(self, value=None):
#         windmill.settings[self.setting] = True
#         windmill.settings['PYTHON_TEST_FILE'] = value

class JavascriptTestDir(object):
    """JavaScript Test Framework : 
        Root directory of JavaScript tests."""
    option_names = (None, 'jsdir')
    setting = 'JAVASCRIPT_TEST_DIR'
    def __call__(self, value):
        windmill.settings[self.setting] = value
        
class JavascriptTestFilter(object):
    """JavaScript Test Framework : 
        Filter tests, example; ns:test_login,tests:test_user."""
    option_names = (None, 'jsfilter')
    setting = 'JAVASCRIPT_TEST_FILTER'
    def __call__(self, value):
        windmill.settings[self.setting] = value
        
class JavascriptTestRunOnly(object):
    """JavaScript Test Framework : 
        Specify the phases the framework should run example; setup,test,teardown"""
    option_names = (None, 'jsphase')
    setting = 'JAVASCRIPT_TEST_PHASE'
    def __call__(self, value):
        windmill.settings[self.setting] = value

class JavascriptScriptAppend(GeneralBoolSettingToTrue):
  """JavaScript Test Framework :
      Specify method of running the tests.
      If your code aguments native JavaScript objects and Windmill complains about
      those methods, enable this option.
      Note that syntax errors won't be reported with this option enabled."""
  option_names = (None, 'scriptappend')
  setting = 'SCRIPT_APPEND_ONLY'

class Extensions(object):
    """The directory containing any windmill javascript extensions."""
    option_names = (None, 'extensions')
    setting = 'EXTENSIONS_DIR'
    def __call__(self, value):
        windmill.settings[self.setting] = value

class PDB(GeneralBoolSettingToTrue):
    """Enable pdb debugging when running python tests."""
    option_names = ('p', 'pdb')
    setting = 'ENABLE_PDB'
    
class BrowserDebugging(GeneralBoolSettingToTrue):
    """Enable browser debugging. 
        Python tests will all load in to the server at once."""
    option_names = (None, 'browserdebug')
    setting = 'BROWSER_DEBUGGING'
    
class ContinueOnFailure(GeneralBoolSettingToTrue):
    """Keep the browser running tests after failure."""
    option_names = ('c', 'continueonfailure')
    setting = 'CONTINUE_ON_FAILURE'
    
class UseCode(GeneralBoolSettingToTrue):
    """Use the code module rather than ipython."""
    option_names = (None, 'usecode')
    setting = 'USECODE'

class Firebug(GeneralBoolSettingToTrue):
    """Install Full Firebug. Firefox only!"""
    option_names = (None, 'firebug')    
    setting = "INSTALL_FIREBUG"
    
class NoCompress(GeneralBoolSettingToTrue):
    """Do not compress windmill javascript files."""
    option_names = (None, 'nocompress')
    setting = "DISABLE_JS_COMPRESS"
    
class SSL(GeneralBool):
    """Enable SSL support."""
    option_names = (None, 'ssl')
    def __call__(self, value=None):
        import windmill
        try:
            import OpenSSL
            windmill.has_ssl = True
        except ImportError:
            print "*" * 60
            print "*** HTTPS Support is disabled, as PyOpenSSL was not found."
            print "*** Please install PyOpenSSL."
            print "*" * 60
            windmill.has_ssl = False
            
        if 'ie' in sys.argv or 'safari' in sys.argv or 'chrome' in sys.argv:
            print "*" * 60
            print "* Windmill cannot automatically install the Certificate Authority."
            print "* You will need to do this manually, the process is fully documented."
            if sys.platform in ('win32', 'cygwin'): 
                print "* https://github.com/windmill/windmill/wiki/SSL-Support"
            else:
                print "* https://github.com/windmill/windmill/wiki/SSL-Support"
            print "*" * 60
    
class Port(object):
    """Set port for windmill to run. Default is 4444."""
    option_names = (None, 'port')
    def __call__(self, value):
        windmill.settings['SERVER_HTTP_PORT'] = int(value)
        
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
    
def help(bin_name='windmill'):
    """Print windmill command line help."""
    bin_name = 'windmill'
    module = sys.modules[__name__]
    from windmill.conf import global_settings
    all_option_names = []
    options_string = []
    for option in [getattr(module, x) for x in dir(module) if (
                   hasattr(getattr(module, x), 'option_names')) and (
                   getattr(module, x).__doc__ is not None ) ]:
        all_option_names.append(option.option_names)
        if hasattr(option, 'setting'):
            if getattr(global_settings, option.setting, None) is not None:
                default = ' Defaults to %s' % str(getattr(global_settings, option.setting, None))
            else:
                default = ''
        else:
            default = ''
        if option.option_names[0] is None:
            if not issubclass(option, GeneralBool):
                options_string.append('    '+''.join([str(option.option_names[1])+'='+' :: ', 
                                      option.__doc__]) + default)
            else:
                options_string.append('    '+''.join([str(option.option_names[1])+' :: ', 
                                      option.__doc__]) + default)
        else:
            if not issubclass(option, GeneralBool):
                options_string.append('    '+''.join([
                                      '-'+str(option.option_names[0])+', '
                                      +str(option.option_names[1])+'='+' :: ',
                                      option.__doc__]) + default)
            else:
                options_string.append('    '+''.join([
                                      '-'+str(option.option_names[0])+', '
                                      +str(option.option_names[1])+' :: ',
                                      option.__doc__]) + default)

    preamble = """windmill web test automation system.
    %s [-%s] action [option=value] [firefox|ie|safari] [http://www.example.com]
    
Available Actions:
    shell         Enter the windmilll shell environment (modified python shell). 
                  Uses ipython if installed. Exit using ^d
    run_service   Run the windmill service in foreground. Kill using ^c.
    
Available Options:""" % ( bin_name,
                         ''.join([ o[0] for o in all_option_names if o[0] is not None ]) 
                        )
    print preamble
    print '\n'.join(options_string)
    



