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


import os, sys
import windmill

def configure_global_settings(WINDMILL_SETTINGS):
        
    # Get local config
    
    if os.environ.has_key('WINDMILL_CONFIG_FILE'):
        sys.path.insert(0, os.path.dirname(os.path.abspath(os.environ['WINDMILL_CONFIG_FILE'])))
        local_settings = __import__(os.path.basename(os.path.abspath(os.environ['WINDMILL_CONFIG_FILE'])))
        sys.path.remove(os.path.dirname(os.path.abspath(os.environ['WINDMILL_CONFIG_FILE'])))
    else:
        try:
            import windmill_settings as local_settings
        except:
            local_settings = object()
            
    windmill.settings = windmill.conf.configure_settings(local_settings)
    
        
def make_xmlrpc_client():
    proxy = windmill.tools.server_tools.ProxiedTransport('localhost:4444')
    xmlrpc_client = xmlrpclib.ServerProxy(WINDMILL_SETTINGS['TEST_URL']+'/windmill-xmlrpc/',transport=proxy)
    return xmlrpc_client        
    
    
def start_browser():
    browser = windmill.browser.browser_tools.setup_browser()
    return browser
    
    
def runserver():
    import windmill
    
    if len(sys.argv) > 2:
        if sys.argv[2] == 'daemon':
            httpd, httpd_thread, loggers = windmill.bin.run_server.run_threaded()
            httpd_thread.setDaemon(True)
    else:
        httpd, loggers = windmill.bin.run_server.setup_server()
        try:
            httpd.serve_until()
        except KeyboardInterrupt:
            while httpd.is_alive() is True:
                httpd.server_stop()
                httpd.socket.close()
                time.sleep(1)
            sys.exit()
            
    
def shell():
    httpd, httpd_thread, loggers = windmill.bin.run_server.run_threaded()

    import windmill

    if hasattr(windmill.tools.dev_environment, 'IPyShell'):
        import IPython
        shell = IPython.Shell.IPShell(user_ns=locals(), shell_class=windmill.tools.dev_environment.IPyShell)
        shell.IP.httpd = httpd
        shell.IP.httpd_thread = httpd_thread
        shell.mainloop()
    else:
        import code
        code.interact(local=locals())    
    
    
mapping = {'shell':shell, 'runserver':runserver}

if __name__ == "__main__":
 
    action = sys.argv[1]
    
    global WINDMILL_SETTINGS
    WINDMILL_SETTINGS = {}
    configure_global_settings(WINDMILL_SETTINGS)
    
    mapping[action]()
    
    








