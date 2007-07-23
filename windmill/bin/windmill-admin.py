#!/usr/bin/env python
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

## We need to import every library we ever use here so that setup.py compiles will find all of them
#import wx
#from wx import *
import os, sys, time
import xmlrpclib
import new
import httplib, urllib, re
import copy, socket, random, urlparse, logging
import wsgi_jsonrpc, wsgi_xmlrpc, wsgi_proxy, wsgi_fileserver
import simplejson
import email
from email.Header import Header, decode_header
import dateutil, time, datetime, SimpleXMLRPCServer
import cherrypy
import commands, shutil, signal, webbrowser, StringIO
import uuid, code, keyword, readline, rlcompleter

# WINDMILL_DIR = os.path.abspath(os.path.expanduser(sys.modules[__name__].__file__)+os.path.sep+os.path.pardir+os.path.sep+os.path.pardir+os.path.sep+os.path.pardir)
# sys.path.insert(0, WINDMILL_DIR)

import windmill

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'help':
        from windmill.bin import admin_options
        admin_options.help()
        sys.exit()

    # import simplejson
    from windmill.bin import admin_lib
    import windmill
    windmill.stdout, windmill.stdin = sys.stdout, sys.stdin
    
    admin_lib.configure_global_settings()
    
    action = admin_lib.process_options(sys.argv)
    
    shell_objects = admin_lib.setup()
    
    if windmill.settings.get('TEST_FRAME', None):
        result = windmill.settings['TEST_FRAME'](shell_objects)
        if result == 'call_action':
            action(shell_objects)
        elif result == 'teardown_called':
            sys.exit()
        else:
            print "Something happended in the framework that prevented teardown and/or action call"
            print "attempting teardown..."
            admin_lib.teardown(shell_objects)
    else:
        action(shell_objects)








