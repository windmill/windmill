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

from setuptools import setup
import sys, os, copy

APP = 'windmill/bin/windmill-admin.py'
DATA_FILES = ['windmill']
              
mikeals_build = ['/Users/mikeal/tmp/CherryPy-3.0.1/cherrypy',
                 '/Users/mikeal/tmp/dateutil-1.1/dateutil',
                 '/Users/mikeal/tmp/simplejson-1.7.1/simplejson',
                 '/Users/mikeal/Documents/projects/tools/wsgi_fileserver/trunk/wsgi_fileserver',
                 '/Users/mikeal/Documents/projects/tools/wsgi_jsonrpc/trunk/wsgi_jsonrpc',
                 '/Users/mikeal/Documents/projects/tools/wsgi_proxy/trunk/wsgi_proxy',
                 '/Users/mikeal/Documents/projects/tools/wsgi_xmlrpc/trunk/wsgi_xmlrpc',
                 #'/Library/Frameworks/Python.framework/Versions/Current/lib/python2.5',
                 '/Library/Frameworks/Python.framework/Versions/Current/lib/python2.5/email',
                 '/Library/Frameworks/Python.framework/Versions/2.5/lib/python2.5/lib-dynload/', '/Library/Frameworks/Python.framework/Versions/Current/lib/python2.5/site-packages/wx-2.8-mac-unicode/wx',
                 ]
                
if os.path.isdir('/Users/mikeal'):
    DATA_FILES.extend(mikeals_build)

for filename in copy.copy(DATA_FILES):
    def add_subfilename(sub_filename):
        for sub in os.listdir(sub_filename):
            sub = os.path.join(sub_filename, sub)
            if os.path.isdir(sub) and not sub.startswith('.') and sub not in DATA_FILES:
                add_subfilename(sub)
        DATA_FILES.append(sub_filename)
    add_subfilename(filename)
    
if sys.platform == 'darwin':
    extra_options = dict(setup_requires=['py2app'],
                         app=[APP],
                         # scripts=[APP, 'windmill/bin/json2python.py'],
                         # Cross-platform applications generally expect sys.argv to
                         # be used for opening files.
                         options=dict(py2app=dict(argv_emulation=True, iconfile='wmicon.icns')),
                         )
elif sys.platform == 'win32':
    extra_options = dict(setup_requires=['py2exe'],
                         app=[APP],
                         )
else:
    extra_options = dict(# Normally unix-like platforms will use "setup.py install"
                         # and install the main script as such
                         scripts=[APP],
                         )
              
if 'develop' in sys.argv or 'upload' in sys.argv:
    extra_options['install_requires'] = ['cherrypy >= 3.0.1',
                                            'simplejson',
                                            'dateutil',
                                            # All these wsgi_ libraries used to be part of 
                                            # windmill but are now seperate libraries.
                                            'wsgi_proxy', 
                                            'wsgi_jsonrpc',
                                            'wsgi_xmlrpc',
                                            'wsgi_fileserver',
                                            ]

setup(
    name='windmill',
    data_files=DATA_FILES,
    packages=['windmill'],
    **extra_options)
