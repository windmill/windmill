import bin, collector, formatter, frame, global_settings, reports, runner
import os, sys
from time import sleep

registry = {}

def configure(settings_module=global_settings, registry={}):
    """Configure the framework"""
    from windmill.dep import functest
    functest.registry.update(registry)
    functest.modules_passed = []
    
def run_framework(test_args=[], test_runner=None, test_collector=None):
    """Run the functest framework"""
    if test_runner is None:
        test_runner = runner.CLIRunner()
    runner.test_runner = test_runner
        
    if test_collector is None:
        test_collector = collector.Collector()
    collector.test_collector = test_collector
    
    tests = []
    test_runner.start()
    
    test_args = [os.path.abspath(arg) for arg in test_args]
    
    if len(test_args) is 0:
        test_args.append(os.path.abspath(os.path.curdir))
        
    for arg in test_args:
        module_chain = test_collector.create_module_chain(arg)
        tests.append([ test_collector.create_test_module(arg), module_chain ])

    runner.test_runner.wrap_stdout(global_settings.wrap_stdout, global_settings.wrap_stderr)
    global_settings.test_runner = test_runner
    totals = frame.execute(tests)
    stdout_wrap = test_runner.get_stdout_wrap()
    if stdout_wrap is None:
        stdout_wrap = ''
    sys.stdout, sys.stderr = sys.__stdout__, sys.__stderr__
    reports.report_summary(totals, stdout_wrap)
    runner.test_runner.summary(totals)
    reports.report_final(totals)
    runner.test_runner.final(totals)
    sleep(.5)