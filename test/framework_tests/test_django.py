import os
import commands

import subprocess

def test_django():
    test_directory = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'files', 'djangoproject')
    
    output = commands.getoutput('cd '+test_directory+' && python manage.py test')
    assert 'FAIL: testFail (djangoproject.main.tests.TestProjectWindmillTest)' in output
    assert 'Ran 4 tests' in output
    assert 'FAILED (failures=1)' in output
    