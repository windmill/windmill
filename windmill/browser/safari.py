import commands
import tempfile
import logging
import signal
import killableprocess, commands
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
    interface = [ s for s in commands.getoutput('netstat -nr').splitlines() if ( 
                  s.startswith('default') ) 
                 ][0].split()[-1] # split lines of the command, find default, last value in line is interface
    
    interfaces = commands.getoutput(windmill.settings['NETWORKSETUP_BINARY']+' -listnetworkserviceorder').split('\n\n')
    for line in interfaces:
        if not line.startswith('(') and line.find('(1)') is not -1:
            line = '(1)'+line.split('(1)')[-1]
        if line.find('Device: '+interface) is not -1:
            interface_name = ' '.join(line.splitlines()[0].split()[1:])
    
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
	    print self.safari_binary, redirection_page
	    self.p_handle = killableprocess.runCommand([self.safari_binary, redirection_page])
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
	        
# def ipfw_configure_global_proxy():
# 
#   if commands.getoutput('whoami') == 'root':
#       assert commands.getoutput('ipfw add 00017 allow ip from any 32000-34000 to any 80')==\
#                                 '00017 allow ip from any 32000-34000 to any dst-port 80'
#       assert commands.getoutput('ipfw add 00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80')==\
#                                 '00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
#       print 'is root'
#   else:
#       if SUDO_PASS is not None:
#           cmd =  'echo "spawn sudo ipfw add 00017 allow ip from any 32000-34000 to any 80 \n\rexpect \"Password:\" \n\rsend \"%s\" " | expect' % SUDO_PASS
#           commands.getoutput(cmd)
#           cmd = 'sudo ipfw add 00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
#           assert commands.getoutput(cmd) == '00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
# 
# def ipfw_remove_transparent_proxy():
#   
#   if commands.getoutput('whoami') == 'root':
#       assert commands.getoutput('ipfw add 00017 allow ip from any 32000-34000 to any 80')==\
#                                 '00017 allow ip from any 32000-34000 to any dst-port 80'
#       assert commands.getoutput('ipfw add 00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80')==\
#                                 '00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
#       print 'is root'
#   else:
#       if SUDO_PASS is not None:
#           cmd =  'echo "spawn sudo ipfw delete 00017 \n\rexpect \"Password:\" \n\rsend \"%s\" " | expect' % SUDO_PASS
#           commands.getoutput(cmd)
#           cmd = 'sudo ipfw delete'
#           assert commands.getoutput(cmd) == ''