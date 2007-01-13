#   Copyright (c) 2006-2007 Open Source Applications Foundation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License a
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import simplejson

def test_json_tests(setup):
    
    client = setup['jsonrpc_client']
    # Add a test
    test_add = {u'method':u'click', u'params':{u'id':u'aksjdflkajsdflkjasldkfjl'}}
    client.add_json_test(simplejson.dumps(test_add))
    x = client.next_action()
    assert x == {u'result': {u'version': u'0.1', u'params': {u'id': u'aksjdflkajsdflkjasldkfjl'}, u'method': u'click'}}
    
    # Report the test passed
    test_report = {u'test':test_add, u'result': True, u'starttime':u'1994-11-05T13:15:30.45Z', 
                   u'endtime':u'1994-11-05T13:15:30.56Z'}
    x = client.report(simplejson.dumps(test_report))
    assert x == {'result':None}
    resolved_test = {'debug': None, u'method': u'click', u'params': {u'id': u'aksjdflkajsdflkjasldkfjl'}, 'result': True, 'version': '0.1'}
    assert setup['httpd'].test_resolution_suite.resolved_tests.__contains__(resolved_test)
    
    