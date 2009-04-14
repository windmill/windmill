import unittest
import sys

from functest import reports

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