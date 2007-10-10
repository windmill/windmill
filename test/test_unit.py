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

import os
import simplejson
import functest
from windmill.authoring import WindmillTestClient

def test_wmunti1():
    client = WindmillTestClient(__name__, assertions=False)

    assert client.open(url=u'http://windmill.osafoundation.org/windmill-unittests/unit_tester.html')['result']
    assert client.click(id=u'subBtn')['result']
    assert client.sleep(milliseconds=u'3000')['result']
    assert client.assertText(validator=u'', id=u'sleeper')['result']
    assert client.sleep(milliseconds=u'8000')['result']
    assert client.assertText(validator=u'Slept', id=u'sleeper')['result']
    assert client.type(text=u'my test text', id=u'junkfield')['result']
    assert client.assertValue(validator=u'my test text', id=u'junkfield')['result']
    assert client.radio(id=u'cougar')['result']
    assert client.assertChecked(id=u'cougar')['result']
    assert client.radio(id=u'duck')['result']
    assert client.assertChecked(id=u'duck')['result']
    assert client.check(id=u'Smallpox')['result']
    assert client.assertChecked(id=u'Smallpox')['result']
    assert client.assertChecked(id=u'Mumps')['result']
    assert client.assertChecked(id=u'Dizziness')['result']
    assert client.check(id=u'Mumps')['result']
    assert client.assertChecked(id=u'Mumps')['result']
    assert client.assertChecked(id=u'Dizziness')['result']
    assert client.check(id=u'Dizziness')['result']
    assert client.assertChecked(id=u'Dizziness')['result']
    assert client.type(text=u'The text area tester', name=u'story')['result']
    assert client.assertValue(validator=u'area', id=u'story')['result']
    assert client.select(option=u'Strawberry', id=u'flavor')['result']
    assert client.assertSelected(validator=u'b', id=u'flavor')['result']
    assert client.select(option=u'Rum and Raisin', id=u'flavor')['result']
    assert client.assertSelected(validator=u'c', id=u'flavor')['result']
    assert client.assertSelected(validator=u'd', id=u'flavor')['result']
    assert client.select(option=u'Peach and Orange', id=u'flavor')['result']
    assert client.assertSelected(validator=u'd', id=u'flavor')['result']
    assert client.click(id=u'clickme')['result']
    assert client.assertText(validator=u'Clicked', id=u'clickme')['result']
    assert client.doubleClick(id=u'dblclickme')['result']
    assert client.assertText(validator=u'Double Clicked', id=u'dblclickme')['result']
    assert client.mousedown(id=u'mousedownme')['result']
    assert client.assertText(validator=u'mouse downed', id=u'mousedownme')['result']
    assert client.mouseup(id=u'mouseupme')['result']
    assert client.assertText(validator=u'mouse upped', id=u'mouseupme')['result']
    assert client.assertNode(id=u'amIhere')['result']
    assert client.assertProperty(validator=u'style.height|50px', id=u'amIhere')['result']
    assert client.assertNode(id=u'doesntExist')['result']
    assert client.assertNode(id=u'created')['result']
    assert client.click(id=u'wfeBtn')['result']
    assert client.forElement(id=u'created', timeout=u'40000')['result']
    assert client.assertNode(id=u'created')['result']