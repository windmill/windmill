import commands
import tempfile
import pexpect
import logging
import signal
import killableprocess
import sys, os
import windmill	

logger = logging.getLogger(__name__)

SAFARI_COMMAND = windmill.settings['SAFARI_COMMAND']
SAFARI_BINARY = windmill.settings['SAFARI_BINARY']
TEST_URL = windmill.settings['TEST_URL']			
# 
# Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ ./networksetup -getwebproxy "AirPort"                                          [14:12]
# cp: /Library/Preferences/SystemConfiguration/preferences.plist.old: Permission denied
# Enabled: No
# Server: localhost
# Port: 4444
# Authenticated Proxy Enabled: 0
# Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ ./networksetup -setwebproxystate "AirPort" on                                  [14:12]
# cp: /Library/Preferences/SystemConfiguration/preferences.plist.old: Permission denied
# Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ ./networksetup -getwebproxy "AirPort"                                          [14:13]
# cp: /Library/Preferences/SystemConfiguration/preferences.plist.old: Permission denied
# Enabled: Yes
# Server: localhost
# Port: 4444
# Authenticated Proxy Enabled: 0
# Colossus:/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Support mikeal$ whoami                                                                         [14:13]
# mikeal


			
class Safari(object):
	
	def __init__(self, safari_binary=SAFARI_BINARY, test_url=TEST_URL, command=SAFARI_COMMAND):
		self.safari_binary = safari_binary
		self.test_url = test_url
		self.command = command
	
	def start(self):
	    self.p_handle = killableprocess.Popen(self.command)
	    logger.info(self.command)
	
	def kill(self, kill_signal=None):
	    try:
	        self.p_handle.kill(group=True)
	    except:
	        logger.error('Cannot kill Safari')
	        
	def stop(self):
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