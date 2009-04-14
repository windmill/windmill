#!/usr/bin/env python
#   Copyright (c) 2007 Mikeal Rogers
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

import subprocess, commands
import os

SITE_PACKAGES = None
PYTHON_BIN_DIR = None
SETUP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
APP_NAME = 'windmill'

rolled_release_version = False

def remove_old():
    commands.getoutput('cd %s && rm -rf %s*' % (SITE_PACKAGES, APP_NAME))
    commands.getoutput('cd %s && rm -rf dist build' % SETUP_DIR)
    new_easy_install = '\n'.join( 
        [ l for l in open(os.path.join(SITE_PACKAGES, 'easy-install.pth'), 'r').read().splitlines() if (
          l.find(APP_NAME) is -1 ) 
         ] )
    f = open(os.path.join(SITE_PACKAGES, 'easy-install.pth'), 'w')
    f.write(new_easy_install) ; f.flush() ; f.close()
    commands.getoutput('cd %s && rm -rf windmill*' % PYTHON_BIN_DIR)
    
def build():
    outs = commands.getoutput('svn status %s' % SETUP_DIR)
    assert outs == ''
    roll_version(is_release=True)
    outs = commands.getoutput('cd %s && python setup.py bdist_egg' % SETUP_DIR)
    assert outs.find('creating \'dist/%s-' % APP_NAME) is not -1
    
def test_install():
    outs = commands.getoutput('cd %s && easy_install *' % os.path.join(SETUP_DIR, 'dist'))
    print outs
    assert [ l for l in outs.splitlines() if l.find('Installed') is not -1 and l.find(APP_NAME) is not -1]
    outs = commands.getoutput('cd %s && functest browser=safari' % os.path.join(SETUP_DIR, 'test'))
    print outs
    assert outs.find('Failed: 0') is not -1
    
def upload_new_version():
    assert not subprocess.call(['cd', SETUP_DIR, '&&', 'rm', '-rf', 'dist', 'build'])
    outs = commands.getoutput('cd %s && python setup.py bdist_egg sdist upload' % SETUP_DIR)
    print outs
    assert outs.find('Server response (200): OK') is not -1
    
def roll_version(is_release=None, roll_back=False):
    assert is_release is not None
    setup_file = open(os.path.join(SETUP_DIR, 'setup.py'), 'r').read()
    version_line = [ l for l in setup_file.splitlines() if (l.startswith('PACKAGE_VERSION =') )][0]
    if version_line.find('"') is not -1:
        string_char = '"'
    elif version_line.find("'") is not -1:
        string_char = "'"

    version = version_line.split(string_char)[1].replace(string_char, '')

    if is_release:
        new_version = version.replace('pre', '')
    else:
        version_split = version.split('.')

        iteration = int(version_split.pop(-1))
        if not roll_back:
            iteration += 1
        else:
            iteration -= 1
        version_split.append(str(iteration))
        new_version = '.'.join(version_split)+'pre'
    
    f = open(os.path.join(SETUP_DIR, 'setup.py'), 'w')
    f.write(setup_file.replace(version, new_version))
    f.flush()
    f.close()
    print "finished rolling verison to %s" % new_version
    
def run_setup_develop():
    commands.getoutput('cd %s && rm -rf dist build' % SETUP_DIR)
    assert not subprocess.call(['cd', SETUP_DIR, '&&', 'rm', '-rf', 'dist', 'build'])
    outs = commands.getoutput('cd %s && python setup.py develop' % SETUP_DIR)
    print outs
    assert [ l for l in outs.splitlines() if l.find('Installed') is not -1 and l.find(APP_NAME) is not -1]
    
def main():
    passed = False
    remove_old()
    try:
        print "building...."
        build()
        print "testing install...."
        test_install()
        print "uploading to cheeseshop...."
        upload_new_version()
        print "rolling version to next...."
        roll_version(is_release=False)
        passed = True
    except:
        print 'exception'
        passed = False
    finally:
        remove_old()
        if rolled_release_version:
            roll_version(is_release=False, roll_back=True)
        run_setup_develop()
    if passed is True:
        print "DON'T FORGET :: svn commit"
    
if __name__ == "__main__":
    main()
    


    
