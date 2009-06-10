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

import wsgi, convergence

forwarding_conditions = [
    lambda e : 'google.com/safebrowsing/downloads' not in e['reconstructed_url'],
    lambda e : 'mozilla.org/en-US/firefox/livebookmarks.html' not in e['reconstructed_url'],
    lambda e : e.get('CONTENT_TYPE') != 'application/x-shockwave-flash',
    lambda e : not e['reconstructed_url'].endswith(".mozilla.com/firefox/headlines.xml")
    ]

def add_forward_condition(condition):
    forwarding_conditions.append(condition)
    
def remove_forward_condition(condition):
    while condition in forwarding_conditions:
        forwarding_conditions.remove(condition)

