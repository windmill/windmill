#!/usr/bin/env python
#***** BEGIN LICENSE BLOCK *****
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
import win32api, win32pdhutil, win32con
if sys.platform != 'win32':
    import pwd
import commands
from mozrunner import killableprocess
import logging
import signal
import exceptions
from StringIO import StringIO

from time import sleep
import subprocess
from subprocess import Popen, PIPE, call

from datetime import datetime
from datetime import timedelta

logger = logging.getLogger(__name__)

stdout_wrap = StringIO()

def cleanup_ie():
    def remove_files(target_dir):
         for root, dirs, files in os.walk(target_dir):
             for f in files:
                 try:
                     os.unlink(os.path.join(root, f))
                 except OSError:
                     pass
                     
    userpath = 'C:/Documents and Settings/'
    userlist = os.listdir(userpath)
    
    for u in userlist[:]:
         if os.path.isdir(userpath+u):
             pass
         else:
             userlist.remove(u)
    
    #borks for some reason, or is just really slow
    # for username in userlist:
    #       target_dir = userpath+username+'/Local Settings/Temp/'
    #       #print target_dir
    #       remove_files(target_dir)
    
    for username in userlist:
        target_dir = userpath+username+'/Cookies/'
        #print target_dir
        remove_files(target_dir)

def cleanup_safari():
    rm_args = ['rm']
    rm_args.append(os.path.expanduser('~')+'/Library/Cookies/Cookies.plist')
    subprocess.call(rm_args)

def run_command(cmd, env=None):
    """Run the given command in killable process."""
    kwargs = {'stdout':-1 ,'stderr':sys.stderr, 'stdin':sys.stdin}
    
    if sys.platform != "win32":
        return killableprocess.Popen(cmd, preexec_fn=lambda : os.setpgid(0, 0), env=env, **kwargs)
    else:
        return killableprocess.Popen(cmd, **kwargs)


def get_pids(name, minimun_pid=0):
    """Get all the pids matching name, exclude any pids below minimum_pid."""
    if sys.platform == 'win32':
        #win32pdhutil.ShowAllProcesses()  #uncomment for testing
        pids = win32pdhutil.FindPerformanceAttributesByName(name)
    
    else:
        get_pids_cmd = ['ps', 'ax']
        h = killableprocess.runCommand(get_pids_cmd, stdout=subprocess.PIPE, universal_newlines=True)
        h.wait()
        data = h.stdout.readlines()
        pids = [int(line.split()[0]) for line in data if line.find(name) is not -1]
        
    matching_pids = [m for m in pids if m > minimun_pid and m != os.getpid()]
    return matching_pids

def kill_process_by_name(name):
    """Find and kill all processes containing a certain name"""
    
    pids = get_pids(name)
    
    if sys.platform == 'win32':
        for p in pids:
            handle = win32api.OpenProcess(win32con.PROCESS_TERMINATE, 0, p) #get process handle
            win32api.TerminateProcess(handle,0) #kill by handle
            win32api.CloseHandle(handle) #close api

    else:
        for pid in pids:
            os.kill(pid, signal.SIGTERM)
            sleep(.5)
            if len(get_pids(name)) is not 0:
                try:
                    os.kill(pid, signal.SIGKILL)
                except OSError: pass
                sleep(.5)
                if len(get_pids(name)) is not 0:
                    logger.error('Could not kill process')
                    
def main():
    """Command Line main function."""
    args = list(sys.argv)
    args.pop(0)
    
    name = args[0]
    args.append('report=true')
    args.append('exit')
    kill_process_by_name("firefox")
    kill_process_by_name("Firefox")
    kill_process_by_name("Safari")
    kill_process_by_name("iexplore")
    kill_process_by_name('windmill')
    kill_process_by_name('python')

    #Remove tmp
    if 'ie' in args:
        cleanup_ie()
    if 'safari' in args:
        cleanup_safari()
    
    
##    print "Starting "+str(args)
##    p = subprocess.Popen(args, stdout=PIPE, stderr=PIPE)
##    return_code = p.wait()
##    sys.exit(return_code)
    
if __name__ == "__main__":
    main()