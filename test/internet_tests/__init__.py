# This test directory is for tests that _must_ test external domains

# Stay away from google.com and yahool.com without specifying localization becuase you'll 
# hit a forward

from windmill.bin import admin_lib
import windmill
import os, sys
from webenv.applications.file_server import FileServerApplication

def setup_module(module):
    windmill.authoring.setup_module(module)
    application = FileServerApplication(os.path.dirname(__file__))
    windmill.server.add_namespace('windmill-unittests', application)
    
from windmill.authoring import teardown_module
