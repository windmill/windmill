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

  this.init = function () {
    this.tests = null;
    this.testOrder = null;
    this.testFailures = [];
    this.testCount = 0;
    this.testFailureCount = 0;
  }
  this.run = function (tests) {
    this.init();
    this.doSetup(tests);
    this.loadTests();
    this.runTests();
    return true;
  };
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
  this.doTestInit = function(initPath) {
      var str = fleegix.xhr.doReq({ url: initPath,
        async: false });
      eval(str);
      if (typeof testOrder != 'undefined') {
        this.testOrder = testOrder;
      }
      return true;
  };
  this.loadTests = function () {
    var tests = this.tests;
    for (var i = 0; i < tests.length; i++) {
      var path = tests[i];
      var str = fleegix.xhr.doReq({ url: path,
        async: false });
      window.eval.apply(window, [str]);
    }
    return true;
  };
  this.runTests = function () {
    var order = this.testOrder;
    for (var i = 0; i < order.length; i++) {
      var t = order[i];
      try {
        console.log('Running ' + t + ' ...');
        window[t]();
      }
      catch (e) {
        var fail = new windmill.jsTest.TestFailure(t, e);
        this.testFailures.push(fail);
      }
    }
    this.testCount = order.length;
    this.testFailureCount = this.testFailures.length;
    return true;
  };
};

windmill.jsTest.TestFailure = function (testName, errObj) {
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


