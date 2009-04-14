from setuptools import setup, find_packages
import os, sys

PACKAGE_NAME = "wxwindmill"
PACKAGE_VERSION = "0.8.1pre"

SUMMARY = 'Web testing framework intended for complete automation of user interface testing, with strong test debugging and recording capabilities.'

DESCRIPTION = """Windmill is an Open Source AJAX Web UI Testing framework that was originally built to automate testing for the Chandler Server Project at OSAF. After spending time with Selenium we realized we had a variety of needs that weren't being fulfilled and built Windmill from the ground up. 

Windmill implements cross browser testing, in-browser recording and playback, and functionality for fast accurate debugging and test environment integration.

We are a relatively young project, but as far as we know we already implement a larger set of a browser testability than Selenium. We welcome any and all interest and contribution, as we work diligently at adding new features and keeping up with your bugs.

Thanks for your interest and participation!
"""

setup(name=PACKAGE_NAME,
      version=PACKAGE_VERSION,
      description=SUMMARY,
      long_description=DESCRIPTION,
      author='OSAF, Mikeal Rogers, Adam Christian, Jacob Robinson',
      author_email='windmill-dev@googlegroups.com',
      url='http://www.getwindmill.com/',
      license='http://www.apache.org/licenses/LICENSE-2.0',
      include_package_data = True,
      packages = find_packages(exclude=['test', 'test.test_live']),
      package_data = {'': ['*.js', '*.css', '*.html', '*.txt', ],},
      platforms =['Any'],
      install_requires = ['windmill'],
      entry_points="""
        [console_scripts]
        wxwindmill = wxwindmill:main
      """,
      classifiers=['Development Status :: 4 - Beta',
                   'Environment :: Console',
                   'Intended Audience :: Developers',
                   'License :: OSI Approved :: Apache Software License',
                   'Operating System :: OS Independent',
                   'Topic :: Software Development :: Libraries :: Python Modules',
                  ],
     )

