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

import time

import windmill_browser
import windmill_wsgi
from threading import Thread
 
def setup_browser():
    profile = windmill_browser.MozillaProfile()
    browser = windmill_browser.MozillaBrowser(profile)
    browser.open()
    return browser
    
def teardown_browser(browser):
    browser.kill()