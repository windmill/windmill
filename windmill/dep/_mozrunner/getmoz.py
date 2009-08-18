# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Mozilla Corporation Code.
#
# The Initial Developer of the Original Code is
# Mikeal Rogers.
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

# This is still very much IN DEVELOPMENT, don't plan on any of this working.

build_url_map = {
    'mozilla-central-win32' :
    "/pub/mozilla.org/firefox/tinderbox-builds/mozilla-central-win32/firefox-4.0a1pre.en-US.win32.zip",
    'mozilla-central-linux':
    "/pub/mozilla.org/firefox/tinderbox-builds/mozilla-central-linux/firefox-4.0a1pre.en-US.linux-i686.tar.bz2",
    'mozilla-central-macosx':
    "/pub/mozilla.org/firefox/tinderbox-builds/mozilla-central-macosx/firefox-4.0a1pre.en-US.mac.dmg",
    'firefox-trunk-win32':
    "/pub/mozilla.org/firefox/tinderbox-builds/FX-WIN32-TBOX-trunk/firefox-3.0pre.en-US.win32.zip",
    'firefox-trunk-linux':
    "/pub/mozilla.org/firefox/tinderbox-builds/fx-linux-tbox-trunk/firefox-3.0pre.en-US.linux-i686.tar.bz2",
    'firefox-trunk-macosx':
    "/pub/mozilla.org/firefox/tinderbox-builds/bm-xserve08-trunk/firefox-3.0pre.en-US.mac.dmg",
    }

import sys, urllib
import termutil

class StdoutReportHook(object):
    def __init__(self, filename):
        self.term = termutil.TerminalController()
        self.progress = termutil.ProgressBar(self.term, 'Downloading '+filename)
        self.percent_complete = 0
    def __call__(self, block, blocksize, target_size):
        if target_size is not -1:
            percent = round( float(block * blocksize) / target_size, 2 )
            #print percent, block, blocksize, target_size
            if percent != self.percent_complete:
                upper_percent = int(str(percent).split('.')[-1])
                #print upper_percent
                self.progress.update(percent, 'Downloading ')
                self.percent_complete = percent
                
def wget(url):
    i = url.rfind('/')
    f = url[i+1:]
    print url, "->", f
    urllib.urlretrieve(url, f, StdoutReportHook(f))

if __name__ == "__main__":
    wget('http://ftp.mozilla.org/pub/mozilla.org/firefox/tinderbox-builds/bm-xserve08-trunk/firefox-3.0pre.en-US.mac.dmg')
