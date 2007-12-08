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
import commands

def test_google_windmill_launch():
    output = commands.getoutput('windmill firefox exit http://www.google.com test='+
                                 os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                                              'files', 'google_test.py')
                                )
    assert output.find('ERROR') is -1
    assert output.find('EXCEPTION') is -1
    assert output.find('Traceback') is -1
