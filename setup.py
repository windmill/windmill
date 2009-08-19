
#   Copyright (c) 2006-2007 Open Source Applications Foundation
#   Copyright (c) 2008-2009 Mikeal Rogers <mikeal.rogers@gmail.com>
#   Copyright (c) 2009 Domen Kozar <domen@dev.si>
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
PACKAGE_VERSION = "1.2.1b4"

SUMMARY = 'Web testing framework intended for complete automation of user interface testing, with strong test debugging and recording capabilities.'

DESCRIPTION = """Windmill is an Open Source AJAX Web UI Testing framework.  

Windmill implements cross browser testing, in-browser recording and playback, and functionality for fast accurate debugging and test environment integration.

We welcome any and all interest and contribution, as we work diligently at adding new features and keeping up with your bugs.

Thanks for your interest and participation!
"""

dependencies =  []

two_four_dependencies = ['ctypes']

if sys.version.startswith('2.4'):
    dependencies.extend(two_four_dependencies)
    
if sys.platform == 'cygwin':
    dependencies.append('cygwinreg')

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description=SUMMARY,
      long_description=DESCRIPTION,
      author='OSAF, Mikeal Rogers, Adam Christian',
      author_email='windmill-dev@googlegroups.com',
      url='http://www.getwindmill.com/',
      license='http://www.apache.org/licenses/LICENSE-2.0',
      include_package_data = True,
      packages = find_packages(exclude=['test', 'trac-files', 'tutorial', 'test.test_live', 'scripts', 
                                        'flash', 'contrib', 'windmill2']),
      package_data = {'': ['*.js', '*.css', '*.html', '*.txt', '*.xpi',
                           '*.crt', '*.key', '*.csr', 'cert8.db' ],},
      platforms =['Any'],
      install_requires = dependencies,
      entry_points = {
                'nose.plugins': [
                    'windmill = windmill.authoring.nose_plugin:WindmillNosePlugin'
                    ],
                'console_scripts': [
                    'windmill = windmill.bin.windmill_bin:main'
                    ]
                },
      # entry_points="""
      #   [console_scripts]
      #   windmill = windmill.bin.windmill_bin:main
      # """,
      classifiers=['Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Apache Software License',
                   'Operating System :: OS Independent',
                   'Topic :: Software Development :: Libraries :: Python Modules',
                  ],
     )

