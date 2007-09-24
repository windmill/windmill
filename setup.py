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

from setuptools import setup, find_packages
import sys, os

desc = 'Web testing framework intended for complete automation of user interface testing, with strong test debugging capabilities.'

PACKAGE_NAME = "windmill"
PACKAGE_VERSION = "0.2"

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description=desc,
      author='Open Source Applications Foundation',
      author_email='tools-dev@osafoundation.org',
      url='http://windmill.osafoundation.org/',
      license='http://www.apache.org/licenses/LICENSE-2.0',
      packages=find_packages(),
      scripts=[os.path.abspath(os.path.join(os.path.dirname(__file__),'windmill','bin','windmill'))],
      platforms =['Any'],
      install_requires = ['cherrypy >= 3.0.1',
                          'simplejson',
                          'dateutil',
                          # All these wsgi_ libraries used to be part of windmill but are now seperate libraries.
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

