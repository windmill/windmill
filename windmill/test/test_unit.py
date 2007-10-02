#   Copyright (c) 2006-2007 Open Source Applications Foundation
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

import os
import simplejson
import functest

def test_wmunti1():
    client = functest.registry['rpc_client']
    
    json_strings = open(os.path.join(os.path.dirname(__file__), 'wmunit1.json')).read().splitlines()
    commands = [ simplejson.loads(s) for s in json_strings ]
    for command in commands:
        if command['method'].find('commands') is -1:
            result_obj = client.execute_test(command)
        else:
            result_obj = client.execute_command(command)
        assert result_obj['result']
        
    
    