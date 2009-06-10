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

from nose.plugins import Plugin
from windmill.bin import admin_options

parser_options = {}
for option_class in [getattr(admin_options, x) for x in dir(admin_options) if 
                     hasattr(getattr(admin_options, x), "option_names")]:
    parser_options["wm"+option_class.option_names[1]] = option_class

parser_options.pop('wmsafari')
parser_options.pop('wmfirefox')
parser_options.pop('wmchrome')
parser_options.pop('wmie')
parser_options.pop('wmjsfilter')
parser_options.pop('wmjsphase')
parser_options.pop('wmjsdir')
parser_options.pop('wmusecode')
parser_options.pop('wmexit')
parser_options.pop('wmtest')
parser_options.pop('wmpdb')
parser_options.pop('wmloadtest')
parser_options.pop('wmssl')

import sys
s = sys.__stdout__

from windmill.conf import global_settings

class WindmillNosePlugin(Plugin):
    def options(self, parser, env):
        for name, option_class in parser_options.items():
            parser.add_option('--'+name, dest=name, 
                              help='Windmill option: '+option_class.__doc__, default=None)
        parser.add_option('--wmbrowser', dest="wmbrowser", 
                          help='Windmill option: Browser to start before running windmill tests',
                          default=None)
        parser.add_option('--wmtesturl', dest="wmtesturl", 
                          help='Windmill option: Test url to run windmill tests against',
                          default=None)
        parser.add_option('--wmssl', dest="wmssl", help='Windmill option: Enable SSL support',
                          default=False, action="store_true")
    
    def configure(self, options, conf):
        for name, option_class in parser_options.items():
            if getattr(options, name) is not None:
                option_class()(getattr(options, name))
        if options.wmbrowser is not None:
            setattr(global_settings, 'START_'+options.wmbrowser.upper(), True)
        if options.wmtesturl is not None:
            global_settings.TEST_URL = options.wmtesturl
        if options.wmssl is True:
            admin_options.SSL()(value=True)


