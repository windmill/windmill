#   Copyright (c) 2006-2007Open Source Applications Foundation
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

from __init__ import Selenium
import os, unittest, time, re, types

class dummy_method(object):
    """A Dummy method"""
    def __call__(self):
        pass

class SeleniumTestCase(unittest.TestCase):
    """Base unittest class for Selenium tests."""
    def __init__(self, url='http://localhost:8080', serverport=4444, 
                 browser='*firefox', selenium=None,
                 username=None, password=None):
        
        unittest.TestCase.__init__(self, methodName='run')
        self.selenium = selenium
        if browser.startswith('*'):
            self.browser = browser
        else:
            self.browser = '*' + browser
        
        self.serverport = serverport
        self.url = url
        
        if username is not None:
            self.userinfo = {'username':username, 'password':password}
            
    def run(self, result=None):
        """Override the run method to run all methods that begin with test"""
        if result is None: result = self.defaultTestResult()
        result.startTest(self)
        ok = True
        
        testMethods = []
        for member_name in dir(self):
            if member_name.startswith('test') is True:
                testMethod = getattr(self, member_name)
                testMethods.append(testMethod)
            
        try:
            self.setUp()
        except KeyboardInterrupt:
            raise
        except:
            result.addError(self, self._exc_info())
            return    
            
        for testMethod in testMethods:

            ok = False
            try:
                testMethod()
                ok = True
            except self.failureException:
                result.addFailure(self, self._exc_info())
            except KeyboardInterrupt:
                raise
            except:
                result.addError(self, self._exc_info())
            if ok is True: 
                result.addSuccess(self)

        try:
            self.tearDown()
        except KeyboardInterrupt:
            raise
        except:
            result.addError(self, self._exc_info())
            ok = False
    
        if ok is True: 
            result.addSuccess(self)
    
        result.stopTest(self)
    
    def setUp(self):
        """Setup selenium object if it doesn't already exist"""
        self.verificationErrors = []
        # If the selenium object wasn't passed in during initialization then create it
        if self.selenium is None:
            self.selenium = Selenium("localhost", self.serverport, self.browser, self.url)
            self.selenium.start()
        
    def tearDown(self):
        """Kill selenium object"""
        self.selenium.stop()
        if hasattr(self, 'server_controller'):
            self.server_controller.stop_server()
        self.assertEqual([], self.verificationErrors)
        
class SeleniumTestSuite(unittest.TestSuite):
    
    continuous_test = True
    
    def __init__(self, tests=()):
        unittest.TestSuite.__init__(self, tests=tests)
        self._registration = None
        self._authorization = None
    
    def addRegistrationTest(self, testinstance):
        self._tests.insert(0, testinstance)
        self._registration = testinstance
    
    def addAuthorizationTest(self, testinstance):
        if self._registration is not None:
            self._tests.insert(1, testinstance)
        else:
            self._tests.insert(0, testinstance)
        self._authorization = testinstance
    
    def addTest(self, testinstance):
        """TestSuite.addTest wrapper. Accounts for registration and authorization tests"""
        if hasattr(testinstance, '_registration_') is True and self._registration is None:
                self.addRegistrationTest(testinstance)
                return
        elif hasattr(testinstance, '_authorization_') is True and self._authorization is None:
                self.addAuthorizationTest(testinstance)
                return
                
        unittest.TestSuite.addTest(self, testinstance)
        
    def addServerController(self, server_control):
        
        for test in self._tests:
            test.server_controller = server_control
        
    def run(self, result):
        if self.continuous_test is True:
            # Replace final tearDown with the teardown from the registration case
            if self._registration is not None:
                self._tests[-1].tearDown = self._registration.tearDown
            for test in self._tests:
                # Remove the rest of the setUp and tearDown methods
                if test is not self._tests[0]:
                    test.setUp = dummy_method()
                if test is not self._tests[-1]:
                    test.tearDown = dummy_method()      
                         
        for test in self._tests:
            if result.shouldStop:
                break
            test(result)
        return result

class SeleniumTestLoader(object):
    
    suiteClass = SeleniumTestSuite
    testClass = SeleniumTestCase
    
    def __init__(self, url, serverport, browser, username=None, password=None, continuous_test=True):
        self.url = url
        self.serverport = serverport
        self.browser = browser
        self.suite = self.suiteClass()
        self.suite.continuous_test = continuous_test
        self.username = username
        self.password = password
    
    def loadTestsFromDirectories(self, dirnames=[os.curdir]):
        """Finds all .py files in directories and add to suite"""
        test_filenames = []
        for directory in dirnames:
            for filename in os.listdir(directory):
                if filename.find('.py') is not -1:
                    test_filenames.append(filename)
        
        self.loadTestModulesFromFiles(test_filenames)
                    
    def loadTestModulesFromFiles(self, filenames=[]):
        """Load modules from files"""
        test_modules = []
        for filename in filenames:
            try:
                test_module = __import__(filename.strip('.py'))
                test_modules.append(test_module)
            except ImportError:
                pass
        
        self.loadTestClassesFromModuleList(test_modules)
        
    def loadTestClassesFromModuleList(self, test_modules):
        """Loads classes from modules"""
        test_classes = []
        
        for test_module in test_modules:
            for obj_name in dir(test_module):
                obj = getattr(test_module, obj_name)
                try:
                    if issubclass(obj, self.testClass):
                        test_classes.append(obj)
                except:
                    pass
        
        self.loadTestsFromClassList(test_classes)
        
    def loadTestsFromClassList(self, test_classes):
        """Instantiates all classes in list and adds them to suite"""
        if self.browser.startswith('*') is False:
            self.browser = '*' + self.browser
        
        self.selenium = Selenium("localhost", self.serverport, self.browser, self.url)
        self.selenium.start()
        for test_class in test_classes:
            test_instance = test_class(url=self.url, serverport=self.serverport, 
                                           browser=self.browser, username=self.username,
                                           password=self.password, selenium=self.selenium)
                                           
            self.suite.addTest(test_instance)

###########################################
## Below is all selenium testrunner code ##
###########################################

from optparse import OptionParser
import os

def init_options(**kwds):
    """Load and parse the command line options, with overrides in **kwds.
    Returns options"""

    _configItems = {        
        'url':      ('-l', '--url', 's', 'http://localhost:8080', 'SELENIUM_TEST_URL', 
                         'Test site address. Example -- http://www.google.com. Defaults to http://localhost:8080'),
        'testdirs':     ('-t', '--testdirs', 's', None, 'SELENIUM_TEST_TESTDIRS',
                         'Comma seperated list of test directories. Defaults to "."'),
        'username':     ('-u', '--username', 's', None, 'SELENIUM_TEST_USERNAME', 
                         'Test server bundler username. Defaults to "cosmo_test_username"'),
        'password':     ('-w', '--password', 's', None, 'SELENIUM_TEST_PASSWORD', 
                         'Test server bundler password. Defaults to "cosmo_test_password"'),
        'selenium':     ('-n', '--selenium', 's', None, 'SELENIUM_TEST_SELENIUM', 
                         'Selenium core directory, if different from the core in selenium-server'),
        'server':       ('-s', '--server', 's', None, 'SELENIUM_TEST_SERVER', 
                         'Selenium server .jar file'),
        'serverport':   ('-p', '--port', 's', None, 'SELENIUM_TEST_SERVER_PORT', 
                         'Selenium server port. Defaults to 4444'),
        'create':       ('-c', '--create', 'b', None, 'SELENIUM_TEST_CREATE', 
                         'Create test user. Defaults to True if username & password are unspecified'),
        'noauth':       ('-a', '--noauth', 'b', False, 'SELENIUM_TEST_NOAUTH', 
                         'Skip authentication.'),   
        'browser':      ('-b', '--browser', 's', 'firefox', 'SELENIUM_TEST_BROWSER',
                         'The browser you wish to use for tests. Defaults to "firefox"'),
        'continuous':   ('-C', '--continuous', 'b', True, 'SELENIUM_TESTS_CONTINUOUS',
                         'Run tests continuously without restarting the browser for each test class. Defaulgs to "True"'),
    }

    usage  = "usage: %prog [options]"  # %prog expands to os.path.basename(sys.argv[0])
    parser = OptionParser(usage=usage, version="%prog")

    for key in _configItems:
        (shortCmd, longCmd, optionType, defaultValue, environName, helpText)  = _configItems[key]
        if environName and os.environ.has_key(environName):
            defaultValue = os.environ[environName]
        if optionType == 'b':
            parser.add_option(shortCmd,
                              longCmd,
                              dest=key,
                              action='store_true',
                              default=defaultValue,
                              help=helpText)
        else:
            parser.add_option(shortCmd,
                              longCmd,
                              dest=key,
                              default=defaultValue,
                              help=helpText)
    (options, args) = parser.parse_args()
    for (opt,val) in kwds.iteritems():
        setattr(options, opt, val)
    options.args = args  # Store up the remaining args
    return options

Loader = SeleniumTestLoader

def main(testfiles=None, options={}, server_options={}):

    from seleniumservercontrol import SeleniumServerController
    from unittest import TextTestRunner
    import copy

    custom_options = copy.copy(options)
    options = init_options()

    # Overwrite any init options with ones passed to the method 
    for key, value in custom_options.items():
        setattr(options, key, value)

    if options.serverport is not None:
        options.serverport = int(options.serverport)
        serverport = options.serverport
    else:
        serverport = 4444
        
    if options.server is not None:
        # If a new selenium core is defined then add the proper argument    
        if options.selenium is not None:
            server_options.update({'-Dselenium.javascript.dir':options.selenium})
        # If a new selenium port is defined then add the proper argument
        if options.serverport is not None:
            server_options.update({'-port':options.serverport})

        # Instantiate the server controller
        server_control = SeleniumServerController(options.server, server_options)
        

    loader = Loader(options.url, serverport, options.browser, username=options.username, 
                           password=options.password, continuous_test=options.continuous)

    if testfiles is None:    
        if options.testdirs is not None:
            options.testdirs = options.testdirs.split(',')
            loader.loadTestsFromDirectories(options.testdirs)
        else:
            loader.loadTestsFromDirectories()
    else:
        loader.loadTestModulesFromFiles(testfiles)

    # Assign server as member to all test classes
    suite = loader.suite
    if options.server is not None:
        suite.addServerController(server_control)

    text_runner = TextTestRunner()
    text_runner.run(suite)

    
    