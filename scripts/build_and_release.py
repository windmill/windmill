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

def remove_old():
    commands.getoutput('cd %s && rm -rf windmill*' % SITE_PACKAGES)
    commands.getoutput('cd %s && rm -rf dist build' % SETUP_DIR)
    new_easy_install = '\n'.join( 
        [ l for l in open(os.path.join(SITE_PACKAGES, 'easy-install.pth'), 'r').read().splitlines() if (
          l.find('windmill') is -1 ) 
         ] )
    f = open(os.path.join(SITE_PACKAGES, 'easy-install.pth'), 'w')
    f.write(new_easy_install) ; f.flush() ; f.close()
    commands.getoutput('cd %s && rm -rf windmill*' % PYTHON_BIN_DIR)
    
def build():
    outs = commands.getoutput('cd %s && python setup.py bdist_egg' % SETUP_DIR)
    assert outs.find('creating \'dist/windmill-') is not -1
    
def test_install():
    outs = commands.getoutput('cd %s && easy_install *' % os.path.join(SETUP_DIR, 'dist'))
    print outs
    assert [ l for l in outs.splitlines() if l.find('Installed') is not -1 and l.find('windmill') is not -1]
    outs = commands.getoutput('cd %s && functest browser=safari' % os.path.join(SETUP_DIR, 'test'))
    print outs
    assert outs.find('Failed: 0') is not -1
    
def upload_new_version():
    assert not subprocess.call(['cd', SETUP_DIR, '&&', 'rm', '-rf', 'dist', 'build'])
    outs = commands.getoutput('cd %s && python setup.py bdist_egg upload' % SETUP_DIR)
    print outs
    assert outs.find('Server response (200): OK') is not -1
    
def run_setup_develop():
    commands.getoutput('cd %s && rm -rf dist build' % SETUP_DIR)
    assert not subprocess.call(['cd', SETUP_DIR, '&&', 'rm', '-rf', 'dist', 'build'])
    outs = commands.getoutput('cd %s && python setup.py develop' % SETUP_DIR)
    print outs
    assert [ l for l in outs.splitlines() if l.find('Installed') is not -1 and l.find('windmill') is not -1]
    
def main():
    remove_old()
    try:
        build()
        test_install()
        upload_new_version()
    except:
        remove_old()
        run_setup_develop()
    finally:
        remove_old()
        run_setup_develop()
    
if __name__ == "__main__":
    main()
    


    
