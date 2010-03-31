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

import _simplesettings as simplesettings
import _mozrunner as mozrunner
import _wsgi_fileserver as wsgi_fileserver
import _wsgi_jsonrpc as wsgi_jsonrpc
import _wsgi_xmlrpc as wsgi_xmlrpc
import _functest as functest

import sys
sys.modules['functest'] = functest # Support global access on functest