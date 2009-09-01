#!/usr/bin/env python

import optparse
import os
import re
import shutil

# Location of compiler
MXMLC_PATH = '/Users/mde/flex_sdk_3/bin/mxmlc'

# For replacing .as with .swf
as_re = re.compile('\.as$|\.mxml$')
# Script options
opts = None

def compile():
    for root, dirs, file_list in os.walk('./'):
            for file in file_list:
                if file.endswith('.as'):
                    as_file = root + file
                    swf_file = as_re.sub('.swf', as_file)
                    # Compile this biyatch
                    # -----------------------
                    cmd = MXMLC_PATH + ' -source-path=. -source-path+=../../flash ' + as_file + ' -o ' + swf_file
                    #print cmd
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
    parser.add_option('-a', '--action', dest='action',
            help='perform ACTION (compile/clean, default is compile)',
            metavar='ACTION', choices=('compile', 'clean'), default='compile')
    opts, args = parser.parse_args()
    return opts, args

def main(o, a):
    global opts
    opts = o
    if opts.action == 'compile':
        compile()
    elif opts.action == 'clean':
        clean()
    else:
        print 'Not a valid action.'

if __name__ == "__main__":
    main(*parse_opts())


