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

import windmill, logging
logger = logging.getLogger(__name__)

def run_test_file(filename, jsonrpc_client):
    f = open(filename)
    test_strings = f.read().splitlines()
    for test in test_strings:
         jsonrpc_client.add_json_test(test)
         logger.info('Added test\n%s' % test)