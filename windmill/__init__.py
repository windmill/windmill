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

has_ssl = True
try:
    import OpenSSL
except ImportError:
    print "*" * 60
    print "*** HTTPS Support is disabled, as PyOpenSSL was not found."
    print "*** Please install PyOpenSSL."
    print "*" * 60
    has_ssl = False

import authoring, bin, browser, server, conf, tools
from urlparse import urlparse

# This is for some event driven framework code latched on to windmill
TESTS_COMPLETED = False
RESULTS = {'pass':0, 'fail':0}

teardown_directories = []

is_active = None
in_shell = False
block_exit = False
test_has_failed = False
runserver_running = False

def get_test_url(url):
    url = urlparse(url)
    if url.path:
        if url.path != '/':
            test_url = url.geturl().replace(url.path, url.path+'/windmill-serv/start.html')
        elif url.query:
            test_url = url.geturl().replace('?'+url.query, '/windmill-serv/start.html'+'?'+url.query)
        else:
            test_url = url.geturl() + 'windmill-serv/start.html'
    elif url.query:
        test_url = url.geturl().replace('?'+url.query, '/windmill-serv/start.html'+'?'+url.query)
    else:
        test_url = url.geturl().replace(url.netloc, url.netloc+'/windmill-serv/start.html')
    return test_url
