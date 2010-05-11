try:
    import json
except:
    try:
        import simplejson as json
    except:
        import _simplejson as json

try:
    import uuid
except:
    import _uuid as uuid

# Prefer native version if available
try:
    # To check that it's a mozrunner 1.x based version, 2.x doesn't have global_settings anymore
    import mozrunner.global_settings
    import mozrunner
except:
    import _mozrunner as mozrunner


import _simplesettings as simplesettings
import _wsgi_fileserver as wsgi_fileserver
import _wsgi_jsonrpc as wsgi_jsonrpc
import _wsgi_xmlrpc as wsgi_xmlrpc
import _functest as functest

import sys
sys.modules['functest'] = functest # Support global access on functest