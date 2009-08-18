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

import unittest
import sys

from windmill.dep import functest 
reports = functest.reports

class UnitTestReporter(reports.FunctestReportInterface):
    def summary(self, test_list, totals_dict, stdout_capture):
        self.test_list = test_list

unittestreporter = UnitTestReporter()
        
reports.register_reporter(unittestreporter)

class WindmillUnitTestCase(unittest.TestCase):
    def setUp(self):
        import windmill
        windmill.stdout, windmill.stdin = sys.stdout, sys.stdin
        from windmill.bin.admin_lib import configure_global_settings, setup
        configure_global_settings()
        windmill.settings['TEST_URL'] = self.test_url
        if hasattr(self,"windmill_settings"):
            for (setting,value) in self.windmill_settings.iteritems():
                windmill.settings[setting] = value
        self.windmill_shell_objects = setup()
    
    def testWindmill(self):
        self.windmill_shell_objects['start_'+self.browser]()
        self.windmill_shell_objects['do_test'](self.test_dir, threaded=False)
        for test in unittestreporter.test_list:
            self._testMethodDoc = getattr(test, "__doc__", None) 
            self._testMethodName = test.__name__
            self.assertEquals(test.result, True)
            
    def tearDown(self):
        from windmill.bin.admin_lib import teardown
        teardown(self.windmill_shell_objects)