#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
#   Copyright (c) 2009 Canonical Ltd.
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

import os
import local_settings

def _load(globalName='global_settings.py', localSettings=None):
    """
    Helper function to load and return globalSettings and localSettings
    Used to allow the merge routine to be called from a test setup.
    """
    from windmill.conf import global_settings as globalSettings

    if localSettings is not None:
        localPath = os.path.dirname(localSettings)
        localFile = os.path.basename(localSettings)

        localSettings = local_settings.loadSettings(dirname=localPath, filename=localFile)
    else:
        localSettings = local_settings.loadSettings()

    return globalSettings, localSettings

def mergeSettings(windmillSettings, globalSettings, localSettings):
    """
    Merge the global and local settings with the dictionary of windmill defaults.
    
    globalSettings and localSettings can be dictionaries but normally are
    settings modules that have been loaded into memory.
    """

    def _get(item, isDict, key):
        if isDict:
            return item[key]
        else:
            return getattr(item, key)

    globalKeys = {}
    localKeys  = {}

    globalDict = type(globalSettings) is dict
    localDict  = type(localSettings) is dict

    if globalDict:
        keylist = globalSettings.keys()
    else:
        keylist = dir(globalSettings)

    for key in keylist:
        if not key.startswith('__'):
            globalKeys[key.upper()] = key

    if localDict:
        keylist = localSettings.keys()
    else:
        keylist = dir(localSettings)

    for key in keylist:
        if not key.startswith('__'):
            localKeys[key.upper()] = key

    for key in windmillSettings:
        key_upper = key.upper()

        if key_upper in localKeys:
            windmillSettings[key] = _get(localSettings, localDict, localKeys[key_upper])
            del localKeys[key_upper]
        elif key_upper in globalKeys:
            windmillSettings[key] = _get(globalSettings, globalDict, globalKeys[key_upper])
            del globalKeys[key_upper]

    for key_upper in localKeys:
        key = localKeys[key_upper]

        windmillSettings[key] = _get(localSettings, localDict, key)

        if key_upper in globalKeys:
            del globalKeys[key_upper]

    for key_upper in globalKeys:
        key = globalKeys[key_upper]

        windmillSettings[key] = _get(globalSettings, globalDict, key)

def configure_settings(localSettings=None, windmill_settings=None):
    """
    Override global settings with any locals and configure the windmill_settings dict.
    """

    if windmill_settings is None:
        windmill_settings = {}
    globalSettings, localSettings = _load(localSettings=localSettings)

    mergeSettings(windmill_settings, globalSettings, localSettings)

    return windmill_settings


if __name__ == '__main__':
    import sys

    if '--test' in sys.argv:
        ls = { 'localonly': 1,  'all': 1, 'localglobal': 1}
        gs = { 'globalonly': 2, 'all': 2, 'localglobal': 2}
        ws = { 'wsonly': 3,     'all': 3}
        cv = { 'localonly': 1, 'globalonly': 2, 'localglobal': 1, 'all': 2, 'wsonly': 3}

        print 'windmill', ws
        print 'global  ', gs
        print 'local   ', ls

        mergeSettings(ws, gs, ls)

        print 'should be:  ', cv
        print 'actually is:', ws

        for key in ws:
            if key not in cv:
                print 'key %s found in ws but not in cv' % key
            else:
                if ws[key] <> cv[key]:
                    print 'key %s differs: is %d but should be %d' % (key, ws[key], cv[key])

