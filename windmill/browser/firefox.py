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

import windmill
import exceptions
import os, sys, shutil, signal
import killableprocess
import commands
import logging

logger = logging.getLogger(__name__)

os.environ['MOZ_NO_REMOTE'] = str(1)

def setpgid_preexec_fn():
    os.setpgid(0, 0)

def runCommand(cmd):
    """Run the given command in killable process."""
    kwargs = {'stdout':sys.stdout ,'stderr':sys.stderr, 'stdin':sys.stdin}
    
    if sys.platform != "win32":
        return killableprocess.Popen(cmd, preexec_fn=setpgid_preexec_fn, **kwargs)
    else:
        return killableprocess.Popen(cmd, **kwargs)

class MozillaProfile(object):
    
    def __init__(self):
        """Create profile dir, and populate it"""
        
        self.proxy_host = 'localhost'
        self.proxy_port = windmill.settings['SERVER_HTTP_PORT']
        
        url_split = windmill.settings['TEST_URL'].split('?')
        if len(url_split) > 1:
            self.test_url = url_split[0]+'/windmill-serv/start.html'+'?'+url_split[1]
        else:
            self.test_url = windmill.settings['TEST_URL']+'/windmill-serv/start.html'
        
        self.profile_path = windmill.settings['MOZILLA_PROFILE_PATH']
        
        if windmill.settings['MOZILLA_CREATE_NEW_PROFILE']:
            if sys.platform == 'linux2':
                print commands.getoutput('chown -R %s:%s %s' % (os.getlogin(), os.getlogin(), self.profile_path))
                                         
            if os.path.exists(self.profile_path) is True:
                shutil.rmtree(self.profile_path)
        
            shutil.copytree(windmill.settings['MOZILLA_DEFAULT_PROFILE'], self.profile_path)
        
            self.prefs_js_filename = self.profile_path + '/prefs.js'
            self.prefs_js_f = open( self.prefs_js_filename, 'w')
            self.initial_prefs()
        
        if sys.platform == 'linux2':
            print commands.getoutput('chown -R %s:%s %s' % (os.getlogin(), os.getlogin(), self.profile_path))
            windmill_firefox = open(windmill.settings['MOZILLA_BINARY'], 'r').read()
            windmill_firefox = windmill_firefox.replace('file://', '')
            windmill_firefox = windmill_firefox.replace('MOZILLA_BIN="${progbase}-bin"', 'MOZILLA_BIN="firefox-bin"')
            f = open(self.profile_path+'/'+'windmill-firefox', 'w')
            f.write(windmill_firefox); f.flush(); f.close()

            print commands.getoutput('chmod 755 %s' % (self.profile_path+'/'+'windmill-firefox'))
            windmill.settings['MOZILLA_BINARY'] = self.profile_path+'/'+'windmill-firefox'
            
    
    def initial_prefs(self):
        """Initial prefs population, separated form __init__ for ease of subclassing"""
        
        # Get rid of default browser check
        self.user_pref('"browser.shell.checkDefaultBrowser", false')
        # Suppress authentication confirmations
        self.user_pref('"network.http.phishy-userpass-length", 255')
        # Disable pop-up blocking
        self.user_pref('"browser.allowpopups", true')
        self.user_pref('"dom.disable_open_during_load", false')
        # Open links in new windows (Firefox 2.0)
        self.user_pref('"browser.link.open_external", 2')
        self.user_pref('"browser.link.open_newwindow", 2')
        # Configure local proxy
        self.user_pref('"network.proxy.http", "%s"' % self.proxy_host)
        self.user_pref('"network.proxy.http_port", %s' % str(self.proxy_port))
        self.user_pref('"network.proxy.no_proxies_on", ""')
        self.user_pref('"network.proxy.type", 1')
        
        self.user_pref('"network.http.max-connections", 10')
        self.user_pref('"network.http.max-connections-per-server", 8')
#        self.user_pref('"network.http.max-persistent-connections-per-proxy", 2')
#        self.user_pref('"network.http.max-persistent-connections-per-server", 2')
        self.user_pref('"network.http.pipelining.maxrequests", 6')
        
        # Turn off favicon requests, no need for even more requests
        self.user_pref('"browser.chrome.favicons", false')
        
        self.user_pref('"startup.homepage_override_url", "' + self.test_url + '"')
        self.user_pref('"browser.startup.homepage", "' + self.test_url + '"')
        self.user_pref('"startup.homepage_welcome_url", ""')
        # Disable security warnings
        self.user_pref('"security.warn_submit_insecure", false')
        self.user_pref('"security.warn_submit_insecure.show_once", false')
        self.user_pref('"security.warn_entering_secure", false')
        self.user_pref('"security.warn_entering_secure.show_once", false')
        self.user_pref('"security.warn_entering_weak", false')
        self.user_pref('"security.warn_entering_weak.show_once", false')
        self.user_pref('"security.warn_leaving_secure", false')
        self.user_pref('"security.warn_leaving_secure.show_once", false')
        self.user_pref('"security.warn_viewing_mixed", false')
        self.user_pref('"security.warn_viewing_mixed.show_once", false')
        # Disable cache
        self.user_pref('"browser.cache.disk.enable", false')
        self.user_pref('"browser.sessionstore.resume_from_crash", false')
        # self.user_pref('"browser.cache.memory.enable", false')
        # Disable "do you want to remember this password?"
        self.user_pref('"signon.rememberSignons", false')
        self.user_pref('"dom.max_script_run_time", 20')
        return
        
    def user_pref(self, string):
        """Set user pref"""
        self.prefs_js_f.write('user_pref(' + string + ');\n')
        self.prefs_js_f.flush()
        
    def add_js(self, string):
        """Add line of js to prefs"""
        self.prefs_js_f.write(string + '\n')
        self.prefs_js_f.flush()
        
def convertPath(linuxPath):
    """Convert windows path to cygwin path"""
    sysdrive = os.environ.get('SYSTEMDRIVE')
    cygdrive = '/cygdrive/%s' % sysdrive.lower().replace(':', '')

    return linuxPath.replace(cygdrive, '%s' % sysdrive).replace('/', '\\')

class MozillaBrowser(object):
    """MozillaBrowser class, init requires MozillaProfile instance"""
    def __init__(self, profile):

        self.profile = profile
        self.mozilla_bin = windmill.settings['MOZILLA_BINARY']
        self.p_handle = None
        
        if sys.platform == 'cygwin':
            profile_path = convertPath(self.profile.profile_path)
        else:
            profile_path = self.profile.profile_path
            
        if windmill.settings['MOZILLA_COMMAND'] is None:
            self.command = [self.mozilla_bin, '-profile', profile_path, self.profile.test_url]

        else:
            self.command = windmill.settings['MOZILLA_COMMAND']

    def start(self):
        """Start the browser"""
        self.p_handle = runCommand(self.command)

        logger.info(self.command)

    def is_alive(self):
        """Check if the browser thread is alive"""
        if self.p_handle.poll() is None:
            return False

        try:
            self.p_handle.kill(group=True)
            return True
        except exceptions.OSError:
            return False

    def kill(self, kill_signal):
        """Kill the browser"""
        if sys.platform == 'darwin':
            try:
                os.kill(self.p_handle.pid+1, kill_signal)
            except:
                try:
                    os.kill(self.p_handle.pid, kill_signal)
                except:
                    logger.error('Cannot kill firefox')
        else:
            try:
                self.p_handle.kill(group=True)
            except:
                logger.error('Cannot kill firefox')
                
        if windmill.settings['MOZILLA_CREATE_NEW_PROFILE'] is True:
            # Windows holds on to the file handlers for prefs.js indefinitely, we leave tempfiles and let the OS handle cleaning them up at a later time 
            if sys.platform != "win32" and os.path.isdir(windmill.settings['MOZILLA_PROFILE_PATH']):
                shutil.rmtree(windmill.settings['MOZILLA_PROFILE_PATH'])

    def stop(self):
        """Stop the browser"""
        self.kill(signal.SIGTERM)
        
