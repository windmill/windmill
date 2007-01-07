#   Copyright (c) 2006-2007Open Source Applications Foundation
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

import commands, threading, time

class SeleniumServerWrapper(threading.Thread):
    
    def __init__(self, server_location, server_options={}):
        
        self.server_location = server_location
        self.server_options = server_options
        
        self.setup()
        
        threading.Thread.__init__(self)
    
    def setup(self):
        
        # Create options string
        cmd_options_string = ''
        for option, value in self.server_options.items():
            if option.startswith('-'):
                if value == '':
                    # Account for options with no value like '-debug'
                    cmd_options_string += ' %s' % option
                else:
                    cmd_options_string += ' %s=%s' % (option, value)
            else:
                # Every option begins with '-' so if one it's not there we should add it
                option = '-%s' % option
                if value == '':
                    # Account for options with no value like '-debug'
                    cmd_options_string += ' %s' % option
                else:
                    cmd_options_string += ' %s=%s' % (option, value)
                    
        self.cmd = 'java -jar %s %s' % (self.server_location, cmd_options_string)
        
        # Set self.server_output so that if it can be referenced before self.start() is called
        self.server_output = ''
    
    def run(self):
    
        self.server_output = commands.getstatusoutput(self.cmd)

SELENIUM_SERVER_FAIL = 'Failed to connect to Selenium proxy server'
TIMEOUT = 10
DEFAULT_PORT = 4444

class SeleniumServerController(object):
    
    def __init__(self, server_location, server_options={}):
        
        self.server_thread = SeleniumServerWrapper(server_location, server_options)
        self.server_thread.setup()
        self.server_thread.start()
        
        # We can't move forward until the server is up, and since it's in a thread we need to check it
        import socket
        from datetime import datetime
        
        now = datetime.now()
        
        if server_options.has_key('-port'):
            serverport = server_options['-port']
        else:
            serverport = DEFAULT_PORT
        
        # Check if the socket is open for TIMEOUT
        while 1:        
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                s.connect(('localhost', serverport))
                s.close()
                break
            except:
                x = datetime.now() - now
                if x.seconds > TIMEOUT:
                    raise SELENIUM_SERVER_FAIL
                    break
            
        self.server_output = self.server_thread.server_output
        
    def is_server_thread_active(self):
        
        return self.server_thread.isAlive()
        
    def stop_server(self):
        
        self.server_thread._Thread__stop()