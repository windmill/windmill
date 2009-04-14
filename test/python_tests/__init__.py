# python_tests are for tests that can be done without a browser

import windmill
from windmill.bin import admin_lib
from time import sleep

def setup_module(module):
    """setup_module function for functest based python tests"""
    if not hasattr(windmill, 'settings'):
        admin_lib.configure_global_settings(logging_on=False)
        
    if not windmill.is_active:
        module.windmill_dict = admin_lib.setup()
    else:
        module.windmill_dict = admin_lib.shell_objects_dict

def teardown_module(module):
    """teardown_module function for functest based python tests"""
    # Incase we're in runserver mode and test were passed to the windmill command line
    if hasattr(windmill, 'settings') and windmill.settings['EXIT_ON_DONE'] and windmill.runserver_running:
        module.windmill_dict['xmlrpc_client'].stop_runserver() 
    else:
        admin_lib.teardown(module.windmill_dict)
    sleep(.25)