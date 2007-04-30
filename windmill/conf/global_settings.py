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

import logging, os, sys, tempfile, shutil

PLATFORM = sys.platform

TEST_URL = 'http://www.google.com'

SERVER_HTTP_PORT = 4444

CONSOLE_LOG_LEVEL = logging.INFO
FILE_LOG_LEVEL = logging.INFO

JS_PATH = os.path.dirname(sys.modules['windmill'].__file__)+os.path.sep+'js'

TEST_FILE = None
TEST_DIR = None
EXIT_ON_DONE = False

START_FIREFOX = False

CONTINUE_ON_FAILURE = False

# Browser prefs

# Mozilla prefs
MOZILLA_PROFILE_PATH = tempfile.mkdtemp()
if MOZILLA_PROFILE_PATH.find('-') is not -1:
    shutil.rmtree(MOZILLA_PROFILE_PATH)
    MOZILLA_PROFILE_PATH = tempfile.mkdtemp()
MOZILLA_CREATE_NEW_PROFILE = True
MOZILLA_REMOVE_PROFILE_ON_EXIT = True

if sys.platform == 'darwin':
    if os.path.isdir(os.path.expanduser('~/Applications/Firefox.app/')):
        MOZILLA_DEFAULT_PROFILE = os.path.expanduser('~/Applications/Firefox.app/Contents/MacOS/defaults/profile/')
        MOZILLA_BINARY = os.path.expanduser('~/Applications/Firefox.app/Contents/MacOS/firefox-bin')  
    elif os.path.isdir('/Applications/Firefox.app/'):
        MOZILLA_DEFAULT_PROFILE = '/Applications/Firefox.app/Contents/MacOS/defaults/profile/'
        MOZILLA_BINARY = '/Applications/Firefox.app/Contents/MacOS/firefox-bin'
        
elif sys.platform == 'linux2':
    if os.path.isfile('/usr/bin/firefox'):
        MOZILLA_BINARY = '/usr/bin/firefox'
    
    if os.path.isdir('/usr/share/firefox/defaults/profile'):
        MOZILLA_DEFAULT_PROFILE = '/usr/share/firefox/defaults/profile'

elif sys.platform == 'cygwin':
    if os.path.isfile('/cygdrive/c/Program Files/Mozilla Firefox/firefox.exe'):
        MOZILLA_BINARY = '/cygdrive/c/Program\\ Files/Mozilla\\ Firefox/firefox.exe'
        
    if os.path.isdir('/cygdrive/c/Program Files/Mozilla Firefox/defaults/profile'):
        MOZILLA_DEFAULT_PROFILE = '/cygdrive/c/Program Files/Mozilla Firefox/defaults/profile'

elif sys.platform == 'win32':
    MOZILLA_BINARY = "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
    MOZILLA_DEFAULT_PROFILE = "C:\Program Files\Mozilla Firefox\defaults\profile"
    IE_BINARY = "C:\\Program Files\\Internet Explorer\\iexpore.exe"
