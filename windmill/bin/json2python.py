#   Copyright (c) 2007 Open Source Applications Foundation
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

from windmill.dep import json
import sys, os
from windmill.authoring import transforms

def transform_json_to_python(json_strings):
    """Transform serialized JSON objects to python code using the windmill transformer architecture"""
    tests = []
    for line in json_strings:
        tests.append(json.loads(line))
    return transforms.build_test_file(tests)
    
if __name__ == '__main__':
    """Command line utility for converting JSON formatted tests to Python"""
    if len(sys.argv) is 1:
        files = [fn for fn in os.listdir('.') if fn.endswith('.json')]
    else:
        files = [fn for fn in sys.argv if fn.endswith('.json')] 
    
    for filename in files:
        f = open(filename.replace('.json', '.py'), 'w')
        f.write(transform_json_to_python(open(filename, 'r').read().splitlines()))
        f.flush()
        f.close()
        print 'created file %s' % filename.replace('.json', '.py')
    
    
    
    
    
