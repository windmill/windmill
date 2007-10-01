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

  function globalEval(code, testWin) {
    var win = testWin ? windmill.testWindow : window;
    if (window.execScript) {
      win.execScript(code);
    }
    else {
      win.eval.call(win, code);
    }
  };
  function combineLists(listA, listB) {
    var arr = [];
    if (listB.length) {
      arr = listA.length ? listA.join() + ',' +
        listB.join() : listB.join();
      arr = arr.split(',');
    }
    return arr;
  }

  this.testFiles = null;
  this.initFile = false;
  this.testNamespaces = [];
  this.testList = [];
  this.testOrder = null;
  this.testItemArray = null;
  this.testFailures = [];
  this.testCount = 0;
  this.testFailureCount = 0;
  this.runInTestWindowScope = false;
  this.jsSuiteSummary = null;

  // Initialize everything to starting vals
  this.init = function () {
    this.testFiles = null;
    this.initFile = false;
    this.testNamespaces = [];
    this.testList = [];
    this.testOrder = null;
    this.testItemArray = null;
    this.testFailures = [];
    this.testCount = 0;
    this.testFailureCount = 0;
    this.runInTestWindowScope = false;
  }
  // Main function to run a directory of JS tests
  this.run = function (testFiles) {
    this.init();
    this.doSetup(testFiles);
    this.loadTests();
    this.getTestNames();
    this.runTests();
  };
  this.finish = function () {
    this.testCount = this.testList.length;
    this.testFailureCount = this.testFailures.length;
    windmill.controller.commands.jsTestResults();
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
      this.initFile = true;
      var initPath = tests[initIndex];
      tests.splice(initIndex, 1);
      this.testFiles = tests;
      if (this.doTestInit(initPath)) {
        return true;
      }
    }
    else {
      this.testFiles = tests;
      return true;
    }
  };
  // Run any init code in the init file, and grab
  // the ordered list of tests to run
  this.doTestInit = function(initPath) {
    var str = fleegix.xhr.doReq({ url: initPath,
	  async: false });
    // Eval in window scope
    globalEval(str);
    return true;
  };
  // Can be called from the eval of an initialize.js file --
  // registers all the tests to be run, in order
  this.registerTests = function (arr) {
    this.testList = combineLists(this.testList, arr);
  };
  // Can be called from the eval of an initialize.js file --
  // parses a JS namespace object for functions that
  // start with 'test_'. Does not guarantee the order of
  // tests run
  this.registerTestNamespace = function (name) {
    this.testNamespaces.push(name);
  };
  this.parseTestNamespace = function (name) {
    var arr = [];
    var re = /^test_/;
    function parseObj(obj, namespace) {
      var o = obj;
      for (var p in o) {
        console.log(p);
        var item = o[p];
        if ((typeof item == 'function' ||
          typeof item.push == 'function') && re.test(p)) {
          arr.push(namespace + '.' + p);
        }
        else if (typeof item == 'object') {
          var n = namespace + '.' + p;
          parseObj(item, n);
        }
      }
    }
    var win = this.runInTestWindowScope ?
      windmill.testWindow : window;
    parseObj(win[name], name);
    this.testList = combineLists(this.testList, arr);
  };
  this.getTestNames = function () {
    if (this.initFile) {
      var n = this.testNamespaces;
      for (var i = 0; i < n.length; i++) {
        this.parseTestNamespace(n[i]);
      }
    }
    else {
      var re = /^test_/;
      var arr = [];
      for (var p in window) {
        var item = window[p];
        if ((typeof item == 'function'
          || typeof item.push == 'function') && re.test(p)) {
          arr.push(p);
        }
        this.testList = arr;
      }
    }
    if (this.testList.length) {
      this.testOrder = this.testList.slice();
    }
    else {
      throw new Error('No tests to run.');
    }
  };
  // Grab the contents of the test files, and eval
  // them in window scope
  this.loadTests = function () {
    var tests = this.testFiles;
    for (var i = 0; i < tests.length; i++) {
      var path = tests[i];
      var str = fleegix.xhr.doReq({ url: path,
	    async: false });
      // Eval in window scope
      globalEval(str, this.runInTestWindowScope);
    }
    return true;
  };
  this.runTests = function () {
    var arr = null; // parseTestName recurses through this
    var p = null; // Appended to by parseTestName
    var testName = '';
    var testFunc = null;
    var win = this.runInTestWindowScope ?
      windmill.testWindow : window;
    var parseTestName = function (n) {
      p = !n ? win : p[n];
      return arr.length ? parseTestName(arr.shift()) : p;
    };
    if (this.testOrder.length == 0) {
      this.finish();
    }
    else {
      // Get the test name
      testName = this.testOrder.shift();
      // Split into array of string keys keys on dot-properties
      arr = testName.split('.');
      // call parseTestName recursively to append each
      // property/key onto the window obj from the array
      // 'foo.bar.baz' => arr = ['foo', 'bar', 'baz']
      // parseTestName:
      // p = window['foo'] =>
      // p = window['foo']['bar'] =>
      // p = window['foo']['bar']['baz']
      testFunc = parseTestName();
      //alert(testFunc);
      // Tell IDE what is going on
      windmill.ui.results.writeStatus('Running '+ testName + '...');
      if (typeof testFunc == 'function') {
        this.runTest(testName, testFunc);
        this.runTests();
      }
      else if (testFunc.length > 0) {
        this.testItemArray = { name: testName, funcs: testFunc }
        this.runTestItemArray();
      }
    }
    return true;
  };
  this.runTest = function (testName, testFunc) {
    //Do some timing of test run
    var jsTestTimer = new TimeObj();
    jsTestTimer.setName(testName);
    jsTestTimer.startTime();
    // Run the test
    try {
      //console.log('Running ' + testName + ' ...');
      testFunc();
      jsTestTimer.endTime();
      //write to the results tab in the IDE
      windmill.ui.results.writeResult("<br>Test: <b>" +
				      testName + "<br>Test Result:" + true);
      //send report for pass
      windmill.jsTest.sendJSReport(testName, true, null,jsTestTimer);
    }
    // For each failure, create a TestFailure obj, add
    // to the failures list
    catch (e) {
      jsTestTimer.endTime();
      var fail = new windmill.jsTest.TestFailure(testName, e);
      windmill.ui.results.writeResult("<br>Test: <b>" +
				      testName + "<br>Test Result:" + false + '<br>Error: '+ fail.message);
      windmill.jsTest.sendJSReport(testName, false, e, jsTestTimer);
      this.testFailures.push(fail);
    }
  };
  this.runTestItemArray = function () {
    var _this = this;
    var t = 0;
    if (this.testItemArray.funcs.length == 0) {
      this.runTests();
    }
    else {
      var item = this.testItemArray.funcs.shift();
      if (typeof item == 'function') {
        this.runTest(this.testItemArray.name, item);
      }
      else {
        if (item.method == 'waits.sleep') {
          t = item.params.milliseconds;
        }
        else {
          var func = eval('windmill.jsTest.actions.' + item.method);
          func(item.params);
        }
      }
      var f = function () { _this.runTestItemArray.apply(_this); };
      setTimeout(f, t);
    }
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

//Send the report
windmill.jsTest.sendJSReport = function (testname, result, error, timer) {
  var reportHandler = function (str) {
    response = eval('(' + str + ')');
    if (!response.result || response.result != 200) {
      windmill.ui.results.writeResult('Error: Report receiving non 200 response.');
    }
  };
  var result_string = fleegix.json.serialize(result);
  var dt = new Date();
  var test_obj = { "result": result,
		   "starttime": timer.getStart(),
		   "endtime": timer.getEnd(),
		   "debug": error,
		   "uuid": dt.getTime(),
		   "suite_name": "jsTest" };
  var json_object = new windmill.xhr.json_call('1.1', 'report_without_resolve');
  json_object.params = test_obj;
  var json_string = fleegix.json.serialize(json_object);
  //Actually send the report
  fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', json_string);
};

windmill.jsTest.actions = {};
// Extensions load last -- wait until everything has
// loaded before building all the wrapper methods
windmill.jsTest.actions.loadActions = function () {
  var wrapperMethodBuilder = function (name, meth) {
    var namespace = name ? windmill.controller[name] : windmill.controller;
    return function () {
      var args = Array.prototype.slice.call(arguments);
      //We want to time how long this takes
      var cwTimer = new TimeObj();
      cwTimer.setName(meth);
      cwTimer.startTime();
      //Run the action in the UI
      var result = namespace[meth].apply(namespace, args);
      //End the timer
      cwTimer.endTime();
      //Send a report to the backend
      windmill.jsTest.sendJSReport(meth, result, null, cwTimer);
      //Continue on with the test running
      return;
    };
  };
  // Build wrappers for controller, controller.extensions,
  // controller.waits
  var names = ['', 'extensions'];
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var namespace = name ? windmill.controller[name] : windmill.controller;
    for (var methodName in namespace) {
      var methodFunc = namespace[methodName];
      // We only want functions -- non-private ones
      if (typeof methodFunc == 'function' && methodName.indexOf('_') != 0) {
        if (name) {
          // Create the namespace object if it doesn't exist
          if (!this[name]) { this[name] = {}; }
          base = this[name];
        }
        else {
          base = this;
        }
        // Create a wrapper method for each controller
        // method we're interested in
        base[methodName] =
          wrapperMethodBuilder(name, methodName);
      }
    }
  }
};

fleegix.event.listen(window, 'onload', windmill.jsTest.actions, 'loadActions');

// Alias for use in test actions
var wm = windmill.jsTest.actions;
