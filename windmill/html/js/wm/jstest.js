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
  var serverBasePath = '';
  var jsFilesBasePath = '';
  var loadedJSCodeFiles = {};
  var testFilter = '';
  var testPhases = '';
  var testListReverseMap = {};

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
      windmill.jsTest.sendJSReport('Evaling', false, null, new windmill.TimeObj());
      windmill.jsTest.teardown();
      
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
  function parseRelativePath(baseP, requireP) {
    if (!baseP || !requireP) {
      throw new Error(
        'parseRelativePath requires both a base path and require path.');
    }
    var basePath = baseP;
    var requirePath = requireP;
    while (requirePath.indexOf('../') == 0) {
      basePath = basePath.substring(0, basePath.lastIndexOf('/'));
      requirePath = requirePath.substr(3);
    }
    if (basePath == serverBasePath) {
      throw new Error('Relative path for required file "' +
        basePath + '" is not valid.');
    }
    var newAbsPath = basePath + '/' + requirePath;
    return newAbsPath.replace(jsFilesBasePath, '');
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
  this.waiting; // Used by waits.sleep waits.forElement
  this.testsPaused; // User settable

  // Initialize everything to starting vals
  this.init = function () {
    testFilter = '';
    testPhases = '';

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
    this.waiting = false;
  };
  // Main function to run a directory of JS tests
  this.run = function (paramObj) {
    this.actions.loadActions();
    this.init(); // Init props to default states
    this.doSetup(paramObj);
    this.loadTestFiles();
    this.getCompleteListOfTestNames();
    this.limitByFilterAndPhase();
    this.recordCurrentLocation();
    this.start();
  };
  this.start = function () {
    this.runNextTest();
  };
  this.finish = function () {
    this.testCount = this.testList.length;
    this.testFailureCount = this.testFailures.length;
    windmill.controller.commands.jsTestResults();
    this.teardown();
  };
  this.teardown = function(){
    //call the teardown
    var json_object = new json_call('1.1', 'teardown');
    var params_obj = [];
    json_object.params = params_obj;
    var json_string = fleegix.json.serialize(json_object);
    fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
  }
  this.doSetup = function (paramObj) {
    var testFiles = paramObj.files;
    var regIndex = null;
    var initIndex = null;

    testFilter = paramObj.filter || null;
    testPhases = paramObj.phase || null;

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
        windmill.jsTest.sendJSReport('Evaling', false, null, new windmill.TimeObj());
        windmill.jsTest.teardown();
        throw new Error('Non-js file in list of JavaScript test files.');
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
    serverBasePath = testFiles[0].split('/windmill-jstest/')[0];
    jsFilesBasePath = serverBasePath + '/windmill-jstest/';

    // Create a ref to the windmill object in the testing app
    windmill.testWindow.windmill = windmill;

    // Load the asserts into the test window scope
    // as the 'jum' object
    if (this.runInTestWindowScope) {
      windmill.testWindow.jum = windmill.controller.asserts;
    }

    loadedJSCodeFiles = {};
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
      var path = testFiles[i].replace(jsFilesBasePath, '');
      if (path.indexOf('initialize.js') > -1) {
        continue;
      }
      var waitForIt = this.require(path);
    }
    return true;
  };
  this.require = function (path) {
    var fileFullPath = jsFilesBasePath + path;
    if (typeof loadedJSCodeFiles[fileFullPath] == 'undefined') {
      var code = this.getFile(fileFullPath);
      // Append to aggregate source
      this.testScriptSrc += code + '\n';
      // Eval in window scope
      globalEval(fileFullPath, code, this.runInTestWindowScope);
      loadedJSCodeFiles[fileFullPath] = true;
    }
    return true;
  };
  this.parseTestNamespace = function (name) {
    var arr = [];
    var isTestable = function (o, n) {
      if (!o) {
        throw new Error('Object "' + n + '" is undefined or does not exist.');
      }
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
      return false;
    };
    var parseNamespaceObj = function(obj, namespace) {
      var re = /^test_/;
      var parseObj = obj;
      var doParse = function (parseItem, parseItemName) {
        // functions or arrays
          if (isTestable(parseItem, parseItemName)) {
            arr.push(namespace + '.' + parseItemName);
          }
          // Possible namespace objects -- look for more tests
          else {
            var n = namespace + '.' + parseItemName;
            parseNamespaceObj(parseItem, n);
          }
      };
      // Check for a setup or teardown -- note that you can't
      // just test to see if the property is undefined ...
      // The prop may exist on the object, but be undefined because
      // it points at something with an undefined value
      var hasSetup = false;
      var hasTeardown = false;
      for (var parseProp in parseObj) {
        if (parseProp == 'setup') {
          hasSetup = true;
        }
        if (parseProp == 'teardown') {
          hasTeardown = true;
        }
      }
      // Parse the setup if it exists
      if (hasSetup) {
        doParse(parseObj.setup, 'setup');
      }
      // Parse any properties named according to the "test_" convention
      for (var parseProp in parseObj) {
        var item = parseObj[parseProp];
        if (re.test(parseProp)) {
          doParse(item, parseProp);
        }
      }
      // Parse the teardown if it exists
      if (hasTeardown) {
        doParse(parseObj.teardown, 'teardown');
      }
    };
    var baseObj = this.lookupObjRef(name);
    if (!baseObj) {
      throw new Error('Test namespace "' + name +
        '" does not exist -- it is not defined in any of your test files.');
    }
    else {
      if (isTestable(baseObj, name)) {
        arr.push(name);
      }
      else {
        parseNamespaceObj(baseObj, name);
      }
    }

    this.testList = combineLists(this.testList, arr);
  };
  this.getCompleteListOfTestNames = function () {
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
    if (!n.length) {
      throw new Error('No tests or test namespaces to parse.');
    }
    for (var i = 0; i < n.length; i++) {
      this.parseTestNamespace(n[i]);
    }
    if (!this.testList.length) {
      throw new Error('No tests to run.');
    }
  };
  this.limitByFilterAndPhase = function () {
    if (testFilter || testPhases) {
      // Get a hash of the tests to run
      var limitedList = [];
      var testList = this.testList;

      // Make a reverse map of the test names, so we can
      // test for the existence of any given name
      for (var i = 0; i < testList.length; i++) {
        testListReverseMap[testList[i]] = false;
      }
      var inclSetupPhase = !!(testPhases && testPhases.indexOf('setup') > -1);
      var inclTestPhase = !!(testPhases && testPhases.indexOf('test') > -1);
      var inclTeardownPhase = !!(testPhases && testPhases.indexOf('teardown') > -1);

      // Filter on desired test/namespace, and limit to specified phases
      // for that test/namespace
      if (testFilter) {
        var isNamespace = (testFilter.indexOf('ns:') == 0);
        if (isNamespace) {
          testFilter = testFilter.replace('ns:', '');
          // FIXME: Make sure this namespace is valid
        }
        else {
          // Make sure the filtered-for test exists
          if (typeof testListReverseMap[testFilter] == 'undefined') {
            throw new Error('Filtered test "' + testFilter + '" does not exist.');
          }
        }
        // Split the namespace path into its components
        // We'll be looking at each link in the chain for setups/teardowns
        var pathArray = testFilter.split(/\./g);
        var objPath = '';
        // Setups
        if (!testPhases || inclSetupPhase) {
          // Parse down the namespace chain, looking for setups
          // For namespace filters, look all the way down the chain,
          // for tests, ignore the last item
          var limit = isNamespace ? pathArray.length : pathArray.length - 1;
          for (var i = 0; i < limit; i++) {
            objPath = pathArray[i] + '.setup';
            if (typeof testListReverseMap[objPath] != 'undefined') {
              limitedList.push(objPath);
            }
          }
        }
        // Actual tests
        if (!testPhases || inclTestPhase) {
          // Namespace filter -- add any non-setup, non-teardown items
          if (isNamespace) {
            var re = /\.setup$|\.teardown$/;
            for (var i = 0; i < testList.length; i++) {
              var testName = testList[i];
              if (testName.indexOf(testFilter) == 0 && !re.test(testName)) {
                limitedList.push(testName);
              }
            }
          }
          // Test name filter -- just add the single test
          else {
            limitedList.push(testFilter);
          }
        }
        // Teardowns
        if (!testPhases || inclTeardownPhase) {
          // Parse back up the namespace chain, looking for teardowns
          // For namespace filters, start at the very bottom of the chain,
          // for tests, ignore the bottom item
          var limit = isNamespace ? pathArray.length - 1 : pathArray.length - 2;
          for (var i = limit; i > -1; i--) {
            objPath = pathArray[i] + '.teardown';
            if (typeof testListReverseMap[objPath] != 'undefined') {
              limitedList.push(objPath);
            }
          }
        }
      }
      // No test filter, just limit to specified phases
      // FIXME: I don't think this option makes any logical sense
      else if (testPhases) {
        var setupRe = /\.setup$/;
        var teardownRe = /\.teardown$/;
        var testName;
        var keepTest;
        for (var i = 0; i < testList.length; i++) {
          testName = testList[i];
          keepTest = false;
          switch (true) {
            case (setupRe.test(testName) && inclSetupPhase):
              keepTest = true;
              break;
            case ((!setupRe.test(testName) && !teardownRe.test(testName)) && inclTestPhase):
              keepTest = true;
              break;
            case (teardownRe.test(testName) && inclTeardownPhase):
              keepTest = true;
              break;
          }
          if (keepTest) {
            limitedList.push(testName);
          }
        }
      }
      this.testList = limitedList;
    }
    // Clone the list
    this.testOrder = this.testList.slice();
  };
  this.recordCurrentLocation = function () {
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
    var _this = this;
    var testName = '';
    var testFunc = null;
    if (this.testsPaused) {
      setTimeout(runNextItemInArray, 1000);
      return false;
    }
    else if (this.testOrder.length == 0) {
      this.finish();
    }
    else {
      // If the window we're running tests in has
      // changed locations, reload all the test files
      // into the app scope
      if (assumedLocation != this.getActualLocation()) {
        var f = function () {
          var waitForIt = _this.loadTestFiles.apply(_this);
          _this.recordCurrentLocation.apply(_this);
          _this.runNextTest.apply(_this);
        };
        setTimeout(f, 2000);
        return false;
      }

      // Get the test name
      testName = this.testOrder.shift();
      testFunc = this.lookupObjRef(testName);
      // Tell IDE what is going on
      windmill.ui.results.writeStatus('Running '+ testName + '...');
      if (testFunc.length > 0) {
        this.testItemArray = {
          name: testName,
          count: testFunc.length,
          incr: 0 };
        this.runTestItemArray();
      }
      else if (typeof testFunc == 'function' ||
        (document.all && testFunc.toString().indexOf('function') == 0)) {
        var success = this.runSingleTestFunction(testName, testFunc);
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
    var runNextItemInArray = function () { _this.runTestItemArray.apply(_this); };
    var t = 0;
    if (this.testsPaused) {
      setTimeout(runNextItemInArray, 1000);
      return false;
    }
    // If the array of UI action objects is empty, go back
    // to the normal test loop -- get the next test, etc.
    else if (this.testItemArray.incr == this.testItemArray.count) {
      this.runNextTest();
    }
    else {
      // If the window we're running tests in has
      // changed locations, reload all the test files
      // into the app scope
      if (assumedLocation != this.getActualLocation()) {
        var f = function () {
          var waitForIt = _this.loadTestFiles.apply(_this);
          _this.recordCurrentLocation.apply(_this);
          _this.runTestItemArray.apply(_this);
        };
        setTimeout(f, 2000);
        return false;
      }
      // Look up the array-style test item by string path again
      // in case tests have reloaded due to window location change
      var testItemArray = this.lookupObjRef(this.testItemArray.name);
      // Get the next item in the array
      var item = testItemArray[this.testItemArray.incr];
      this.testItemArray.incr++;
      if (typeof item == 'undefined') {
        throw new Error('Test item in array-style test is undefined --' +
          ' likely a trailing comma separator has caused this.');
      }
      if (typeof item == 'function' ||
        (document.all && item.toString().indexOf('function') == 0)) {
        this.runSingleTestFunction(this.testItemArray.name, item);
          var action = {};
          action.method = 'function';
          action.params = '(JavaScript code is being executed)';
          var a = windmill.xhr.createActionFromSuite('jsTests', action);
          windmill.xhr.setActionBackground(a,true,action);
      }
      else {
        // If the action is a sleep, set the sleep
        // wait interval for the setTimeout loop
        if (item.method == 'waits.sleep') {
          t = item.params.milliseconds;
           //Build some UI
          var action = {};
          action.method = item.method;
          action.params = item.params;
          action.params.orig = 'js';

          var a = windmill.xhr.createActionFromSuite('jsTests', action);
          windmill.xhr.setWaitBgAndReport(a.id,true,action);
        }
        //If the waits.forElement is called
        //We want to pause this loop and call it
        else if (item.method == 'waits.forElement' ||
          item.method == 'waits.forTrue' ||
          item.method == 'waits.forNotElement'){
          var func = eval('windmill.jsTest.actions.' + item.method);
          //Add a parameter so we know the js framework
          //is calling the function inside waits.forElement
          item.params.orig = 'js';
          func(item.params, item);
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
        setTimeout(runNextItemInArray, t);
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
  this.pauseTests = function () {
    this.testsPaused = true;
  };
  this.resumeTests = function () {
    this.testsPaused = false;
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

      //Build some UI
       var action = {};
       if (name){ action.method = name+'.'+meth; }
       else { action.method = meth; }
       action.params = eval(args[0]);
       
       //var a = windmill.xhr.createActionFromSuite('jsTests', action);
       var buildUI = function(actionObj){
         var suite = windmill.ui.remote.getSuite("jsTests");
         var action = windmill.ui.remote.buildAction(actionObj.method, actionObj.params);
         suite.appendChild(action);
         $(action.id+"method").disabled = true;
         try {
           $(action.id+"locatorType").disabled = true;
           $(action.id+"locator").disabled = true;
         } catch(err){}
         try {
           $(action.id+"optionType").disabled = true;
           $(action.id+"option").disabled = true;
         } catch(err){}
         return action;
       }
       var a = buildUI(action);
       
       //Set the id in the IDE so we can manipulate it
       action.params.aid = a.id;

      //Run the action in the UI
      var result = namespace[meth].apply(namespace, args);
      //Set results, but not for waits, they do it themselves
      if (action.method.indexOf('waits') == -1){
        windmill.xhr.setActionBackground(a,result,action);
      }

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
