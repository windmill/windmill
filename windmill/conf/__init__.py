#   Copyright (c) 2006-2007 Open Source Applications Foundation
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

import global_settings

def configure_settings(local_settings=object(), windmill_settings={}):
    """Override global settings with any locals and configure the windmill_settings dict."""
    for setting in dir(global_settings):
        if not setting.startswith('__'):
            windmill_settings[setting] = getattr(global_settings, setting)
    for setting in dir(local_settings):
        if not setting.startswith('__'):
            windmill_settings[setting] = getattr(local_settings, setting)
            
    import windmill
    windmill.settings = windmill_settings  
    return windmill_settings