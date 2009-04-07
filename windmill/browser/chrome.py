import commands
import tempfile
import logging
import signal
import subprocess
import sys, os
import urlparse

import windmill	

logger = logging.getLogger(__name__)

import safari

class Chrome(safari.Safari):
	
	def __init__(self):
	    self.chrome_binary = windmill.settings['CHROME_BINARY']
	    self.test_url = windmill.settings['TEST_URL']
	
    # def create_redirect(self):
    #     self.redirection_page = tempfile.mktemp(suffix='.html')
    #     f = open(self.redirection_page, 'w') 
    #     test_url = windmill.get_test_url(windmill.settings['TEST_URL']) 
    #     f.write( html_redirection.replace('{replace}', test_url) )
    #     f.flush() ; f.close()
	    
    # def set_proxy_mac(self):
    #     """Set local Proxy"""
    #     self.netsetup_binary = windmill.settings['NETWORKSETUP_BINARY']
    #     interface_name = find_default_interface_name()
    #     uri = urlparse.urlparse(self.test_url)
    #     set_proxy_command = ' '.join([ self.netsetup_binary, 
    #                                    '-setwebproxy', 
    #                                    '"'+interface_name+'"', 
    #                                    'localhost', 
    #                                    str(windmill.settings['SERVER_HTTP_PORT'])
    #                                  ])
    #     commands.getoutput(set_proxy_command)
    #     enable_proxy_command = ' '.join([ self.netsetup_binary,
    #                                       '-setwebproxystate',
    #                                       '"'+interface_name+'"',
    #                                       'on'
    #                                     ])
    #     commands.getoutput(enable_proxy_command)      
    #     self.create_redirect()
    #     self.interface_name = interface_name
    # 
    # def unset_proxy_mac(self):
    #     commands.getoutput(' '.join([self.netsetup_binary, '-setwebproxystate', '"'+self.interface_name+'"', 'off']))
	
	def set_proxy_windows(self):
	    import ie
	    self.ie_obj = ie.InternetExplorer()
	    self.ie_obj.set_proxy()
    # 
    # def unset_proxy_windows(self):
    #     self.ie_obj.unset_proxy()
	    
	def start(self):
	    """Start Chrome"""
        # if sys.platform == 'darwin':
        #     self.set_proxy_mac()
	    if sys.platform in ('cygwin', 'win32'):
	        self.set_proxy_windows()
	    
	    kwargs = {'stdout':sys.stdout ,'stderr':sys.stderr, 'stdin':sys.stdin}
	    command = [self.chrome_binary, '--homepage', self.test_url+'/windmill-serv/start.html', '-disable-popup-blocking']
	    self.p_handle = subprocess.Popen(command, **kwargs)
	    logger.info(command)

	def kill(self, kill_signal=None):
	    """Stop Chrome"""
	    if not sys.version.startswith('2.6'):
	        raise Exception("Kill doesn't work for Chrome on Python version pre-2.6")
	    
	    if sys.platform in ('cygwin', 'win32'):
	        self.unset_proxy_windows()
	        
	    try:
	        self.p_handle.kill()
	    except:
	        logger.exception('Cannot kill Chrome')
	        
    # def stop(self):
    #     self.kill(signal.SIGTERM)
    #         
    # def is_alive(self):
    #     if self.p_handle.poll() is None:
    #         return False
    #     return True
	    
