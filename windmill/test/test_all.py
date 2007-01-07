#   Copyright (c) 2006-2007Open Source Applications Foundation
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
    from threading import Thread

    HTTPD = windmill_wsgi.make_windmill_server()
    HTTPD_THREAD = Thread(target=HTTPD.serve_until)
    HTTPD_THREAD.start()
    time.sleep(5)
    print 'setup server'

    from dev_tools import server_tools, browser_tools
    from test_proxy import test_proxy

    # Browser tests
    browser = browser_tools.setup_browser()
    print 'browser should be coming up'
    time.sleep(5)
    browser_tools.teardown_browser(browser)

    # Proxy tests
    test_proxy.test_proxy_passthrough()
    test_proxy.test_windmill_serv()

    # Shut down server
    HTTPD.server_stop()
    print 'bringing down module'
