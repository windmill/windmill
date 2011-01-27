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

import windmill
import exceptions
import os, sys, shutil, time, signal
import killableprocess
import logging

if sys.platform == "win32":
    import _winreg as wreg
if sys.platform == "cygwin":
    import cygwinreg as wreg

logger = logging.getLogger(__name__)

class InternetExplorer(object):
    
    
    registry_modifications = {'MigrateProxy': {'type': wreg.REG_DWORD, 'new_value':1},
                              'ProxyEnable':  {'type': wreg.REG_DWORD, 'new_value':1},
                              'ProxyHttp1.1': {'type': wreg.REG_DWORD, 'new_value':1},
                              'ProxyServer':  {'type': wreg.REG_SZ}}
    
    def __init__(self):
        
        self.proxy_port = windmill.settings['SERVER_HTTP_PORT']
        self.test_url = windmill.get_test_url(windmill.settings['TEST_URL']) 
        self.registry_modifications['ProxyServer']['new_value'] = "http=127.0.0.1:%s" % self.proxy_port
        if windmill.has_ssl:
            self.registry_modifications['ProxyServer']['new_value'] += ';https=127.0.0.1:%s' % self.proxy_port
        self.reg = wreg.OpenKey(wreg.HKEY_CURRENT_USER, 
                                "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", 0, wreg.KEY_ALL_ACCESS)
                                                    
        for key, value in self.registry_modifications.items():
            try:
                result = wreg.QueryValueEx(self.reg, key)
                self.registry_modifications[key]['previous_value'] = result[0]
            except exceptions.WindowsError:
                self.registry_modifications[key]['previous_value'] = None
        self.ie_binary = windmill.settings['IE_BINARY']
        self.cmd = [self.ie_binary, '-private', self.test_url]
        
    
    def set_proxy(self):
        for key, value in self.registry_modifications.items():
            wreg.SetValueEx(self.reg, key, 0, value['type'], value['new_value'])
            
    def unset_proxy(self):
        for key, value in self.registry_modifications.items():
            if value['previous_value'] is not None:
                wreg.SetValueEx(self.reg, key, 0, value['type'], value['previous_value'])
            else:
                wreg.DeleteValue(self.reg, key)
    
    def start(self):
        """Start IE"""
        self.set_proxy()
            
        # allow_reg = wreg.OpenKey(wreg.HKEY_CURRENT_USER, 
        #                          "Software\\Microsoft\\Internet Explorer\\New Windows\\Allow", 0, wreg.KEY_ALL_ACCESS)
        # 
        # wreg.SetValueEx(allow_reg, urlparse(windmill.settings['TEST_URL']).hostname,
        #                 0, wreg.REG_BINARY, None)
        #Workaround for but in nose
        if hasattr(sys.stdout, 'fileno'):
            kwargs = {'stdout':sys.stdout ,'stderr':sys.stderr, 'stdin':sys.stdin}
        else:
            kwargs = {'stdout':sys.__stdout__ ,'stderr':sys.__stderr__, 'stdin':sys.stdin}
        
        self.p_handle = killableprocess.Popen(self.cmd, **kwargs)
        
    def stop(self):
        """Stop IE"""
        self.unset_proxy()
        
        try:
            self.p_handle.kill(group=True)
        except:
            logger.error('Cannot kill Internet Explorer')
                
    def is_alive(self):

        if self.p_handle.poll() is None:
            return False

        try:
            self.p_handle.kill(group=True)
            return True
        except exceptions.OSError:
            return False
