
import sys, os, commands

import functest
from time import sleep

def test_functest_google_firefox_url():
    base_directory = os.path.abspath(os.path.dirname(__file__))
    test_directory = os.path.join(base_directory, 'jstests')
    
    output = commands.getoutput('cd '+base_directory+' && windmill firefox -e http://www.getwindmill.com jsdir='+test_directory)
    print output
    assert 'ERROR' not in output
    sleep(.25)
    
if sys.platform == 'darwin':
    def test_functest_google_safari_url():
        base_directory = os.path.abspath(os.path.dirname(__file__))
        test_directory = os.path.join(base_directory, 'jstests')

        output = commands.getoutput('cd '+base_directory+' && windmill safari -e http://www.getwindmill.com jsdir='+test_directory)
        print output
        assert 'ERROR' not in output
        sleep(.25)