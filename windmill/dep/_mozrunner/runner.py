# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Mozilla Corporation Code.
#
# The Initial Developer of the Original Code is
# Mikeal Rogers.
# Portions created by the Initial Developer are Copyright (C) 2008
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#  Mikeal Rogers <mikeal.rogers@gmail.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

import sys, os
if sys.platform != 'win32':
    import pwd
import commands
import killableprocess
import logging
import signal
from StringIO import StringIO

from time import sleep
import subprocess

logger = logging.getLogger(__name__)

stdout_wrap = StringIO()

def run_command(cmd, env=None):
    """Run the given command in killable process."""
    if hasattr(sys.stdout, "fileno"):
        kwargs = {'stdout':sys.stdout ,'stderr':sys.stderr, 'stdin':sys.stdin}
    else:
        kwargs = {'stdout':sys.__stdout__ ,'stderr':sys.__stderr__, 'stdin':sys.stdin}
    
    if sys.platform != "win32":
        return killableprocess.Popen(cmd, preexec_fn=lambda : os.setpgid(0, 0), env=env, **kwargs)
    else:
        return killableprocess.Popen(cmd, **kwargs)

def get_pids(name, minimun_pid=0):
    """Get all the pids matching name, exclude any pids below minimum_pid."""
    if sys.platform == 'win32':
        import win32pdhutil
        #win32pdhutil.ShowAllProcesses()  #uncomment for testing
        pids = win32pdhutil.FindPerformanceAttributesByName(name)
    
    else:
        get_pids_cmd = ['ps', 'ax']
        h = killableprocess.runCommand(get_pids_cmd, stdout=subprocess.PIPE, universal_newlines=True)
        h.wait()
        data = h.stdout.readlines()
        pids = [int(line.split()[0]) for line in data if line.find(name) is not -1]
        
    matching_pids = [m for m in pids if m > minimun_pid]
    return matching_pids

def kill_process_by_name(name):
    """Find and kill all processes containing a certain name"""
    
    pids = get_pids(name)
    
    if sys.platform == 'win32':
        import win32api, win32con
        for p in pids:
            handle = win32api.OpenProcess(win32con.PROCESS_TERMINATE, 0, p) #get process handle
            win32api.TerminateProcess(handle,0) #kill by handle
            win32api.CloseHandle(handle) #close api

    else:
        for pid in pids:
            try:
                os.kill(pid, signal.SIGTERM)
            except OSError : pass
            sleep(.5)
            if len(get_pids(name)) is not 0:
                try:
                    os.kill(pid, signal.SIGKILL)
                except OSError: pass
                sleep(.5)
                if len(get_pids(name)) is not 0:
                    logger.error('Could not kill process')        

class Mozilla(object):
    """Base class for starting, stopping, and wait() for Mozilla applications."""
    CMD_ARGS = []
    
    def __init__(self, binary, profile, cmd_args=[], aggressively_kill=['crashreporter'], env=None):
        self.set_profile(profile)
        self.set_binary(binary)
        self.set_command(cmd_args + self.CMD_ARGS)
        self.aggressively_kill = aggressively_kill
        self.mozilla_env = env
        
    def set_command(self, cmd_args):
        self.command = [self.binary]
        self.command += ['-profile', self.profile]
        self.command += cmd_args
    
    def set_binary(self, binary):
        self.binary = binary
            
    def set_profile(self, profile):
        """Set the profile path and do any cleanup or platform specific hacks"""
        if sys.platform == 'linux2':
            if sys.platform == 'linux2':
                try:
                    login = os.getlogin()
                except OSError:
                    login = pwd.getpwuid(os.geteuid())[0]
            output = commands.getoutput('chown -R %s:%s %s' % (login, login, profile))
            if output != '':
                print output
            
        self.profile = profile
    
    def start(self):
        self.process_handler = run_command(self.command, self.mozilla_env)

    def wait(self, timeout=None):
        self.process_handler.wait(timeout=timeout)
        
        if sys.platform != 'win32':
            for pid in get_pids(self.name, self.process_handler.pid):    
                self.process_handler.pid = pid
                self.process_handler.wait(timeout=timeout)
         
    def kill(self, kill_signal=signal.SIGTERM):
        """Kill the browser"""
        if sys.platform != 'win32':
            self.process_handler.kill()
            for pid in get_pids(self.name, self.process_handler.pid):    
                self.process_handler.pid = pid
                self.process_handler.kill()
        else:
            try:
                self.process_handler.kill(group=True)
            except Exception, e:
                logger.error('Cannot kill process, '+type(e).__name__+' '+e.message)
                
        for name in self.aggressively_kill:
            kill_process_by_name(name)
    
    def stop(self):
        self.kill()
        
        
class Firefox(Mozilla):
    """Firefox Mozilla runner subclass. Handles set_binary tweaks for Ubuntu linux."""
    name = 'firefox'
    
    def set_binary(self, binary):
        """Set the binary path and do any cleanup or platform specific hacks"""
        binary_content = open(binary, 'r').read()
        if sys.platform == 'linux2' and binary_content[0:3] == '#!/':
            # This block is to fix Ubuntu's stupid shell script that breaks a bunch of options
            binary_content = binary_content.replace('$0', 'firefox')
            binary_content = binary_content.replace('file://', '')
            binary_content = binary_content.replace('MOZILLA_BIN="${progbase}-bin"', 'MOZILLA_BIN="firefox-bin"')
            new_bin_path = self.profile+'/'+'mozrunner-firefox'
            f = open(new_bin_path, 'w')
            f.write(binary_content); f.flush(); f.close()
            subprocess.call(['chmod', '755', new_bin_path])
            self.binary = new_bin_path
        else:
            self.binary = binary
