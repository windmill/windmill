import commands
import tempfile
import logging
import signal
import killableprocess
import sys, os
import urlparse

import windmill	

logger = logging.getLogger(__name__)
		
"""
Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ ./networksetup -getwebproxy "AirPort"                                          [14:12]
cp: /Library/Preferences/SystemConfiguration/preferences.plist.old: Permission denied
Enabled: No
Server: localhost
Port: 4444
Authenticated Proxy Enabled: 0
Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ ./networksetup -setwebproxystate "AirPort" on                                  [14:12]
cp: /Library/Preferences/SystemConfiguration/preferences.plist.old: Permission denied
Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ ./networksetup -getwebproxy "AirPort"                                          [14:13]
cp: /Library/Preferences/SystemConfiguration/preferences.plist.old: Permission denied
Enabled: Yes
Server: localhost
Port: 4444
Authenticated Proxy Enabled: 0
Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ whoami                                                                         [14:13]
Usage: networksetup -setwebproxy <networkservice> <domain> <port number> <authenticated> <username> <password>
mikeal
"""

html_redirection = """
<html>
  <head>
    <script type="text/javascript">	
    var i = function(){
    	window.location = "http://{replace}/windmill-serv/start.html";
    }
    </script>
 </head>
  <body onload="i();">	
  </body>
<html>"""


def find_default_interface_name():
    if windmill.settings['NETWORK_INTERFACE_NAME'] is not None:
        return windmill.settings['NETWORK_INTERFACE_NAME']
    target_host = urlparse.urlparse(windmill.settings['TEST_URL']).hostname
    interface_id = commands.getoutput('route get '+target_host).split('interface:')[1].split('\n')[:1][0].replace(' ', '')
    all_inet = commands.getoutput(windmill.settings['NETWORKSETUP_BINARY']+' -listallhardwareports').split('\n\n')
    try:
        interface_name = [ l for l in all_inet if l.find(interface_id) is not -1 ][0].split('\n')[0].split(' ')[-1]
    except IndexError:
        print "ERROR: Cannot figure out interface name, please set NETWORK_INTERFACE_NAME in local settings file"
        from windmill.bin import admin_lib
        admin_lib.teardown(admin_lib.shell_objects_dict)
        sys.exit()
    
    # interfaces = commands.getoutput().split('\n\n')
    # print 'interfaces::\n', '\n'.join(interfaces)
    # for line in interfaces:
    #     if not line.startswith('(') and line.find('(1)') is not -1:
    #         line = '(1)'+line.split('(1)')[-1]
    #     if line.find('Device: '+interface) is not -1:
    #         interface_name = ' '.join(line.splitlines()[0].split()[1:])
    
    return interface_name
            
			
class Safari(object):
	
	def __init__(self):
	    self.netsetup_binary = windmill.settings['NETWORKSETUP_BINARY']
	    self.safari_binary = windmill.settings['SAFARI_BINARY']
	    self.test_url = windmill.settings['TEST_URL']
	    
	def start(self):
	    # Set local Proxy
	    interface_name = find_default_interface_name()
	    uri = urlparse.urlparse(self.test_url)
	    set_proxy_command = ' '.join([ self.netsetup_binary, 
	                                   '-setwebproxy', 
	                                   '"'+interface_name+'"', 
	                                   'localhost', 
	                                   str(windmill.settings['SERVER_HTTP_PORT'])
	                                 ])
	    commands.getoutput(set_proxy_command)
	    enable_proxy_command = ' '.join([ self.netsetup_binary,
	                                      '-setwebproxystate',
	                                      '"'+interface_name+'"',
	                                      'on'
	                                    ])
	    commands.getoutput(enable_proxy_command)	    
	    
	    redirection_page = tempfile.mktemp(suffix='.html')
	    f = open(redirection_page, 'w') 
	    f.write(html_redirection.replace('{replace}', uri.netloc+uri.path))
	    f.flush() ; f.close()
	    kwargs = {'stdout':sys.stdout ,'stderr':sys.stderr, 'stdin':sys.stdin}
	    self.p_handle = killableprocess.runCommand([self.safari_binary, redirection_page], **kwargs)
	    logger.info([self.safari_binary, redirection_page])
	    self.interface_name = interface_name
	
	def kill(self, kill_signal=None):
	    commands.getoutput(' '.join([self.netsetup_binary, '-setwebproxystate', '"'+self.interface_name+'"', 'off']))
	    try:
	        self.p_handle.kill(group=True)
	    except:
	        logger.error('Cannot kill Safari')
	        
	def stop(self):
	    commands.getoutput(' '.join([self.netsetup_binary, '-setwebproxystate', '"'+self.interface_name+'"', 'off']))
	    self.kill(signal.SIGTERM)
	        
	def is_alive(self):
	    if self.p_handle.poll() is None:
	        return False
	    return True
	    
