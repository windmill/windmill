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

import dev_environment, json_tools, server_tools, sys
if not sys.version.startswith('2.4'):
    from urlparse import urlparse
else:
    # python 2.4
    from windmill.tools.urlparse_25 import urlparse

def make_xmlrpc_client():
    import windmill
    import xmlrpclib
    url = urlparse(windmill.settings['TEST_URL'])
    uri = url.scheme+'://'+url.netloc+'/windmill-xmlrpc/'
    proxy = windmill.tools.server_tools.ProxiedTransport('127.0.0.1:%s' % str(windmill.settings['SERVER_HTTP_PORT']))
    xmlrpc_client = xmlrpclib.ServerProxy(uri, transport=proxy, allow_none=True)
    return xmlrpc_client        
    
def make_jsonrpc_client():
    import windmill
    url = urlparse(windmill.settings['TEST_URL'])
    uri = url.scheme+'://'+url.netloc+'/windmill-jsonrpc/'
    proxy = windmill.tools.json_tools.JSONRPCTransport(uri=uri, proxy_uri='http://127.0.0.1:'+str(windmill.settings['SERVER_HTTP_PORT']))
    jsonrpc_client = windmill.tools.json_tools.ServerProxy(transport=proxy)
    return jsonrpc_client
    
def start_browser():
    import windmill
    browser = windmill.browser.browser_tools.setup_firefox()
    return browser
