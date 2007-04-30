import windmill
import exceptions
import os, sys, shutil, time, signal
import killableprocess
import logging

if sys.platform == "win32" or sys.platform == "cygwin":
    import _winreg as wreg

logger = logging.getLogger(__name__)

PROXY_PORT = windmill.settings['SERVER_HTTP_PORT']
DEFAULT_TEST_URL = windmill.settings['TEST_URL']+'/windmill-serv/start.html'
IE_BINARY = windmill.settings['IE_BINARY']

class InternetExplorer(object):
    
    
    registry_modifications = {'MigrateProxy': {'type': wreg.REG_DWORD, 'new_value':1},
                              'ProxyEnable':  {'type': wreg.REG_DWORD, 'new_value':1},
                              'ProxyHttp1.1': {'type': wreg.REG_DWORD, 'new_value':0},
                              'ProxyServer':  {'type': wreg.REG_SZ},
                              }
    
    def __init__(self, proxy_port=PROXY_PORT, test_url=DEFAULT_TEST_URL, ie_binary=IE_BINARY):
        
        self.proxy_port = proxy_port
        self.test_url = test_url
        self.registry_modifications['ProxyServer']['new_value'] = "http://localhost:%s" % self.proxy_port
        self.reg = wreg.OpenKey(wreg.HKEY_CURRENT_USER, 
                                "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings", 0, wreg.KEY_ALL_ACCESS)
                                                    
        for key, value in self.registry_modifications:
            try:
                result = wreg.QueryValueEx(self.reg, key)
                self.registry_modifications['previous_value'] = result[0]
            except exceptions.WindowsError,
                self.registry_modifications['previous_value'] = None
                wreg.CreateKey(self.reg, key)
        
        self.cmd = [ie_binary, self.test_url]
        
    
    
    def start(self):
        
        for key, value in self.registry_modifications:
            wreg.SetValueEx(self.reg, key, 0, value['type'], value['new_value'])
        
        self.p_handle = killableprocess.Popen(self.cmd)
        
    def stop(self):
        
        for key, value in self.registry_modifications:
            if value['previous_value'] is not None:
                wreg.SetValueEx(self.reg, key, 0, value['type'], value['previous_value'])
            else:
                wreg.DeleteKey(self.reg, key)
        
        try:
            self.p_handle.kill(group=True)
        except:
            logger.error('Cannot kill firefox')
                
    def is_alive(self):

        if self.p_handle.poll() is None:
            return False

        try:
            self.p_handle.kill(group=True)
            return True
        except exceptions.OSError:
            return False
            
            
            
        