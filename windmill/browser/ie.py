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
    
    def __init__(self, proxy_port=PROXY_PORT, test_url=DEFAULT_TEST_URL, ie_binary=IE_BINARY):
        
        self.proxy_port = proxy_port
        self.test_url = test_url
        self.reg = wreg.OpenKey(wreg.HKEY_CURRENT_USER, 
                                "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings")
        self.cmd = [ie_binary, self.test_url]
        
    def start(self):
        
        wreg.SetValueEx(self.reg, 'MigrateProxy', 0, wreg.REG_DWORD, 00000001)
        wreg.SetValueEx(self.reg, 'ProxyEnable', 0, wreg.REG_DWORD, 00000001)
        wreg.SetValueEx(self.reg, 'ProxyHttp1.1', 0, wreg.REG_DWORD, 00000000)
        wreg.SetValue(self.reg, "ProxyServer", wreg.REG_SZ, "http://ProxyServername:%s" % self.proxy_port)
        
        self.p_handle = killableprocess.Popen(self.cmd)
        
    def stop(self):
        
        wreg.DeleteKey(self.reg, 'MigrateProxy')
        wreg.DeleteKey(self.reg, 'ProxyEnable')
        wreg.DeleteKey(self.reg, 'ProxyHttp1.1')
        wreg.DeleteKey(self.reg, 'ProxyServer')
        
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
            
            
            
        