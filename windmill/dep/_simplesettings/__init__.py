# Copyright (c) 2007 Open Source Applications Foundation
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

import sys, os, imp
import traceback

def import_file(filename):
    path = os.path.abspath(os.path.expanduser(filename))
    sys.path.insert(0, os.path.dirname(path))
    name = os.path.split(path)[-1].split('.')[0]
    filename, pathname, description = imp.find_module(name, [os.path.dirname(path)])
    module = imp.load_module(name, filename, pathname, description)
    sys.path.pop(0)
    return module

def initialize_settings(default_module, attaching_module=None, local_env_variable=None):
    """
    Initialize the settings from default_module.
    Attaches settings dictionary to main_module. 
    If a string is sent as default_module it's interpreted as a file path to import.
    Override any settings from default_module with the settings in the python file specified in 
    local_env_variable when specified.
    """
    # # If a main module is not defined assume the module initialize_settings is called from is the main module
    # if main_module is None:
    #     main_module = sys.modules[traceback.extract_stack()[1][2]]
    if type(default_module) is str:
        default_module = import_file(default_module)
    
    settings = {}
    for key, value in [ ( name, getattr(default_module, name) ) 
                        for name in dir(default_module) if not name.startswith('_')]:
        settings[key] = value
        
    if local_env_variable is not None and os.environ.has_key(local_env_variable):
        local_module = import_file(os.environ[local_env_variable])
        for key, value in [ ( name, getattr(local_module, name) ) 
                            for name in dir(local_module) if not name.startswith('_')]:
            settings[key] = value
    
    if attaching_module is not None:
        attaching_module.settings = settings
    return settings
    
