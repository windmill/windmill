#   Copyright (c) 2006 Open Source Applications Foundation
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

if __name__ == "__main__":

    import sys
    sys.path.append('../')
    sys.path.append('.')

    import time
    import windmill_wsgi
    import xmlrpclib
    from threading import Thread

    HTTPD = windmill_wsgi.make_windmill_server()
    HTTPD_THREAD = Thread(target=HTTPD.serve_until)
    HTTPD_THREAD.start()
    time.sleep(5)
    
    from browser_tools import *
    from server_tools import *

    # Browser tests
    # browser = setup_browser()
    print 'browser should be coming up'
    
    # Setup xmlrpc client
    p = ProxiedTransport('localhost:4444')
    xmlrpc_obj = xmlrpclib.ServerProxy('http://www.google.com/windmill-xmlrpc/',transport=p)
    for method in xmlrpc_obj.system.listMethods():
        print method, xmlrpc_obj.system.methodHelp(method)
    
    try:
        # try to use IPython if possible
        import IPython
        shell = IPython.Shell.IPShell(user_ns=locals())
        shell.mainloop()
    except:
        import code
        code.interact(local=locals())