#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
#   Copyright (c) 2009 Domen Kozar <domen@dev.si>
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

import windmill
import sys
import copy
from pkg_resources import resource_string

import os

if not sys.version.startswith('2.4'):
    from urlparse import urlparse
else:
    # python 2.4
    from windmill.tools.urlparse_25 import urlparse

windmill.browser_registry = {}

def get_firefox_controller():
    """Get the firefox browser object"""
    from windmill.dep import mozrunner
    global_settings = mozrunner.global_settings
    from windmill.dep import simplesettings
    
    mozrunner_settings = simplesettings.initialize_settings(global_settings, mozrunner,     
                                                  local_env_variable=mozrunner.settings_env)
    
    for key, value in mozrunner.settings.items():
        if not windmill.settings.has_key(key):
            windmill.settings[key] = value
    
    test_url = windmill.get_test_url(windmill.settings['TEST_URL'])  
    
    if windmill.settings['INSTALL_FIREBUG']:
        windmill.settings['MOZILLA_PLUGINS'] = [os.path.join(os.path.dirname(__file__), os.path.pardir, 'xpi', 'firebug-1.5.0.xpi')]
    
    prop_hash = {
                'extensions.chromebug.openalways' : True,
        'extensions.chromebug.showIntroduction' : False,
        'general.warnOnAboutConfig' : False,
        'extensions.venkman.enableChromeFilter' : False,
        # Get rid of default browser check
        "browser.shell.checkDefaultBrowser": False,
        # Suppress authentication confirmations
        "network.http.phishy-userpass-length": 255,
        # Disable pop-up blocking
        "browser.allowpopups": True,
        "dom.disable_open_during_load": False,
        # Open links in new windows (Firefox 2.0)
        "browser.link.open_external": 2,
        "browser.link.open_newwindow": 2,
        # Configure local proxy
        "network.proxy.http": '127.0.0.1',
        "network.proxy.http_port": windmill.settings['SERVER_HTTP_PORT'],
        "network.proxy.no_proxies_on": "",
        "network.proxy.type": 1,
        #"network.http.proxy.pipelining" : True,
        "network.http.max-connections": 10,
        "network.http.max-connections-per-server": 8,
    #        "network.http.max-persistent-connections-per-proxy": 2,
    #        "network.http.max-persistent-connections-per-server": 2,
        "network.http.pipelining.maxrequests": 10,

        # Turn off favicon requests, no need for even more requests
        "browser.chrome.favicons": False,

        "startup.homepage_override_url": test_url,
        "browser.startup.homepage": test_url,
        "startup.homepage_welcome_url": "",
        # Disable security warnings
        "security.warn_submit_insecure": False,
        "security.warn_submit_insecure.show_once": False,
        "security.warn_entering_secure": False,
        "security.warn_entering_secure.show_once": False,
        "security.warn_entering_weak": False,
        "security.warn_entering_weak.show_once": False,
        "security.warn_leaving_secure": False,
        "security.warn_leaving_secure.show_once": False,
        "security.warn_viewing_mixed": False,
        "security.warn_viewing_mixed.show_once": False,
        # Disable cache
        "browser.cache.disk.enable": False,
        "browser.sessionstore.resume_from_crash": False,
        # self.user_pref('"browser.cache.memory.enable", false')
        # Disable "do you want to remember this password?"
        "signon.rememberSignons": False,
        "dom.max_script_run_time": 100,
        # Disable OSCP validation, breaks through proxy.
        "security.OCSP.enabled":0,
        #Make the firefox IDE stop showing the location bar
        "dom.disable_window_open_feature.location":False,
        "browser.rights.3.shown": True,
    }
    
    if windmill.has_ssl:
         prop_hash["network.proxy.ssl"] = '127.0.0.1'
         prop_hash["network.proxy.ssl_port"] = windmill.settings['SERVER_HTTP_PORT']
       
    windmill.settings['MOZILLA_PREFERENCES'].update(prop_hash)
        
    windmill.settings['MOZILLA_CMD_ARGS'] = [test_url]
    
    controller = mozrunner.get_moz_from_settings(copy.copy(windmill.settings))

    # Override cert8.db with one from windmill which has windmill certificate
    # in it, that way self-signed certificate warning is suppressed.
    cert8 = resource_string(__name__, 'cert8.db')
    if sys.platform not in ('win32', 'cygwin',):
        f = open(os.path.join(controller.profile, 'cert8.db'), 'w')        
    else:
        f = open(os.path.join(controller.profile, 'cert8.db'), 'wb')
        
    f.write(cert8)
    f.close()    
    windmill.settings['MOZILLA_PROFILE'] = mozrunner.settings['MOZILLA_PROFILE']
    return controller
    
def get_ie_controller():
    """Get the IE browser object"""
    import ie
    browser = ie.InternetExplorer()
    return browser
    
def get_safari_controller():
    """Get the Safari browser object"""
    import safari
    browser = safari.Safari()
    return browser
    
def get_chrome_controller():
    """Get the Safari browser object"""
    import chrome
    browser = chrome.Chrome()
    return browser
    
