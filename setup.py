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
import sys

desc = """Windmill is a tool for testing of all functional web testing."""
summ = """Windmill is a web testing framework intended for complete automation of user interface testing, with strong test debugging capabilities."""

PACKAGE_NAME = "windmill"
PACKAGE_VERSION = "0.1.1"

# == Build Section == Handles .app with py2app, .exe with py2exe, and unix binary with scripts option
# mainscript = ['windmill/bin/windmill-admin.py']
# data_files = []
# 
# if sys.platform == 'darwin':
#     extra_options = dict(setup_requires=['py2app'],
#                          app=[mainscript],
#                          # Cross-platform applications generally expect sys.argv to
#                          # be used for opening files.
#                          options=dict(py2app=dict(argv_emulation=True)),
#                          )
# elif sys.platform == 'win32':
#     extra_options = dict(setup_requires=['py2exe'],
#                          app=[mainscript],
#                          )
# else:
#     extra_options = dict(# Normally unix-like platforms will use "setup.py install"
#                          # and install the main script as such
#                          scripts=[mainscript],
#                          )

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description=desc,
      summary=summ,
      author='Open Source Applications Foundation',
      author_email='tools-dev@osafoundation.org',
      url='http://windmill.osafoundation.org/',
      license='http://www.apache.org/licenses/LICENSE-2.0',
      packages=['windmill'],
      platforms =['Any'],
      install_requires = ['cherrypy >= 3.0.1',
                          'simplejson',
                          'dateutil',
                          'wsgi_proxy',
                          'wsgi_jsonrpc',
                          'wsgi_xmlrpc',
                          'wsgi_fileserver',
                          ],                          
      classifiers=['Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Apache Software License',
                   'Operating System :: OS Independent',
                   'Topic :: Software Development :: Libraries :: Python Modules',
                  ],
      # -- build section -- #
      # **extra_options
     )

