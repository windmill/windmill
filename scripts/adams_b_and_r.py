#!/usr/bin/env python
#   Copyright (c) 2007 Mikeal Rogers
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

import build_and_release

build_and_release.SITE_PACKAGES = '/Library/Python/2.6/site-packages'

build_and_release.PYTHON_BIN_DIR = '/System/Library/Frameworks/Python.framework/Versions/2.6/bin/'

if __name__ == '__main__':
    build_and_release.main()
