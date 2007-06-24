import commands
import tempfile
import pexpect
#import windmill

PORT = 44 #windmill.settings['SERVER_HTTP_PORT']
SUDO_PASS = None

def ipfw_configure_global_proxy():

	if commands.getoutput('whoami') == 'root':
		assert commands.getoutput('ipfw add 00017 allow ip from any 32000-34000 to any 80')==\
								  '00017 allow ip from any 32000-34000 to any dst-port 80'
		assert commands.getoutput('ipfw add 00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80')==\
								  '00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
		print 'is root'
	else:
		if SUDO_PASS is not None:
			cmd =  'echo "spawn sudo ipfw add 00017 allow ip from any 32000-34000 to any 80 \n\rexpect \"Password:\" \n\rsend \"%s\" " | expect' % SUDO_PASS
			commands.getoutput(cmd)
			cmd = 'sudo ipfw add 00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
			assert commands.getoutput(cmd) == '00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'

def ipfw_remove_transparent_proxy():
	
	if commands.getoutput('whoami') == 'root':
		assert commands.getoutput('ipfw add 00017 allow ip from any 32000-34000 to any 80')==\
								  '00017 allow ip from any 32000-34000 to any dst-port 80'
		assert commands.getoutput('ipfw add 00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80')==\
								  '00019 fwd 127.0.0.1,4444 tcp from any to any dst-port 80'
		print 'is root'
	else:
		if SUDO_PASS is not None:
			cmd =  'echo "spawn sudo ipfw delete 00017 \n\rexpect \"Password:\" \n\rsend \"%s\" " | expect' % SUDO_PASS
			commands.getoutput(cmd)
			cmd = 'sudo ipfw delete'
			assert commands.getoutput(cmd) == ''			
			
class Safari(object):
	
	def __init__(self, safari_binary, test_url):
		
		self.safari_binary = safari_binary
		self.test_url = test_url

