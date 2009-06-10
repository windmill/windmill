
import sys, os, commands

import functest
from time import sleep

def test_functest_google_firefox_url():
    test_directory = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'files', 'functest_tests')
    
    output = commands.getoutput('cd '+test_directory+' && functest browser=firefox url=http://www.google.com')
    if not output.find('Passed: 4, Failed: 0, Skipped: 0') is not -1:
        print output
    assert output.find('Passed: 4, Failed: 0, Skipped: 0') is not -1
    sleep(.25)
    
def test_functest_google_firefox_nourl():
    test_directory = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'files', 'functest_tests')
    
    output = commands.getoutput('cd '+test_directory+' && functest browser=firefox')
    if not output.find('Passed: 2, Failed: 2, Skipped: 0') is not -1:
        print output
    assert output.find('Passed: 2, Failed: 2, Skipped: 0') is not -1
    sleep(.25)
    
# if sys.platform == 'darwin':
#     def test_functest_google_safari():
#         test_directory = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'files', 'functest_tests')
# 
#         output = commands.getoutput('cd '+test_directory+' && functest browser=safari url=http://www.google.com/url?sa=p&pref=ig&pval=1&q=/webhp')
#         print output
#         sleep(1)
# else:
#     print 'Skipping Safari, platform is not Mac'
#     functest.frame.totals['skip'] += 1
    
# if os.name == 'nt' or sys.platform == 'cygwin':
#     def test_functest_google_ie():
#         test_directory = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'files', 'functest_tests')
#         # Since we aren't building a new profile we need to have that crazy thing at the end to force us 
#         # back to the "Classic Home" if someone previously logged in to iGoogle
#         output = commands.getoutput('cd '+test_directory+' && functest browser=safari url=http://www.google.com/url?sa=p&pref=ig&pval=1&q=/webhp')
#         print output
# else:
#     print 'Skipping IE, platform is not Windows'
#     functest.frame.totals['skip'] += 1