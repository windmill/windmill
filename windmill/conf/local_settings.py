#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
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

"""
locateSettings(dirname) returns the path were local settings will be stored

loadSettings(dirname, filename) returns the module object of the loaded prefs.py
found in the local settings directory

    Windows     based on APPDATA or USERPROFILE environment values plus
                "Application Data".  If that's not found, fall back
                to the HOMEDRIVE and HOMEPATH environment values.
    OS X        ~/Library/Appliction Support/windmill/
    Linux       ~/.windmill/
"""



import os, sys
import platform
import imp
import glob
import logging
import traceback

logger = logging.getLogger(__name__)


def _dumpException():
    t, v, tb = sys.exc_info()
    return ''.join(traceback.format_exception(t, v, tb))

def locateSettings(dirName='windmill'):
    """
    Locate the platform specific directory where user configuration settings
    should be stored and return it.
    
    If the directory does not exist, then create it before returning.
    
    Unless overridden, the default name of 'windmill' will be used.
    """
    settingsDir = None
    dataDir     = None

    if sys.platform == 'win32':
        if os.environ.has_key('APPDATA'):
            dataDir = os.environ['APPDATA']
        elif os.environ.has_key('USERPROFILE'):
            dataDir = os.environ['USERPROFILE']

            if os.path.isdir(os.path.join(dataDir, 'Application Data')):
                dataDir = os.path.join(dataDir, 'Application Data')

        if dataDir is None or not os.path.isdir(dataDir):
            if os.environ.has_key('HOMEDRIVE') and os.environ.has_key('HOMEPATH'):
                dataDir = '%s%s' % (os.environ['HOMEDRIVE'], os.environ['HOMEPATH'])

        if dataDir is None or not os.path.isdir(dataDir):
            dataDir = os.path.expanduser('~')

        settingsDir = os.path.join(dataDir, dirName)

    elif sys.platform == 'darwin':
        dataDir     = os.path.join(os.path.expanduser('~'), 'Library', 'Application Support')
        settingsDir = os.path.join(dataDir, dirName)

    else:
        dataDir     = os.path.expanduser('~')
        settingsDir = os.path.join(dataDir, '.%s' % dirName)

    if settingsDir is not None and not os.path.isdir(settingsDir):
        try:
            os.makedirs(settingsDir, 0700)
        except:
            logger.error('Unable to create setting directory [%s]' % settingsDir)
            settingsDir = None

    return settingsDir

PREFS_HEADER = """# local windmill preferences file
# warning - this file will be overwritten by windmill
#           so any edits should be done while windmill
#           is not active.

"""

def loadSettings(dirname=None, filename='prefs.py'):
    """
    Load the local settings .py file located in dirname called filename.
    
    If the directory contains no files, then create an empty file.
    """
    settingsDir = dirname
    result      = None

    if settingsDir is None:
        settingsDir = locateSettings()

    if settingsDir is not None:
        prefsFile = os.path.join(settingsDir, filename)

        if not os.path.isfile(prefsFile):
            h = open(prefsFile, 'w')
            h.write(PREFS_HEADER)
            h.close()

        try:
            minfo  = None
            result = None

            try:
                mname  = os.path.splitext(filename)[0]
                minfo  = imp.find_module(mname, [settingsDir])
                result = imp.load_module(mname, *minfo)
            except:
                logger.error('Error loading settings file [%s]' % prefsFile)
                logger.error(_dumpException())
                minfo  = None
                result = None

        finally:
            if minfo is not None:
                minfo[0].close()

    return result

if __name__ == '__main__':
    if '--test' in sys.argv:
        testfile    = 'bear.py'
        settingsDir = locateSettings()

        if settingsDir is None:
            print 'locateSettings() return a value of None'
            sys.exit(1)

        settingsFile = os.path.join(settingsDir, testfile)

        if os.path.isfile(settingsFile):
            print 'test file [%s] already present in [%s]' % (testfile, settingsDir)
        else:
            h = open(settingsFile, 'w')
            h.write('foo="bar"\nbar=2\n')
            h.close()

        settings = loadSettings(settingsDir, testfile)

        print 'foo = bar:', getattr(settings, 'foo', None)
        print 'bar = 2:  ', getattr(settings, 'bar', None)

    