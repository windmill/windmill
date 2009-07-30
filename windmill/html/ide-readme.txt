Copyright 2006-2007, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
_____


Usage:

Check out the code: svn co http://svn.osafoundation.org/windmill/trunk windmill
Run the server: python ./windmill/server/proxy.py
Configure browser to use http proxy : 127.0.0.1 port 4444
The default setup is configured as a demo, so launch the browser to: http://next.osaf.us/windmill-serv/start.html

From here you can click "Expand Control" to run tests.

All test commands are available that are in the selenium core but in a new format:
	example: windmill.controller.click('id':'blah');

Here windmill is the object created to allow for direct javascript interaction with the core.
doClick is the windmill action you want to perform, this could also by doType, doKeyDown etc.
The next piece is the parameters, some tests only require a locator such as the above example is saying click this link.
These can also be specified with id's or xpath.

An example with to parameters:
	example windmill.controller.type('id':'blah', 'text':"test");
	
This is telling windmill to type in the text box with the id: loginDialogPasswordInput, and to type the text "test".

Configuration:

When you append windmill-serv to a directory the proxy returns the file from the core directory instead of the remote server.
Each of the iframes src and the location in the browser have to be from the same domain to bypass the cross domain browser security.


