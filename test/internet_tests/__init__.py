from windmill.bin import admin_lib
import windmill
import os, sys
import wsgi_fileserver

def setup_module(module):
    windmill.authoring.setup_module(module)
    application = wsgi_fileserver.WSGIFileServerApplication(root_path=os.path.dirname(__file__), mount_point='/windmill-unittests/')
    windmill.server.wsgi.add_namespace('windmill-unittests', application)
    
from windmill.authoring import teardown_module
