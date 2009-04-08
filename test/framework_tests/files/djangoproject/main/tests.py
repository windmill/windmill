import os
from windmill.authoring import djangotest 

from StringIO import StringIO

class TestProjectWindmillTest(djangotest.WindmillDjangoUnitTest): 
    test_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'windmilltests')
    browser = 'firefox'
