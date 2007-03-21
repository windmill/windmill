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

import logging, os, sys

PLATFORM = sys.platform

TEST_URL = 'http://www.google.com'

SERVER_HTTP_PORT = 4444

CONSOLE_LOG_LEVEL = logging.INFO
FILE_LOG_LEVEL = logging.INFO

JS_PATH = os.path.dirname(sys.modules['windmill'].__file__)+os.path.sep+'js'

TEST_FILE = None
TEST_DIR = None

# Browser prefs
if sys.platform == 'darwin':
    MOZILLA_PROFILE_PATH = "/tmp/mozilla-profile"
    MOZILLA_CREATE_NEW_PROFILE = True
    if os.path.isdir(os.path.expanduser('~/Applications/Firefox.app/')):
        MOZILLA_DEFAUlT_PROFILE = os.path.expanduser('~/Applications/Firefox.app/Contents/MacOS/defaults/profile/')
        MOZILLA_BINARY = os.path.expanduser('~/Applications/Firefox.app/Contents/MacOS/firefox-bin')  
    elif os.path.isdir(os.path.expanduser('~/Applications/Firefox.app/')):
        MOZILLA_DEFAUlT_PROFILE = '/Applications/Firefox.app/Contents/MacOS/defaults/profile/'
        MOZILLA_BINARY = '/Applications/Firefox.app/Contents/MacOS/firefox-bin'


