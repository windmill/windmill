#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
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

import logging, os, sys, tempfile, shutil

def findInPath(fileName, path=os.environ['PATH']):
    dirs = path.split(os.pathsep)
    for dir in dirs:
        if os.path.isfile(os.path.join(dir, fileName)):
            return os.path.join(dir, fileName)
        if sys.platform in ('cygwin', 'win32'):
            if os.path.isfile(os.path.join(dir, fileName + ".exe")):
                return os.path.join(dir, fileName + ".exe")
    return None


CONSOLE_LOG_LEVEL = logging.INFO
FILE_LOG_LEVEL    = logging.INFO

RUN_TEST = None
LOAD_TEST = None

SERVER_HTTP_PORT = 4444
PLATFORM         = sys.platform
WINDMILL_PATH    = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))
JS_PATH          = os.path.join(WINDMILL_PATH, 'html')
SAVES_PATH       = None
EXTENSIONS_DIR   = None
DISABLE_JS_COMPRESS      = False

TEST_URL  = 'http://tutorial.getwindmill.com/'

FORWARDING_TEST_URL = None

USECODE             = False
EXIT_ON_DONE        = False
CONTINUE_ON_FAILURE = False
ENABLE_PDB          = False
BROWSER_DEBUGGING   = False
START_FIREFOX       = False
START_IE            = False
START_SAFARI        = False
START_CHROME        = False

JAVASCRIPT_TEST_DIR = None
JAVASCRIPT_TEST_FILTER = None
JAVASCRIPT_TEST_PHASE = None
SCRIPT_APPEND_ONLY = False

# Browser prefs
# MOZILLA_COMMAND = None
INSTALL_FIREBUG = None
SAFARI_BINARY   = None
SAFARI_COMMAND  = None

# Mozilla prefs
# MOZILLA_CREATE_NEW_PROFILE     = True
# 
# MOZILLA_PROFILE_PATH = tempfile.mkdtemp(suffix='.windmill')

if PLATFORM == 'darwin':
    NETWORK_INTERFACE_NAME = None
    # firefoxApp = os.path.join('Applications', 'Firefox.app')
    # firefoxDir = os.path.join(os.path.expanduser('~/'), firefoxApp)
    # 
    # if not os.path.isdir(firefoxDir):
    #     firefoxDir = os.path.join('/', firefoxApp)
    # 
    # MOZILLA_DEFAULT_PROFILE = os.path.join(firefoxDir, 'Contents', 'MacOS', 'defaults', 'profile')
    # MOZILLA_BINARY          = os.path.join(firefoxDir, 'Contents', 'MacOS', 'firefox-bin')
    SAFARI_BINARY           = '/Applications/Safari.app/Contents/MacOS/Safari'
    CHROME_BINARY           = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    
    import distutils.version, commands
    OS_VERSION = distutils.version.StrictVersion(commands.getoutput('sw_vers -productVersion'))
    leopard = distutils.version.StrictVersion('10.5')
    # TODO: Consider using "/usr/bin/env networksetup"
    if OS_VERSION >= leopard:
        NETWORKSETUP_BINARY = '/usr/sbin/networksetup'
    else:
        networksetup_base = '/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support/'
        if os.path.isfile(os.path.join(networksetup_base, 'networksetup')):
            NETWORKSETUP_BINARY = os.path.join(networksetup_base, 'networksetup')
        elif os.path.isfile(os.path.join(networksetup_base, 'networksetup-panther')):
            NETWORKSETUP_BINARY = os.path.join(networksetup_base, 'networksetup-panther')

elif PLATFORM == 'linux2':
    #Get Chrome bin for linux
    chromebin = findInPath('google-chrome')
    if chromebin and os.path.isfile(chromebin):
        CHROME_BINARY=chromebin
#     firefoxBin = findInPath('firefox')
# 
#     if firefoxBin is not None and os.path.isfile(firefoxBin):
#         MOZILLA_BINARY = firefoxBin
#     
#     for path in ('/usr/lib/iceweasel/defaults/profile',
#                  '/usr/share/firefox/defaults/profile',
#                  '/usr/lib/mozilla-firefox/defaults/profile',):
#         if os.path.isdir(path):
#             MOZILLA_DEFAULT_PROFILE = path

elif PLATFORM in ('cygwin', 'win32'):
    if sys.platform == 'cygwin':
        program_files = os.environ['PROGRAMFILES']
    else:
        program_files = os.environ['ProgramFiles']
    IE_BINARY  = os.path.join(program_files, 'Internet Explorer', 'iexplore.exe')
    
    if os.path.isfile(os.path.join(program_files, 'Safari', 'Safari.exe')):
        SAFARI_BINARY = os.path.join(program_files, 'Safari', 'Safari.exe')
        
    if os.path.isfile(os.path.join(os.environ['USERPROFILE'], 'Local Settings', 'Application Data', 'Google', 'Chrome', 'Application', 'chrome.exe')):
        CHROME_BINARY = os.path.join(os.environ['USERPROFILE'], 'Local Settings', 'Application Data', 'Google', 'Chrome', 'Application', 'chrome.exe')
    
    # firefoxBin = findInPath('firefox')
    # 
    # if firefoxBin is None:
    #     try:
    #         firefoxBin = os.path.join(os.environ['ProgramFiles'], 'Mozilla Firefox', 'firefox.exe')
    #     except:
    #         firefoxBin = None
    # 
    # if firefoxBin is not None and os.path.isfile(firefoxBin):
    #     firefoxDir = os.path.dirname(firefoxBin)
    # 
    #     MOZILLA_BINARY          = firefoxBin
    #     MOZILLA_DEFAULT_PROFILE = os.path.join(firefoxDir, 'defaults', 'profile')


if __name__ == '__main__':
    if '--test' in sys.argv:
        print 'running on           ', PLATFORM
        print 'we are at            ', WINDMILL_PATH
        print 'our JS is at         ', JS_PATH
        print 'firefox is at        ', MOZILLA_BINARY
        print 'default profile is at', MOZILLA_DEFAULT_PROFILE

