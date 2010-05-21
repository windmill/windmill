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
#  Domen Kozar <domen@dev.si>
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
import tempfile
import subprocess
import commands
import shutil
import tempfile
import zipfile
from time import sleep
try:
    from xml.etree import ElementTree
except ImportError:
    from elementtree import ElementTree

from distutils import dir_util
copytree = dir_util.copy_tree

from windmill.dep import json

def set_preferences(profile, prefs, enable_default_prefs=True):
    """Set all the preferences from dict in the profile's prefs.py"""
    from windmill.dep import mozrunner
    prefs_file = os.path.join(profile, 'user.js')
    f = open(prefs_file, 'w+')
    f.write('\n#MozRunner Prefs Start\n')
    
    if enable_default_prefs and hasattr(mozrunner, 'settings'):
        default_prefs = mozrunner.settings.get('MOZILLA_DEFAULT_PREFS')
        pref_lines = ['user_pref(%s, %s);' % 
                      (json.dumps(k), json.dumps(v) ) for k, v in default_prefs.items()]
        f.write('#MozRunner Default Prefs\n')
        for line in pref_lines:
            f.write(line+'\n')
    
    pref_lines = ['user_pref(%s, %s);' % 
                  (json.dumps(k), json.dumps(v) ) for k, v in prefs.items()]
    f.write('#MozRunner Preferences\n')
    for line in pref_lines:
        f.write(line+'\n')

    f.write('#MozRunner Prefs End\n')
    f.flush() ; f.close()

def clean_prefs_file(prefs_file):
    """Removed the preferences added by mozrunner from prefs.py in the given prefs_file."""
    lines = open(prefs_file, 'r').read().splitlines()
    s = lines.index('#MozRunner Prefs Star') ; e = lines.index('#MozRunner Prefs End')
    cleaned_prefs = '\n'.join(lines[:s] + lines[e:])
    f = open(prefs_file, 'w') ; f.write(cleaned_prefs) ; f.flush() ; f.close()

def create_tmp_profile(settings):
    """Create a new profile in tmp from default mozilla profile."""
    default_profile = settings['MOZILLA_DEFAULT_PROFILE']
    tmp_profile = tempfile.mkdtemp(suffix='.mozrunner')
    
    if sys.platform == 'linux2':
        try:
            login = os.getlogin()
        except OSError:
            login = pwd.getpwuid(os.geteuid())[0]
        output = commands.getoutput('chown -R %s:%s %s' % (login, login, tmp_profile))
        if output != '':
            print output
                                 
    if os.path.exists(tmp_profile) is True:
        shutil.rmtree(tmp_profile)

    copytree(default_profile, tmp_profile, preserve_symlinks=1)
    settings['MOZILLA_PROFILE'] = tmp_profile
    
# ./firefox-bin -no-remote -profile "/Users/mikeal/Library/Application Support/windmill/firefox.profile" -install-global-extension /Users/mikeal/Desktop/jssh-firefox-3.x.xpi    

def install_plugin(path_to_plugin, profile_path):
    """Install a given extracted plugin in to the given profile_path."""
    tree = ElementTree.ElementTree(file=os.path.join(path_to_plugin, 'install.rdf'))
    #description_element = tree.find('.//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description/')
    
    about = [e for e in tree.findall('.//{http://www.w3.org/1999/02/22-rdf-syntax-ns#}Description') if 
        e.get('{http://www.w3.org/1999/02/22-rdf-syntax-ns#}about') == 'urn:mozilla:install-manifest']
    if len(about) is 0:
        plugin_element = tree.find('.//{http://www.mozilla.org/2004/em-rdf#}id')
        plugin_id = plugin_element.text
    else:
        plugin_id = about[0].get('{http://www.mozilla.org/2004/em-rdf#}id')
        
    plugin_path = os.path.join(profile_path, 'extensions', plugin_id)
    copytree(path_to_plugin, plugin_path, preserve_symlinks=1)
    
def install_plugins(settings, runner_class):
    """Install all plugins defined in settings to the profile defined in settings. 
    
    Uses the runner_class to start and stop the browser after plugins are installed to run through any plugin initialization code."""
    binary = settings['MOZILLA_BINARY']
    profile = settings['MOZILLA_PROFILE']
    
    for plugin_path in settings['MOZILLA_PLUGINS']:
        if plugin_path.endswith('.xpi'):
            tmpdir = tempfile.mkdtemp(suffix=".mozrunner_plugins")
            compressed_file = zipfile.ZipFile(plugin_path, "r")
            for name in compressed_file.namelist():
                pardir = os.path.join(tmpdir, os.path.dirname(name))
                if not os.path.exists(pardir):
                    os.makedirs(pardir)

                if not name.endswith('/'):
                    data = compressed_file.read(name)
                    f = open(os.path.join(tmpdir, name), 'w')
                    f.write(data) ; f.close()
                    
            install_plugin(tmpdir, profile)
        else:
            install_plugin(plugin_path, profile)
        
    # moz = runner_class(binary, profile)
    # moz.start()
    # sleep(3.5)
    # moz.stop()
    

