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

import windmill
from windmill.test.windmill_test_lib import setup_module, teardown_module 

test_dict = {}
beginning_locals = locals()

for module in [module for module in dir(windmill.test) if module.startswith('_') is False]:
    for attribute in [attribute for attribute in dir(getattr(windmill.test, module)) if attribute.startswith('_') is False and callable(getattr(getattr(windmill.test, module), attribute))]:
        exec('from windmill.test.%s import %s' % (module, attribute))
    
    test_dict[module] = getattr(windmill.test, module)




