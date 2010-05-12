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

import optparse
import os, sys
import shutil
from time import sleep

from windmill.dep import _simplesettings

import global_settings
import runner
import install

settings_env = 'MOZRUNNER_SETTINGS_FILE'

def main():
    """Command Line main function."""
    parser = optparse.OptionParser()
    parser.add_option("-s", "--settings", dest="settings",
                      help="Settings file for mozrunner.", metavar="MOZRUNNER_SETTINGS_FILE")
    parser.add_option("-n", "--new-profile", dest="new_profile", action="store_true",
                      help="Create fresh profile.", metavar="MOZRUNNER_NEW_PROFILE")
    parser.add_option("-b", "--binary", dest="binary",
                      help="Binary path.", metavar=None)
    parser.add_option("-d", "--default-profile", dest="default-profile",
                      help="Default profile path.", metavar=None)
    parser.add_option('-p', "--profile", dest="profile",
                      help="Profile path.", metavar=None)
    parser.add_option('-w', "--plugins", dest="plugins",
                      help="Plugin paths to install.", metavar=None)
    (options, args) = parser.parse_args()
    
    settings_path = getattr(options, 'settings', None)
    if settings_path is not None:
        settings_path = os.path.abspath(os.path.expanduser(settings_path))
        os.environ[settings_env] = settings_path
        
    settings = simplesettings.initialize_settings(global_settings, sys.modules[__name__],     
                                                  local_env_variable=settings_env)
        
    option_overrides = [('new_profile', 'MOZILLA_CREATE_NEW_PROFILE',),
                        ('binary', 'MOZILLA_BINARY',),
                        ('profile', 'MOZILLA_PROFILE',),
                        ('default-profile', 'MOZILLA_DEFAULT_PROFILE',),
                        ]
    
    for opt, override in option_overrides:
        if getattr(options, opt, None) is not None:
            settings[override] = getattr(options, opt) 

    moz = get_moz_from_settings(settings)
    
    # if len(args) is not 0:
    #     objdir = args.pop(0)
    #     
    # 
    moz.start()
    print 'Started:', ' '.join(moz.command)
    try:
        moz.wait()
    except KeyboardInterrupt:
        moz.stop()
    if settings['MOZILLA_CREATE_NEW_PROFILE']:
        shutil.rmtree(settings['MOZILLA_PROFILE'])
    else:
        install.clean_prefs_file(os.path.join(settings['MOZILLA_PROFILE'], 'prefs.js'))
            
    
def get_moz(binary, profile, runner_class=runner.Firefox, cmd_args=[], prefs={}, 
            enable_default_prefs=True, settings=None, create_new_profile=True,
            plugins=None):
    """Get the Mozilla object from options, settings dict overrides kwargs"""
            
    if settings is None:
        settings = simplesettings.initialize_settings(
                                        global_settings, sys.modules[__name__],     
                                        local_env_variable=settings_env,
                                        )
        sys.modules[__name__].settings = settings
    
    binary = os.path.abspath(binary)
    
    # Handle .app case
    if binary.endswith('.app'):
        apppath = binary
        binary = os.path.abspath(os.path.join(apppath, 'Contents', 'MacOS', 'firefox-bin'))
        profile = os.path.abspath(os.path.join(apppath, 'Contents', 'MacOS', 'defaults', 'profile'))
    
    
    if settings.get('MOZILLA_CREATE_NEW_PROFILE', create_new_profile):
        if not settings.has_key('MOZILLA_CREATE_NEW_PROFILE'):
            settings['MOZILLA_CREATE_NEW_PROFILE'] = create_new_profile
        settings['MOZILLA_DEFAULT_PROFILE'] = profile
        if settings['MOZILLA_CREATE_NEW_PROFILE']:
            if settings['MOZILLA_DEFAULT_PROFILE'] is None:
                raise Exception ('No default or local profile has been set.')
            install.create_tmp_profile(settings)
            profile = settings['MOZILLA_PROFILE']
    else:
        settings['MOZILLA_PROFILE'] = profile
        settings['MOZILLA_CREATE_NEW_PROFILE'] = create_new_profile

    if settings.get('MOZILLA_PLUGINS', plugins) is not None:
        if not settings.has_key('MOZILLA_PLUGINS'):
            settings['MOZILLA_PLUGINS'] = plugins
        if settings.has_key('MOZILLA_PLUGINS'):
            install.install_plugins(settings, runner_class)

    install.set_preferences(profile, prefs, enable_default_prefs)    
    
    return runner_class(binary, profile, cmd_args=cmd_args, env=settings.get('MOZILLA_ENV', None))
    
def get_moz_from_settings(settings=None, runner_class=runner.Firefox):
    """Get Mozilla object from a settings dict. If one is not passed a default settings dict is created."""
    if settings is None:
        settings = simplesettings.initialize_settings(
                                        global_settings, sys.modules[__name__],     
                                        local_env_variable=settings_env,
                                        )
        sys.modules[__name__].settings = settings
           
    from windmill.dep import mozrunner
    mozrunner.settings = settings 
        
    return get_moz(settings['MOZILLA_BINARY'], settings['MOZILLA_DEFAULT_PROFILE'],
                   prefs=settings['MOZILLA_PREFERENCES'],
                   runner_class=runner_class,
                   settings=settings,
                   enable_default_prefs=settings.get('MOZILLA_ENABLE_DEFAULT_PREFS', True),         
                   cmd_args=settings['MOZILLA_CMD_ARGS'])
