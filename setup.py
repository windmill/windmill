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
import os, sys

PACKAGE_NAME = "windmill"
PACKAGE_VERSION = "1.0"

SUMMARY = 'Web testing framework intended for complete automation of user interface testing, with strong test debugging and recording capabilities.'

DESCRIPTION = """Windmill is an Open Source AJAX Web UI Testing framework.  

Windmill implements cross browser testing, in-browser recording and playback, and functionality for fast accurate debugging and test environment integration.

We welcome any and all interest and contribution, as we work diligently at adding new features and keeping up with your bugs.

Thanks for your interest and participation!
"""

dependencies =  ['CherryPy >= 3.0.2',
                 'wsgi_jsonrpc >= 0.2.2',
                 'wsgi_xmlrpc >= 0.2.3',
                 'wsgi_fileserver >= 0.2.3',
                 'functest >= 0.7.1',
                 'mozrunner <= 1.9.9',
                 'simplesettings',
                 ]

two_five_dependencies = [ 'simplejson >= 1.7.1',
                        ]                

if not sys.version.startswith('2.6'):
    dependencies.extend(two_five_dependencies)

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description=SUMMARY,
      long_description=DESCRIPTION,
      author='OSAF, Mikeal Rogers, Adam Christian',
      author_email='windmill-dev@googlegroups.com',
      url='http://www.getwindmill.com/',
      license='http://www.apache.org/licenses/LICENSE-2.0',
      include_package_data = True,
      packages = find_packages(exclude=['test', 'trac-files', 'tutorial', 'test.test_live', 'scripts']),
      package_data = {'': ['*.js', '*.css', '*.html', '*.txt', '*.xpi' ],},
      platforms =['Any'],
      install_requires = dependencies,
      entry_points="""
        [console_scripts]
        windmill = windmill.bin.windmill_bin:main
      """,
      classifiers=['Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Apache Software License',
                   'Operating System :: OS Independent',
                   'Topic :: Software Development :: Libraries :: Python Modules',
                  ],
     )

