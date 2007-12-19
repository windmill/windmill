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

  // Private vars
  var brokenEval;
  var assumedLocation = '';
  var basePath = '';
  var loadedJSCodeFiles ={};

  function appendScriptTag(win, code) {
    var script = win.document.createElement('script');
    script.type = 'text/javascript';
    var head = win.document.getElementsByTagName("head")[0] ||
      win.document.documentElement;
    if (document.all) {
      script.text = code;
    }
    else {
      script.appendChild(win.document.createTextNode(code));
    }
    head.appendChild(script);
    head.removeChild(script);
    return true;
  }
  function globalEval(path, code, testWin) {
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
    // Try to eval the code
    try {
      if (brokenEval) {
        appendScriptTag(win, code);
      }
      else {
        win.eval.call(win, code);
      }
    }
    // Pass along syntax errors
    catch (e) {
      var err = new Error("Error eval'ing code in file '" +
        path + "' (" + e.message + ")");
      err.name = e.name;
      err.stack = e.stack;
      throw err;
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
  this.testOrderMappings;
  this.testItemArray;
  this.testFailures;
  this.testCount;
  this.testFailureCount;
  this.runInTestWindowScope;
  this.currentTestName;
  this.currentJsTestTimer;
  this.jsSuiteSummary;
  this.waiting;

  // Initialize everything to starting vals
  this.init = function () {
    windmill.testWindow.windmill = windmill;
    this.testFiles = null;
    this.testScriptSrc = '';
    this.regFile = false;
    this.testNamespaces = [];
    this.testList = [];
    this.testOrder = null;
    this.testOrderMappings = {};
    this.testItemArray = null;
    this.testFailures = [];
    this.testCount = 0;
    this.testFailureCount = 0;
    this.runInTestWindowScope = true;
    this.waiting = false;
  };
  // Main function to run a directory of JS tests
  this.run = function (testFiles) {
    this.actions.loadActions();
    this.init();
    this.doSetup(testFiles);
    this.loadTestFiles();
    this.getTestNames();
    this.setAssumedLocation();
    this.runNextTest();
  };
  this.finish = function () {
    this.testCount = this.testList.length;
    this.testFailureCount = this.testFailures.length;
    windmill.controller.commands.jsTestResults();
  };
  // Pull out the init file from the list of files
  // if there is one
  this.doSetup = function (testFiles) {
    var regIndex = null;
    var initIndex = null;
    var dirs = [];
    for (var i = 0; i < testFiles.length; i++) {
      var t = testFiles[i];
      if (t.indexOf('/register.js') > -1) {
        regIndex = i;
      }
    }
    // Get any specific test registrations
    // Exec this file in the remote's window scope
    // to call registerTests or registerTestNamespace
    if (typeof regIndex == 'number') {
      this.regFile = true;
      var regPath = testFiles[regIndex];
      testFiles.splice(regIndex, 1);
      this.doTestRegistration(regPath);
    }
    // Remove any directories or non-js files returned
    for (var i = 0; i < testFiles.length; i++) {
      if (t.indexOf('\.js') == -1) {
        dirs.push(i);
      }
    }
    for (var i = 0; i < dirs.length; i++) {
      testFiles.splice(dirs[i], 1);
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
    this.testFiles = testFiles;
    return true;
  };
  // Grab any ordered list of tests to run if register.js exists
  this.doTestRegistration = function(path) {
    var str = this.getFile(path);
    // Eval in window scope
    globalEval(path, str, false);
    return true;
  };
  // Can be called from the eval of an register.js file --
  // registers all the tests to be run, in order
  this.registerTests = function (arr) {
    this.testNamespaces = combineLists(this.testNamespaces, arr);
  };
  // Can be called from the eval of a register.js file --
  // parses a JS namespace object for functions that
  // start with 'test_'. Does not *guarantee* the order of
  // tests run, but all existing ECMAScript implementations
  // actually do a for/in in the order properties are added
  this.registerTestNamespace = function (name) {
    this.testNamespaces.push(name);
  };
  // Grab the contents of the test files, and eval
  // them in window scope
  this.loadTestFiles = function () {
    var testFiles = this.testFiles;
    var basePathArr = testFiles[0].split('/windmill-jstest/');
   
    loadedJSCodeFiles = {};

    basePath = basePathArr[0] + '/windmill-jstest/';
    // The aggregated source code for the tests
    this.testScriptSrc = '';
    // Eval any init files first
    for (var i = 0; i < testFiles.length; i++) {
      var path = testFiles[i];
      if (path.indexOf('/initialize.js') == -1) {
        continue;
      }
      var str = this.getFile(path);
      // Eval in window scope
      globalEval(path, str, this.runInTestWindowScope);
    }
    // Then eval the test files
    for (var i = 0; i < testFiles.length; i++) {
      var path = testFiles[i].replace(basePath, '');
      if (path.indexOf('initialize.js') > -1) {
        continue;
      }
      this.includeJSCodeFile(path);
    }
    return true;
  };
  this.require = function (path) {};
  this.includeJSCodeFile = function (path) {
    var fullPath = basePath + path;
    if (typeof loadedJSCodeFiles[path] == 'undefined') { 
      var code = this.getFile(fullPath);
      var re = /^windmill.jsTest.require\((\S+?)\);\n/gm;
      var requires = [];
      while (m = re.exec(code)) {
         requires.push(m);
      }
      for (var i = 0; i < requires.length; i++) {
        var path = requires[i][1].replace(/'/g, '').replace(/"/g, '');
        var waitForIt = this.includeJSCodeFile(path);
      }
      // Append to aggregate source
      this.testScriptSrc += code + '\n';
      // Eval in window scope
      globalEval(path, code, this.runInTestWindowScope);
      loadedJSCodeFiles[path] = true;
    }
    return true;
  };
  this.parseTestNamespace = function (name) {
    var arr = [];
    var isTestable = function (o) {
      if (document.all) {
        // IE loses type info for functions across window boundries
        if ((o.toString && o.toString().indexOf('function')) == 0 ||
          (o.push && typeof o.length == 'number')) {
          return true;
        }
      }
      else {
        if (typeof o == 'function' || typeof o.push == 'function') {
          return true;
        }
      }
    };
    var parseNamespaceObj = function(obj, namespace) {
      var re = /^test_/;
      var parseObj = obj;
      var doParse = function (parseItem, parseItemName) {
        // functions or arrays
          if (isTestable(parseItem)) {
            arr.push(namespace + '.' + parseItemName);
          }
          // Possible namespace objects -- look for more tests
          else {
            var n = namespace + '.' + parseItemName;
            parseNamespaceObj(parseItem, n);
          }
      };
      // Only functions and arrays
      if (parseObj.setup) {
        doParse(parseObj.setup, 'setup');
      }
      for (var parseProp in parseObj) {
        var item = parseObj[parseProp];
        // Only things with names beginning with 'test_'
        if (re.test(parseProp)) {
          doParse(item, parseProp);
        }
      }
      if (parseObj.teardown) {
        doParse(parseObj.teardown, 'teardown');
      }
    };
    var baseObj = this.lookupObjRef(name);
    if (!baseObj) {
      throw new Error('Test namespace "' + name +
        '" does not exist -- it is not defined in any of your test files.');
    }
    else {
      if (isTestable(baseObj)) {
        arr.push(name);
      }
      else {
        parseNamespaceObj(baseObj, name);
      }
    }

    this.testList = combineLists(this.testList, arr);
  };
  this.getTestNames = function () {
    // No register.js
    if (!this.regFile) {
      var code = this.testScriptSrc;
      var re;
      // Ignore anything in multiline comments
      // Simplified version of original regex from unitedscripters.com
      re = /\/\*(.|\n)*?\*\//g;
      code = code.replace(re, '');
      // Find any symbol with name staring with "test_"
      // in the top-level window scope
      // This will ignore anything in a one-line //-style comment
      re = /(^var\s+|^function\s+)(test_[^\s(]+)/gm;
      while (m = re.exec(code)) {
        this.testNamespaces.push(m[2]);
      }
    }
    var n = this.testNamespaces;
    for (var i = 0; i < n.length; i++) {
      this.parseTestNamespace(n[i]);
    }
    if (this.testList.length) {
      // Clone the list
      this.testOrder = this.testList.slice();
      // Create the reverse map of tests -- test name is the hash key
      for (var i = 0; i < this.testOrder.length; i++) {
        this.testOrderMappings[this.testOrder[i]] = false;
      }
    }
    else {
      throw new Error('No tests to run.');
    }
  };
  this.setAssumedLocation = function () {
    assumedLocation = this.getActualLocation();
  };
  this.getActualLocation = function () {
    var win = this.getCurrentTestScope();
    return win.document.location.href;
  };
  this.showMsg = function (msg) {
    alert(msg);
  };
  this.getCurrentTestScope = function () {
    var win = this.runInTestWindowScope ?
      windmill.testWindow : window;
    return win;
  };
  this.lookupObjRef = function (objPathString) {
    var arr = objPathString.split('.');
    var win = this.getCurrentTestScope();
    var baseObj;
    var parseObjPath = function (name) {
      baseObj = !name ? win : baseObj[name];
      if (!baseObj) {
        var errMsg = 'Test "' + objPathString + '" does not exist.';;
        // The syntax-error possibility is only for browsers with
        // a broken eval (IE, Safari 2) -- the script-append hack
        // blindly sets the text of the script without checking syntax
        if (brokenEval) {
          errMsg += ' Either this object is not defined in' +
            ' any test file, or there is a syntax error in the file where it is defined.';
        }
        else {
          errMsg += ' This object is not defined in any test file.';
        }
        throw new Error(errMsg);
      }
      return arr.length ? parseObjPath(arr.shift()) : baseObj;
    };
    // call parseObjPath recursively to append each
    // property/key onto the window obj from the array
    // 'foo.bar.baz' => arr = ['foo', 'bar', 'baz']
    // baseObj = window['foo'] =>
    // baseObj = window['foo']['bar'] =>
    // baseObj = window['foo']['bar']['baz']
    return parseObjPath();
  };
  this.runNextTest = function () {
    var testName = '';
    var testFunc = null;
    if (this.testOrder.length == 0) {
      this.finish();
    }
    else {
      // If the window we're running tests in has
      // changed locations, reload all the test files
      // into the app scope
      if (assumedLocation != this.getActualLocation()) {
        var waitForIt = this.loadTestFiles();
        this.setAssumedLocation();
      }

      // Get the test name
      testName = this.testOrder.shift();
      testFunc = this.lookupObjRef(testName);
      // Tell IDE what is going on
      windmill.ui.results.writeStatus('Running '+ testName + '...');
      if (testFunc.length > 0) {
        this.testItemArray = { name: testName, funcs: testFunc }
        this.runTestItemArray();
      }
      else if (typeof testFunc == 'function' ||
        (document.all && testFunc.toString().indexOf('function') == 0)) {
        var success = this.runSingleTestFunction(testName, testFunc);
        if (success) {
          this.testOrderMappings[testName] = true;
        }
        this.runNextTest();
      }
    }
    return true;
  };
  this.runSingleTestFunction = function (testName, testFunc) {
    //Do some timing of test run
    this.currentTestName = testName;
    var timer = new windmill.TimeObj();
    timer.setName(testName);
    timer.startTime();
    this.currentJsTestTimer = timer;
    // Run the test
    try {
      // Actually executing the function object
      // -----------------------
      testFunc();
      // -----------------------
      this.currentJsTestTimer.endTime();
      // Write to the results tab in the IDE
      windmill.ui.results.writeResult("<br><b>Test:</b> " + testName +
        "<br>Test Result:" + true);
      // Send report for pass
      windmill.jsTest.sendJSReport(testName, true, null,
        this.currentJsTestTimer);
      return true;
    }
    // For each failure, create a TestFailure obj, add
    // to the failures list
    catch (e) {
      this.handleErr(e);
      return false;
    }
  };
  this.runTestItemArray = function () {
    var _this = this;
    var t = 0;
    // If the array of UI action objects is empty, go back
    // to the normal test loop -- get the next test, etc.
    if (this.testItemArray.funcs.length == 0) {
      this.testOrderMappings[this.testItemArray.name] = true;
      this.runNextTest();
    }
    else {
      // FIXME: Use try/catch here in case code this is pointing
      // to has gone bye-bye because of redirect in app window
      var item = this.testItemArray.funcs.shift();
      if (typeof item == 'undefined') {
        throw new Error('Test item in array-style test is undefined --' +
          ' likely a trailing comma separator has caused this.');
      }
      if (typeof item == 'function' ||
        (document.all && item.toString().indexOf('function') == 0)) {
        this.runSingleTestFunction(this.testItemArray.name, item);
      }
      else {
        // If the action is a sleep, set the sleep
        // wait interval for the setTimeout loop
        if (item.method == 'waits.sleep') {
          t = item.params.milliseconds;
        }
        //If the waits.forElement is called
        //We want to pause this loop and call it
        else if (item.method == 'waits.forElement'){
          var func = eval('windmill.jsTest.actions.' + item.method);
          //Add a parameter so we know the js framework
          //is calling the function inside waits.forElement
          item.params.orig = 'js';
          func(item.params);
          //Let the js test framework know that it's in a waiting state
          this.waiting = true;
        }
        else {
          // Get the UI action to execute
          var testActionFunc = eval('windmill.jsTest.actions.' + item.method);
          // CheX0r for any needed string replacements for {$*} shortcuts
          item.params = windmill.utilities.doShortcutStringReplacements(item.params);
          // Execute the UI action with the set params
          windmill.ui.results.writeStatus('Running '+ item.method + '...');
          testActionFunc(item.params);
          windmill.ui.results.writeResult("<br><b>Action:</b> " + item.method +
            "<br>Params: " + fleegix.json.serialize(item.params));
          if (this.testItemArray.name == 'setup') {

          };
        }
      }
      if (!this.waiting){
        var f = function () { _this.runTestItemArray.apply(_this); };
        setTimeout(f, t);
      }
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
  this.getFile = function (path) {
    var file = fleegix.xhr.doReq({ url: path,
	  async: false,
    preventCache: true });
    return file;
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
  // controller.waits, controller.asserts
  var names = ['', 'extensions','waits', 'asserts'];
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
