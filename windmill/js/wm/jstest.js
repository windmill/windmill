/*
Copyright 2007, Open Source Applications Foundation

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

var jum = windmill.controller.asserts;

windmill.jsTest = new function () {
  this.tests = null;
  this.testOrder = null;
  this.testFailures = [];
  this.testCount = 0;
  this.testFailureCount = 0;

  // Initialize everything to starting vals
  this.init = function () {
    this.tests = null;
    this.testOrder = null;
    this.testFailures = [];
    this.testCount = 0;
    this.testFailureCount = 0;
  }
  // Main function to run a directory of JS tests
  this.run = function (tests) {
    this.init();
    this.doSetup(tests);
    this.loadTests();
    this.runTests();
    return true;
  };
  // Pull out the init file from the list of files
  // if there is one
  this.doSetup = function (tests) {
    var initIndex = null;
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      if (t.indexOf('/initialize.js') > -1) {
        initIndex = i;
      }
    }
    if (typeof initIndex == 'number') {
      var initPath = tests[initIndex];
      tests.splice(initIndex, 1);
      this.tests = tests;
      if (this.doTestInit(initPath)) {
        return true;
      }
    }
  };
  // Run any init code in the init file, and grab
  // the ordered list of tests to run
  this.doTestInit = function(initPath) {
      var str = fleegix.xhr.doReq({ url: initPath,
        async: false });
      // Eval in window scope
      window.eval.apply(window, [str]);
      if (typeof window.testOrder != 'undefined') {
        this.testOrder = window.testOrder;
        // Clean up after ourselves 
        delete window.testOrder;
      }
      return true;
  };
  // Grab the contents of the test files, and eval
  // them in window scope
  this.loadTests = function () {
    var tests = this.tests;
    for (var i = 0; i < tests.length; i++) {
      var path = tests[i];
      var str = fleegix.xhr.doReq({ url: path,
        async: false });
      // Eval in window scope
      window.eval.apply(window, [str]);
    }
    return true;
  };
  this.runTests = function () {
    var order = this.testOrder;
    for (var i = 0; i < order.length; i++) {
      // Get the test name
      var t = order[i];
      // Run the test
      try {
        //console.log('Running ' + t + ' ...');
        window[t]();
      }
      // For each failure, create a TestFailure obj, add
      // to the failures list
      catch (e) {
        var fail = new windmill.jsTest.TestFailure(t, e);
        this.testFailures.push(fail);
      }
      // Clean up after ourselves
      delete window[t];
    }
    this.testCount = order.length;
    this.testFailureCount = this.testFailures.length;
    return true;
  };
};

windmill.jsTest.TestFailure = function (testName, errObj) {
  // Failure message will contain:
  // 1. Name of the test, 2. Optional error comment from
  // the failed assert, and 3. Error message from the
  // failed assert
  function getMessage() {
    var msg = '';
    msg += testName + ': ';
    msg += errObj.comment ? '(' + errObj.comment + ') ' : '';
    msg += errObj.message;
    return msg;
  }
  this.message = getMessage() || '';
  this.error = errObj;
};


