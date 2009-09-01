#!/usr/bin/env python

import optparse
import os
import re
import shutil

# Location of compiler
MXMLC_PATH = '/Users/mde/flex_sdk_3/bin/mxmlc'

# For replacing .as with .swf
as_re = re.compile('\.as$|\.mxml$')

def windmill():
    cmd = MXMLC_PATH + ' -source-path=. ./org/windmill/Windmill.as -o ./org/windmill/Windmill.swf'
    os.system(cmd)

def bootstrap():
    cmd = MXMLC_PATH + ' -source-path=. ./org/windmill/WMBootstrap.as -o ./org/windmill/WMBootstrap.swf'
    os.system(cmd)

def clean():
    for root, dirs, file_list in os.walk('./'):
        for file in file_list:
            if file.endswith('.swf') or file.endswith('.swc'):
                path = root + '/' + file
                cmd = 'rm ' + path
                #print cmd
                os.system(cmd)

def parse_opts():
    parser = optparse.OptionParser()
    parser.add_option('-t', '--target', dest='target',
            help='build TARGET (windmill/bootstrap/all/clean, default is all)',
            metavar='TARGET', choices=('windmill', 'bootstrap', 'all', 'clean'), default='all')
    opts, args = parser.parse_args()
    return opts, args

def main(o, a):
    target = o.target
    # Build only the AS tests into loadable swfs
    if target == 'windmill':
        windmill()
    # Build only the test app we use to run the tests against
    elif target == 'bootstrap':
        bootstrap()
    # Build everything, natch
    elif target == 'all':
        windmill()
        bootstrap()
    # Clean out any swfs in the directory
    elif target == 'clean':
        clean()
    else:
        print 'Not a valid target.'

if __name__ == "__main__":
    main(*parse_opts())


