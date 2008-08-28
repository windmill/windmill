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

import sys, os, copy
from setuptools import setup, find_packages

APP = 'windmill/bin/windmill_bin.py'
DATA_FILES = ['windmill']

APP_VERSION = '0.2.0'
APP_DESC    = 'Web testing framework intended for complete automation of user interface testing, with strong test debugging capabilities.'

mikeals_build = ['/Users/mikeal/tmp/CherryPy-3.0.2/cherrypy',
                 '/Users/mikeal/tmp/simplejson-1.7.1/simplejson',
                 '/Users/mikeal/Documents/projects/tools/wsgi_fileserver/trunk/wsgi_fileserver',
                 '/Users/mikeal/Documents/projects/tools/wsgi_jsonrpc/trunk/wsgi_jsonrpc',
                 #'/Users/mikeal/Documents/projects/tools/wsgi_proxy/trunk/wsgi_proxy',
                 '/Users/mikeal/Documents/projects/tools/wsgi_xmlrpc/trunk/wsgi_xmlrpc',
                 #'/Library/Frameworks/Python.framework/Versions/Current/lib/python2.5',
                 '/Library/Frameworks/Python.framework/Versions/Current/lib/python2.5/email',
                 '/Library/Frameworks/Python.framework/Versions/2.5/lib/python2.5/lib-dynload/',                   '/Library/Frameworks/Python.framework/Versions/Current/lib/python2.5/site-packages/wx-2.8-mac-unicode/wx',
                 ]

if os.path.isdir('/Users/mikeal'):
    DATA_FILES.extend(mikeals_build)

for filename in copy.copy(DATA_FILES):
    def add_subfilename(sub_filepath):
        for item in os.listdir(sub_filepath):
            sub = os.path.join(sub_filepath, item)

            if os.path.isdir(sub) and not item.startswith('.') and sub not in DATA_FILES:
                add_subfilename(sub)

        DATA_FILES.append(sub_filepath)

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
    extra_options['install_requires'] = ['CherryPy >= 3.0.2',
                                        'simplejson >= 1.7.1',
                                        'wsgi_jsonrpc >= 0.2.2',
                                        'wsgi_xmlrpc >= 0.2.3',
                                        'wsgi_fileserver >= 0.2.3',
                                        'functest >= 0.7.1',
                                        ],


setup(
    name='windmill',
    version=APP_VERSION,
    description=APP_DESC,
    author='Open Source Applications Foundation',
    author_email='windmill-dev@googlegroups.com',
    url='http://www.getwindmill.com/',
    license='http://www.apache.org/licenses/LICENSE-2.0',
    packages=find_packages(),
    platforms=['Any'],
    classifiers=['Development Status :: 4 - Beta',
                 'Environment :: Library',
                 'Intended Audience :: Developers',
                 'License :: OSI Approved :: Apache Software License',
                 'Operating System :: OS Independent',
                 'Topic :: Software Development :: Libraries :: Python Modules',
                ],
    **extra_options
)
