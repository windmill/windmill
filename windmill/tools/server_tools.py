#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
#   Copyright (c) 2009 Domen Kozar <domen@dev.si>
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
import xmlrpclib
import sys
if not sys.version.startswith('2.4'):
    from urlparse import urlparse
else:
    # python 2.4
    from windmill.tools.urlparse_25 import urlparse

def get_request(url, proxy_host='127.0.0.1', proxy_port=4444):
    
    connection = httplib.HTTPConnection(proxy_host + ':' + str(proxy_port))
    connection.request('GET', url)
    response = connection.getresponse()
    response.body = response.read()
    return response
    
    import xmlrpclib


class ProxiedTransport(xmlrpclib.Transport):
    
    def __init__(self, proxy, user_agent='python.httplib'):
        """Initialization, set the proxy location"""
        try:
            xmlrpclib.Transport.__init__(self)
        except AttributeError:
            pass
            # python 2.4
        self.proxy = proxy
        self.user_agent = user_agent

    def make_connection(self, host):
        self.realhost = host
        import httplib
        if ((sys.version_info[0] == 2 and sys.version_info[1] == 7) or
            (sys.version_info[0] == 3 and sys.version_info[1] == 2)):
            # Fix for incompatibility bug between Python version
            # 2.6/3.1 and 2.7/3.2 (current, as of 2010/11/13).  This
            # has yet to be fixed in 2.7.1 RC1, but it is addressed
            # here http://bugs.python.org/issue8194 and may be fixed
            # in the future, so we'd need to remove this or update it
            # to check the version patch level.
            return httplib.HTTPConnection(self.proxy)
        else:
            return httplib.HTTP(self.proxy)

    def send_request(self, connection, handler, request_body):
        connection.putrequest("POST", 'http://%s%s' % (self.realhost, handler))

    def send_host(self, connection, host):
        connection.putheader('Host', self.realhost)

