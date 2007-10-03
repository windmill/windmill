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
import xmlrpclib
import functest
from time import sleep

from threading import Thread

def setup_module(module):
    windmill_dict = admin_lib.start_windmill()

    import cherrypy
    import wsgi_fileserver
    application = wsgi_fileserver.WSGIFileServerApplication(root_path=os.path.dirname(__file__), mount_point='/')
    httpd = cherrypy.wsgiserver.CherryPyWSGIServer(('', 8444), application, server_name='testing_site')
    httpd_thread = Thread(target=httpd.start)
    httpd_thread.start()
    sleep(1)
    
    module.windmill_dict = windmill_dict
    module.httpd = httpd
    module.httpd_thread = httpd_thread

    assert functest.registry.has_key('browser') # Make sure browser= was passed to functest
    module.windmill_dict['start_'+functest.registry['browser']]()
        
    functest.registry['rpc_client'] = xmlrpclib.ServerProxy('http://localhost:4444/windmill-xmlrpc', allow_none=1)
    print 'testing 1'
    
    
def teardown_module(module):
    module.httpd.stop()
    admin_lib.teardown(module.windmill_dict)
    