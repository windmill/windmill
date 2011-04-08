#   Copyright (c) 2009 Mikeal Rogers <mikeal.rogers@gmail.com>
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

import commands
import tempfile
import logging
import signal
import subprocess
import sys, os
if not sys.version.startswith('2.4'):
    import urlparse
else:
    # python 2.4
    from windmill.tools import urlparse_25 as urlparse
    
import windmill    

logger = logging.getLogger(__name__)

import safari
    
class Chrome(safari.Safari):
    
    def __init__(self):
        self.chrome_binary = windmill.settings['CHROME_BINARY']
        self.test_url = windmill.settings['TEST_URL']
    
    def unset_proxy_mac(self):
        commands.getoutput(' '.join([self.netsetup_binary, '-setwebproxystate', '"'+self.interface_name+'"', 'off']))
    
    def get_chrome_command(self):
        tmp_profile = tempfile.mkdtemp(suffix='.mozrunner')
        
        chrome_options = ["--user-data-dir="+tmp_profile,'--temp-profile', '--disable-popup-blocking', '--no-first-run', '--proxy-server='+'127.0.0.1:'+str(windmill.settings['SERVER_HTTP_PORT']), '--homepage', self.test_url+'/windmill-serv/start.html']
        return [self.chrome_binary]+chrome_options
            
    def start(self):
        """Start Chrome"""
        
        # Workaround for bug in nose
        if hasattr(sys.stdout, 'fileno'):
            kwargs = {'stdout':sys.stdout ,'stderr':sys.stderr, 'stdin':sys.stdin}
        else:
            kwargs = {'stdout':sys.__stdout__ ,'stderr':sys.__stderr__, 'stdin':sys.stdin}
        
        command = self.get_chrome_command()
        self.p_handle = subprocess.Popen(command, **kwargs)
        logger.info(command)

    def kill(self, kill_signal=None):
        """Stop Chrome"""
        if sys.version < '2.6':
            raise Exception("Kill doesn't work for Chrome on Python version pre-2.6")
        try:
            self.p_handle.kill()
        except:
            logger.exception('Cannot kill Chrome')