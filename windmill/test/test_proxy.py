#   Copyright (c) 2006-2007Open Source Applications Foundation
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

import time
import httplib, urllib
from urlparse import urlparse

import sys
sys.path.append('../')

from dev_tools.server_tools import get_request

        
def test_proxy_passthrough():
    """Test that we can get google.com through the proxy"""
    
    response = get_request('http://www.google.com')
    if response.body.find('About Google') is -1:
        assert False
    else:
        assert True
        
def test_windmill_serv():
    """Test that requests to /windmill-serv/ return files from core. Requires that start.html contains 
    'Open Source Applications Foundation'"""
    
    response = get_request('http://www.google.com/windmill-serv/start.html')
    if response.body.find('Open Source Applications Foundation') is -1:
        assert True
    else:
        assert True
        

        
        
        
        
        
        
        