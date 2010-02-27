#!/usr/bin/env python
#   Copyright (c) 2006-2007 Open Source Applications Foundation
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

## The resolver for py2app won't find dependencies that aren't imported in the main app file.
## The if block is to speed up initial load.

import os, sys, time
import windmill

def main():
    if len(sys.argv) is 0 or len(sys.argv) is 1 or sys.argv[1] == 'help' or sys.argv[1] == '--help' or sys.argv[1] == '-h' or sys.argv[1] == '--h' or sys.argv[1] == '-help':
        from windmill.bin import admin_options
        if len(sys.argv) > 0:
            admin_options.help(sys.argv[0])
        else:
            admin_options.help()
        sys.exit()

    from windmill.bin import admin_lib
    admin_lib.command_line_startup()

if __name__ == "__main__":
    main()

    








