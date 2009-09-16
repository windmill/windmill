/*
Copyright 2006-2007, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/*For information on how to build your own extensions, visit:
  http://trac.getwindmill.com/wiki/BookChapter-7-Extensions
*/
windmill.controller.extensions = new function () {};

/*
// This is a sample extension that checks what an HTML
// form's method attribute is
windmill.controller.extensions.assertFormMethod = function (paramObject) {
	// Look up the form, by id or whatever
  var n = lookupNode(paramObject);
	// GET, POST, etc.
  var validator = paramObject.validator;
	if (!n.method) {
		return false;
	}
	// HTTP methods are supposed to be case-sensitive, but
	// who knows what people will use
	if (n.method.toLowerCase() == validator.toLowerCase()) {
		return true;
	}
	else {
		return false;
	}
};

// This makes it show up in the IDE -- note: it needs to be
// an object key *string* of "extensions.yourAsserName"
// You have to pass it as a string, since it contains a dot
windmill.registry.methods['extensions.assertFormMethod'] = {
  locator: true,
  option: 'validator'
};
*/
