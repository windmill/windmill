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
  var brokenEval;

  function globalEval(code, testWin) {
    var win = testWin ? windmill.testWindow : window;
    // Do we have a working eval?
    if (typeof brokenEval == 'undefined') {
      window.eval.call(window, 'var __EVAL_TEST__ = true;');
      if (typeof window.__EVAL_TEST__ != 'boolean') {
        brokenEval = true;
      }
      else {
        brokenEval = false;
        delete window.__EVAL_TEST__;
      }
    }
    if (brokenEval) {
      //if (window.execScript) {
        //win.execScript(code);
      //}
      //else {
        windmill.utility.appendScriptTag(win, code);
      //}
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

  this.testFiles;
  this.testScriptSrc;
  this.regFile;
  this.testNamespaces;
  this.testList;
  this.testOrder;
  this.testItemArray;
  this.testFailures;
  this.testCount;
  this.testFailureCount;
  this.runInTestWindowScope;
  this.currentTestName;
  this.currentJsTestTimer;
  this.jsSuiteSummary;

  // Initialize everything to starting vals
  this.init = function () {
    windmill.testWindow.windmill = windmill;
    this.testFiles = null;
    this.testScriptSrc = '';
    this.regFile = false;
    this.testNamespaces = [];
    this.testList = [];
    this.testOrder = null;
    this.testItemArray = null;
    this.testFailures = [];
    this.testCount = 0;
    this.testFailureCount = 0;
    this.runInTestWindowScope = true;
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
    var regIndex = null;
    var initIndex = null;
    var dirs = [];
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      if (t.indexOf('/register.js') > -1) {
        regIndex = i;
      }
    }
    // Get any specific test registrations
    // Exec this file in the remote's window scope
    // to call registerTests or registerTestNamespace
    if (typeof regIndex == 'number') {
      this.regFile = true;
      var regPath = tests[regIndex];
      tests.splice(regIndex, 1);
      this.doTestRegistration(regPath);
    }
    // Remove any directories or non-js files returned
    for (var i = 0; i < tests.length; i++) {
      if (t.indexOf('\.js') == -1) {
        dirs.push(i);
      }
    }
    for (var i = 0; i < dirs.length; i++) {
      tests.splice(dirs[i], 1);
    }
    // Load the asserts into the test window scope
    // as the 'jum' object
    if (this.runInTestWindowScope) {
      windmill.testWindow.jum = windmill.controller.asserts;
      if (document.all) {
        windmill.testWindow.jsTest = this;
      }
    }
    // Test files include any initialize.js environ setup
    // files in the directories
    this.testFiles = tests;
    return true;
  };
  // Run any init code in the init file, and grab
  // the ordered list of tests to run
  this.doTestRegistration = function(path) {
    var str = windmill.utility.getFile(path);
    // Eval in window scope
    globalEval(str, false);
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
    var str = '';
    function parseObj(obj, namespace) {
      var re = /^test_/;
      var o = obj;
      for (var p in o) {
        var item = o[p];
        if (!re.test(p)) {
          str += p + ': ' + item + ', ';
        }

        // Functions or Arrays with names beginning with 'test_'
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
    // IE-only. Use regex-fu against the source code --
    // functions objects appear to drop their type across
    // windows
    if (window.execScript) {
      re = new RegExp('(' + name + '.*\\.test_.+)(\\s+=)', 'gm');
      var m = [];
      while (m = re.exec(this.testScriptSrc)) {
        arr.push(m[1]);
      }
    }
    // Non-shite browsers, parse through the tree of the
    // namespace obj, looking for functions or arrays of
    // functions beginning with 'test_'
    else {
      var win = this.runInTestWindowScope ?
        windmill.testWindow : window;
      parseObj(win[name], name);
    }
    this.testList = combineLists(this.testList, arr);
  };
  this.getTestNames = function () {
    if (this.regFile) {
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
    // Eval any init files first
    for (var i = 0; i < tests.length; i++) {
      var path = tests[i];
      if (path.indexOf('/initialize.js') == -1) {
        continue;
      }
      var str = this.getFile(path);
      // Eval in window scope
      globalEval(str, this.runInTestWindowScope);
    }
    // Then eval the test files
    for (var i = 0; i < tests.length; i++) {
      var path = tests[i];
      if (path.indexOf('/initialize.js') > -1) {
        continue;
      }
      var str = this.getFile(path);
      if (window.execScript) {
        this.testScriptSrc += str + '\n';
      }
      // Eval in window scope
      globalEval(str, this.runInTestWindowScope);
    }
    return true;
  };
  this.showMsg = function (msg) {
    alert(msg);
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
      // Tell IDE what is going on
      windmill.ui.results.writeStatus('Running '+ testName + '...');
      if (testFunc.length > 0) {
        this.testItemArray = { name: testName, funcs: testFunc }
        this.runTestItemArray();
      }
      else if (typeof testFunc == 'function' ||
        (document.all && testFunc.toString().indexOf('function') == 0)) {
        this.runTest(testName, testFunc);
        this.runTests();
      }
    }
    return true;
  };
  this.runTest = function (testName, testFunc) {
    //Do some timing of test run
    this.currentTestName = testName;
    var timer = new windmill.TimeObj();
    timer.setName(testName);
    timer.startTime();
    this.currentJsTestTimer = timer;
    // Run the test
    try {
      if (document.all && this.runInTestWindowScope) {
        // Holy crap, what a god-awful hack this is
        // There *has* to be a better way to do this
        var execStr = 'window.execFunc = ' +
          testFunc.toString() + '; try { window.execFunc.call(window); } catch(e) { window.jsTest.handleErr.call(window.jsTest, e); }';
        windmill.testWindow.execScript(execStr);
      }
      else {
        testFunc();
      }
      this.currentJsTestTimer.endTime();
      //write to the results tab in the IDE
      windmill.ui.results.writeResult("<br>Test: <b>" +
				      testName + "<br>Test Result:" + true);
      //send report for pass
      windmill.jsTest.sendJSReport(testName, true, null,
        this.currentJsTestTimer);
    }
    // For each failure, create a TestFailure obj, add
    // to the failures list
    catch (e) {
      this.handleErr(e);
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
      if (typeof item == 'undefined') {
        throw new Error('Test item in array-style test is undefined -- likely a trailing comma separator has caused this.');
      }
      if (typeof item == 'function' ||
        (document.all && item.toString().indexOf('function') == 0)) {
        this.runTest(this.testItemArray.name, item);
      }
      else {
        // If the action is a sleep, set the sleep
        // wait interval for the setTimeout loop
        if (item.method == 'waits.sleep') {
          t = item.params.milliseconds;
        }
        else {
          // Get the UI action to execute
          var func = eval('windmill.jsTest.actions.' + item.method);
          // Check for any shortcut vars in jsids, replace with
          // real JS paths
          var jsid = item.params.jsid;
          if (typeof jsid != 'undefined' && jsid.indexOf('{$') > -1) {
            item.params.jsid = windmill.controller.handleVariable(jsid);
          }
          // Execute the UI action with the set params
          func(item.params);
        }
      }
      var f = function () { _this.runTestItemArray.apply(_this); };
      setTimeout(f, t);
    }
  };
  this.handleErr = function (e) {
    var testName = this.currentTestName;
    this.currentJsTestTimer.endTime();
    var fail = new windmill.jsTest.TestFailure(testName, e);
    var msg = fail.message;
    // Escape angle brackets for display in HTML
    msg = msg.replace(/</g, '&lt;');
    msg = msg.replace(/>/g, '&gt;');
    windmill.ui.results.writeResult("<br>Test: <b>" +
            testName + "<br>Test Result:" + false + '<br>Error: '+ msg);
    windmill.jsTest.sendJSReport(testName, false, e, this.currentJsTestTimer);
    this.testFailures.push(fail);
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
  var json_object = new json_call('1.1', 'report_without_resolve');
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
      var cwTimer = new windmill.TimeObj();
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
