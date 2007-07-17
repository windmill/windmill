#   Copyright (c) 2007 Open Source Applications Foundation
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

import sys, os, windmill, simplejson

def test_object_transform(test):
    params = ', '.join([key+'='+repr(value) for key, value in test['params'].items()])    
    return 'client.%s(%s)' % (test['method'], params)
    
def build_test_file(tests):
    ts = ''
    ts += 'from windmill.authoring import WindmillTestClient\n\n'
    ts += 'client = WindmillTestClient(__name__)'
    ts += 'def test():'
    ts += '\n   '.join([test_object_transform(test) for test in tests])
    return ts
    
def create_python_test_file(suite_name, tests, location=None):
    if location is None: 
        location = os.path.join(windmill.settings['JS_PATH'], 'saves', suite_name+'.py')
    f = open(location, w)
    f.write(build_test_file(tests))
    f.flush()
    f.close()
    return '%s/windmill-serv/saves/%s' % (windmill.settings['TEST_URL'], suite_name+'.py')
    
def create_json_test_file(suite_name, tests, location=None):
    if location is None: 
        location = os.path.join(windmill.settings['JS_PATH'], 'saves', suite_name+'.json')
    f = open(location, w)
    for test in tests:
        f.write(simplejson.dumps(test))
        f.write('\n')
    f.flush()
    f.close()
    return '%s/windmill-serv/saves/%s' % (windmill.settings['TEST_URL'], suite_name+'.json')
    
registry = {'python':create_python_test_file, 'json':create_json_test_file}

