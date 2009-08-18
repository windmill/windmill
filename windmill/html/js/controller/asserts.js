/*
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
*/

/* The following are assertion functions available in all browsers
Currently the dynamic ones are not built into the IDE UI, but will
in the very near future.
*/

windmill.controller.asserts.assertRegistry = {
  'assertTrue': {
  expr: function (a) {
      if (typeof a != 'boolean') {
        throw('Bad argument to assertTrue.');
      }
      return a === true;
    },
  errMsg: 'expected true but was false.'
  },

  'assertFalse': {
  expr: function (a) {
      if (typeof a != 'boolean') {
        throw('Bad argument to assertFalse.');
      }
      return a === false;
    },
  errMsg: 'expected false but was true.'
  },

  'assertEquals': {
  expr: function (a, b) { return a === b; },
  errMsg: 'expected $1 but was $2.'
  },

  'assertNotEquals': {
  expr: function (a, b) { return a !== b; },
  errMsg: 'expected one of the two values not to be $1.'
  },

  'assertGreaterThan': {
  expr: function (a, b) { return a > b; },
  errMsg: 'expected a value greater than $2 but was $1.'
  },

  'assertLessThan': {
  expr: function (a, b) { return a < b; },
  errMsg: 'expected a value less than $2 but was $1.'
  },

  'assertNull': {
  expr: function (a) { return a === null; },
  errMsg: 'expected to be null but was $1.'
  },

  'assertNotNull': {
  expr: function (a) { return a !== null; },
  errMsg: 'expected not to be null but was null.'
  },

  'assertUndefined': {
  expr: function (a) { return typeof a == 'undefined'; },
  errMsg: 'expected to be undefined but was $1.'
  },

  'assertNotUndefined': {
  expr: function (a) { return typeof a != 'undefined'; },
  errMsg: 'expected not to be undefined but was undefined.'
  },

  'assertNaN': {
  expr: function (a) { return isNaN(a); },
  errMsg: 'expected $1 to be NaN, but was not NaN.'
  },

  'assertNotNaN': {
  expr: function (a) { return !isNaN(a); },
  errMsg: 'expected $1 not to be NaN, but was NaN.'
  },

  'assertEvaluatesToTrue': {
  expr: function (a) { return !!a; },
  errMsg: 'value of $1 does not evaluate to true.'
  },

  'assertEvaluatesToFalse': {
  expr: function (a) { return !a; },
  errMsg: 'value of $1 does not evaluate to false.'
  },

  'assertContains': {
  expr: function (a, b) {
      if (typeof a != 'string' || typeof b != 'string') {
        throw('Bad argument to assertContains.');
      }
      return (a.indexOf(b) > -1);
    },
  errMsg: 'value of $1 does not contain $2.'
  }
};

//Currently only does one level below the provided div
//To make it more thorough it needs recursion to be implemented later
windmill.controller.asserts.assertText = function (paramObject) {
  var n = lookupNode(paramObject, false);
  var validator = paramObject.validator;
    
  var inner = n.innerHTML;
  if (n.textContent){
    inner = n.textContent;
  }
  else if (n.innerText) {
    inner = n.innerText;
  }
  // new lines and spaces break a lot of these, so removing them makes sense
  var iHTML = inner.replace(/^\s*|\s*$/g,'');
  
  if (iHTML == validator){
    return true;
  }
  
  // var found = n.textContent;
  // if (found == undefined)
  //   found = n.innerText;
  throw "Text '" + validator +
        "' was not found in the provided node.  Found instead: " + iHTML;
};

windmill.controller.asserts.assertTextIn = function (paramObject) {
  var n = lookupNode(paramObject, false);
  var validator = paramObject.validator;
  
  var inner = n.innerHTML;
  if (n.textContent){
    inner = n.textContent;
  }
  else if (n.innerText){
    inner = n.innerText;
  }
  
  // new lines and spaces break a lot of these, so removing them makes sense
  var iHTML = inner.replace(/^\s*|\s*$/g,'');
  
  if (iHTML.indexOf(validator) != -1){
    return true;
  }
  
  // var found = n.textContent;
  // if (found == undefined)
  //   found = n.innerText;
  throw "Text '" + validator +
        "' was not found in the provided node.  Found instead: " + inner;
};


//Assert that a specified node exists
windmill.controller.asserts.assertNode = function (paramObject) {
  var element = lookupNode(paramObject, false);
};

//Assert that a form element contains the expected value
windmill.controller.asserts.assertValue = function (paramObject) {
  //need to start moving test to use text instead of validator, its dumb
  var n = lookupNode(paramObject, false);
  var validator = paramObject.validator;

  if (n.value == undefined)
    throw "Element doesn't have a value";

  if (n.value != validator){
    throw "Found value \""+ n.value + "\" is not equal to \""+ validator+"\"";
  }
};

windmill.controller.asserts.assertValueIn = function (paramObject) {
  //need to start moving test to use text instead of validator, its dumb
  var n = lookupNode(paramObject, false);
  var validator = paramObject.validator;

  if (n.value == undefined)
    throw "Element doesn't have a value";

  if (n.value.indexOf(validator) == -1){
    throw "Found value \""+ n.value + "\" is not equal to \""+ validator+"\"";
  }
};

//Assert that a provided value is selected in a select element
windmill.controller.asserts.assertJS = function (paramObject) {
  var js = paramObject.js;
  var result = windmill.testWin().eval(js);
  if (result != true){
    throw "JavaScript did not return true."
  }
};

//Assert that a provided value is selected in a select element
windmill.controller.asserts.assertIDEJS = function (paramObject) {
  var js = paramObject.js;
  var result = eval(js);
  if (result != true){
    throw "JavaScript did not return true."
  }
};

//Asserting javascript with an element object available
windmill.controller.asserts.assertElemJS = function (paramObject) {
  var element = lookupNode(paramObject, false);
  var js = paramObject.js;
  var result = eval(js);
  if (result != true){
    throw "JavaScript did not return true."
  }
};

//Assert that a provided value is selected in a select element
windmill.controller.asserts.assertSelected = function (paramObject) {
  var n = lookupNode(paramObject, false);
  var validator = paramObject.validator;

  if ((n.options[n.selectedIndex].value != validator) && (n.options[n.selectedIndex].innerHTML != validator)){
    throw "Not selected, "+n.options[n.selectedIndex].value+" is not equal to " + validator;
  }
};

//Assert that a provided checkbox is checked
windmill.controller.asserts.assertChecked = function (paramObject) {
  var n = lookupNode(paramObject, false);

  if (!n.checked){
    throw "Checked property not true";
  }
};

// Assert that a an element's property is a particular value
windmill.controller.asserts.assertProperty = function (paramObject) {
  var element = lookupNode(paramObject, false);
  var vArray = paramObject.validator.split('|');
  if (vArray.length != 2)
    throw "Invalid validator '" + paramObject.validator + "'.  Use '|' to separate key from value.";

  var expected = "Expected property '" + vArray[0] + "' to have value '" + vArray[1] + "'. ";

  var value = eval ('element.' + vArray[0]+';');
  if (value == undefined)
    throw expected + "No '" + vArray[0] + "' property found.";

  if (value.indexOf(vArray[1]) != -1){
    return true;
  }
  if (String(value) == String(vArray[1])) {
    return true;
  }
  throw expected + "Found value '" + value + "' instead."
};

// Assert that a specified image has actually loaded
// The Safari workaround results in additional requests
// for broken images (in Safari only) but works reliably
windmill.controller.asserts.assertImageLoaded = function (paramObject) {
  var img = lookupNode(paramObject, false);
  if (!img || img.tagName != 'IMG') {
    throw "The node was not an image."
  }
  var comp = img.complete;
  var ret = null; // Return value

  // Workaround for Safari -- it only supports the
  // complete attrib on script-created images
  if (typeof comp == 'undefined') {
    test = new Image();
    // If the original image was successfully loaded,
    // src for new one should be pulled from cache
    test.src = img.src;
    comp = test.complete;
  }

  // Check the complete attrib. Note the strict
  // equality check -- we don't want undefined, null, etc.
  // --------------------------
  // False -- Img failed to load in IE/Safari, or is
  // still trying to load in FF
  if (comp === false) {
    throw "Image complete attrib false."
  }
  // True, but image has no size -- image failed to
  // load in FF
  else if (comp === true && img.naturalWidth == 0) {
    throw "Image has no size, failure to load."
  }
  // Otherwise all we can do is assume everything's
  // hunky-dory
  else {
    ret = true;
  }
  return ret;
};

windmill.controller.asserts._AssertFactory = new function () {
  var _this = this;
  function validateArgs(count, args) {
    if (!(args.length == count ||
	  (args.length == count + 1 && typeof(args[0]) == 'string') )) {
      throw('Incorrect arguments passed to assert function');
    }
  }
  function createErrMsg(msg, arr) {
    var str = msg;
    for (var i = 0; i < arr.length; i++) {
      //When calling jum functions arr is an array with a null entry
      if (arr[i] != null){
        var val = arr[i];
        var display = '<' + val.toString().replace(/\n/g, '') +
          '> (' + getTypeDetails(val) + ')';
        str = str.replace('$' + (i + 1).toString(), display);
      }
    }
    return str;
  }
  function getTypeDetails(val) {
    var r = typeof val;
    try {
      if (r == 'object' || r == 'function') {
        var m = val.constructor.toString().match(/function\s*([^( ]+)\(/);
						 if (m) { r = m[1]; }
						 else { r = 'Unknown Data Type' }
						 }
      }
      finally {
        r = r.substr(0, 1).toUpperCase() + r.substr(1);
        return r;
      }
    }
    this.createAssert = function (meth) {
      return function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(meth);
      return _this.doAssert.apply(_this, args);
      }
    }
    this.doAssert = function () {
      // Convert arguments to real Array
      var args = Array.prototype.slice.call(arguments);
      // The actual assert method, e.g, 'equals'
      var meth = args.shift();
      // The assert object
      var asrt = windmill.controller.asserts.assertRegistry[meth];
      // The assert expresion
      var expr = asrt.expr;
      // Validate the args passed
      var valid = validateArgs(expr.length, args);
      // Pull off additional comment which may be first arg
      var comment = args.length > expr.length ?
        args.shift() : null;
      // Run the assert
      var res = expr.apply(window, args);
      if (res) {
	      return true;
      }
      else {
        var message = meth + ' -- ' +        
        createErrMsg(asrt.errMsg, args);
        
	      throw new windmill.controller.asserts._WindmillAssertException(comment, message);
      }
    };
  };

// Create all the assert methods on windmill.controller.asserts
// Using the items in the assertRegistry
for (var meth in windmill.controller.asserts.assertRegistry) {
  windmill.controller.asserts[meth] = windmill.controller.asserts._AssertFactory.createAssert(meth);
  windmill.controller.asserts[meth].jsUnitAssert = true;
}

windmill.controller.asserts._WindmillAssertException = function (comment, message) {
  this.comment = comment;
  this.message = message;
};

