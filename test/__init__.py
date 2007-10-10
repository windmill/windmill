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

from windmill.bin import admin_lib
import os, sys
import functest
from time import sleep
import wsgi_fileserver

def setup_module(module):
    assert functest.registry.has_key('browser') # Make sure browser= was passed to functest
    admin_lib.configure_global_settings()
    import windmill
    windmill.settings['START_'+functest.registry.get('browser').upper()] = True
    
    windmill_dict = admin_lib.setup()

    application = wsgi_fileserver.WSGIFileServerApplication(root_path=os.path.dirname(__file__), mount_point='/windmill-unittests/')
    windmill.server.wsgi.add_namespace('windmill-unittests', application)
    
    module.windmill_dict = windmill_dict
    functest.registry['rpc_client'] = windmill.tools.make_xmlrpc_client()
    
def teardown_module(module):
    try:
        if functest.registry.get('browser_debugging', False):
            sleep(1)
    except KeyboardInterrupt:
        pass
    admin_lib.teardown(module.windmill_dict)
    sleep(.5)
    