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

  var _this = this;
  // Private vars
  var _UNDEF; // Undefined val
  var _OBJ_LOOKUP_RETRY_LIMIT = 10;

  var _debug = false;
  var _currentTestTimer;
  var _testsPaused = false;
  var _brokenEval;
  var _objLookupRetries = 0;
  var _testItemArrayObj;
  var serverBasePath = '';
  var jsFilesBasePath = '';
  var loadedJSCodeFiles = {};
  var testFilter = '';
  var testPhases = '';
  var testListReverseMap = {};
  var _ieDebugger;
  var _timerCode =
    '      windmill.jsTest.Timer = function () {' +
    '        this.startTime = null;' +
    '        this.endTime = null;' +
    '        this.time = null;' +
    '        this.start = function () {' +
    '          this.startTime = new Date().getTime();' +
    '        };' +
    '        this.finish = function () {' +
    '          this.endTime = new Date().getTime();' +
    '          this.time = this.endTime - this.startTime;' +
    '        };' +
    '      };';

  var _log = function (s) {
    if (_debug) {
      if (document.all) {
        if (!_ieDebugger) {
          _ieDebugger = window.open();
        }
        _ieDebugger.document.body.innerHTML += s + '<br/>';
      }
      else if (console && console.log) {
        console.log(s);
      }
    }
  };
  var _isTestNamespace = function (o, n) {
    if (!o) {
      throw new Error('Object "' + n + '" is undefined or does not exist.');
    }
    // Anything with test_, or setup/teardown
    for (var p in o) {
      if (/^test_/.test(p)) {
        return true;
      }
      if (typeof o.setup != 'undefined') {
        return true;
      }
      if (typeof o.teardown != 'undefined') {
        return true;
      }
    }
    // Nothing to indicate it's a test namespace
    return false;
  };
  var _testables = {
    ARR: 'array',
    FUNC: 'function',
    OBJ: 'object'
  };
  var _getTestableType = function (item) {
    var testableType;
    switch (true) {
      // Arrays
      case item instanceof Array:
      case typeof item.push == 'function':
        testableType = _testables.ARR;
        break;
      // Functions
      case typeof item == 'function':
      case item.toString().indexOf('function') == 0:
        testableType = _testables.FUNC;
        break;
      // Generic objects
      default:
        testableType = _testables.OBJ;
        break;
    }
    // This is a bandaid for the way IE loses type
    // and other info about an object between window
    // boundaries
    // This specific fix is for arrays -- type is
    // reported simply as 'object', both 'length' and
    // 'push' properties have values of undefined, but
    // there are still attributes indexed by number,
    // e.g., item[0]
    // Have to squelch errors because doing this test
    // on generic objects throws
    //if (fleegix.isIE) {
      try {
        if (typeof item[0] != 'undefined') {
          testableType = _testables.ARR;
        }
      }
      // Squelch, throws on plain object
      catch (e) {}
      //}
    return testableType;
  };

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
    var win = testWin ? windmill.testWin() : window;
    // Do we have a working eval?
    if (typeof _brokenEval == 'undefined') {
      window.eval.call(window, 'var __EVAL_TEST__ = true;');
      if (typeof window.__EVAL_TEST__ != 'boolean') {
        _brokenEval = true;
      }
      else {
        _brokenEval = false;
        delete window.__EVAL_TEST__;
      }
    }
    
    // Try to eval the code
    try {
      if (_brokenEval || windmill.scriptAppendOnly === true) {
        appendScriptTag(win, code);
      } else {
        win.eval.call(win, code);
      }
    }
    // Pass along syntax errors
    catch (e) {
      _this.sendJSReport('(Eval of test code)', false, e, new windmill.TimeObj());
      _this.teardown();
      // If the browser stays open, throw
      var err = new Error("Error in eval of code in file '" +
        path + "' (" + e.message + ")");
      err.name = e.name;
      err.stack = e.stack;
      throw err;
    }
  }
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
    while (requirePath.indexOf('../') === 0) {
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

  // FIXME: Init these to some sort of meaningful values
  this.testFiles = _UNDEF;
  this.testScriptSrc = _UNDEF;
  this.regFile = _UNDEF;
  this.topLevelTestables = _UNDEF;
  this.registeredTestables = _UNDEF;
  this.runRegisteredTestsOnly = false;
  this.testList = _UNDEF;
  this.testOrder = _UNDEF;
  this.testFailures = _UNDEF;
  this.testCount = _UNDEF;
  this.testFailureCount = _UNDEF;
  this.runInTestWindowScope = _UNDEF;
  this.jsSuiteSummary = _UNDEF;
  this.waiting = _UNDEF; // Used by waits.sleep waits.forElement
  this.completedCallback = null;
  this.testCodeStates = {
    // Test window is loaded and test code has been
    // injected -- ready to run tests
    LOADED: 'loaded',
    // Test window has unloaded -- we're waiting for the
    // page to come back so we can re-inject the test code
    CANNOT_LOAD: 'cannot_load',
    // Test window is back, and we need to re-inject the
    // test code before we can run any more JS tests
    NOT_LOADED: 'not_loaded'
  };
  this.testCodeState = this.testCodeStates.NOT_LOADED;

  // Initialize everything to starting vals
  this.init = function () {
    testFilter = '';
    testPhases = '';
    _testItemArrayObj = null;

    this.testFiles = null;
    this.testScriptSrc = '';
    this.regFile = false;
    this.topLevelTestables = [];
    this.registeredTestables = {};
    this.runRegisteredTestsOnly = false;
    this.testList = [];
    this.testOrder = null;
    this.testFailures = [];
    this.testCount = 0;
    this.testFailureCount = 0;
    this.runInTestWindowScope = true;
    this.waiting = false;

    //Tell the JS test not to output all the extra stuff
    windmill.chatty = false;
    //clean up output tab for test run
    $('resOut').innerHTML = "";
    //Select the output tab
    jQuery('#tabs').tabs("select", 1);
  };
  // Main function to run a directory of JS tests
  this.run = function (paramObj) {
    var testFiles = paramObj.files;
    if (!testFiles.length) {
      var msg = 'No JavaScript tests to run.';
      this.sendJSReport('(No test files)', false, new Error(msg),
        new TimeObj());
      this.teardown();
      throw new Error();
    }
    else {
      this.startTestTiming();
      this.actions.loadActions();
      this.init(); // Init props to default states
      this.doSetup(paramObj);
      this.loadTestFiles();
      this.getCompleteListOfTestNames();
      this.limitByFilterAndPhase();
      this.start();
    }
  };
  this.start = function () {
    this.runNextTest();
  };
  this.finish = function () {
    this.testCount = this.testList.length;
    this.testFailureCount = this.testFailures.length;
    //windmill.controller.commands.jsTestResults();
    this.endTestTiming();
    this.reportResults();
    // Invoke the callback -- this continues the normal
    // controller loop
    if (typeof this.completedCallback == 'function') {
      this.completedCallback();
    }
    this.teardown(true);
  };
  this.teardown = function (c){
    // Build testResults
    var completed = c || false;
    var summary = this.jsSuiteSummary;
    var startTime = summary.getStart();
    var endTime = summary.getEnd() || null;
    var testCount = this.testCount || 0;
    var testFailureCount = this.testFailureCount || 0;
    var testResults = {
      'completed': completed,
      'startime': startTime,
      'endtime': endTime,
      'testCount': testCount,
      'testFailureCount': testFailureCount
    };
    //create a testResults entry for each test we ran, default result to true
    var tests = this.testList;
    for (var i = 0; i < tests.length - 1; i++){
      testResults[tests[i]] = { result: true };
    }
    //iterate all the failures and update the testResults to reflect that
    var fails = this.testFailures;
    for (var x = 0; x < fails.length-1; x++) {
      testResults[fails[x].message] = fails[x].error;
      testResults[fails[x].message].result = false;
    }
    _this.testResults = testResults;

    var jsonObj = new jsonCall('1.1', 'teardown');
    jsonObj.params = { tests: testResults };
    var jsonStr = JSON.stringify(jsonObj);
    fleegix.xhr.doPost('/windmill-jsonrpc/', jsonStr);
  };

  this.doSetup = function (paramObj) {
    var testFiles = paramObj.files;
    var regIndex = null;
    var initIndex = null;

    testFilter = paramObj.filter || null;
    testPhases = paramObj.phase || null;

    // Remove any directories or non-js files returned
    var t;
    for (var i = 0; i < testFiles.length; i++) {
      t = testFiles[i];
      if (t.indexOf('\.js') == -1) {
        _this.sendJSReport('(Loading of test code)', false, null, new windmill.TimeObj());
        _this.teardown();
        throw new Error('Non-js file in list of JavaScript test files.');
      }
    }
    // Test files include any initialize.js environ setup
    // files in the directories
    this.testFiles = testFiles;
    return true;
  };
  this.register = function () {
    var nameArray;
    var args = arguments;
    // Tests names passed in as an array
    if (typeof args[0].push != 'undefined') {
      nameArray = args[0];
    }
    // Single test name as a string
    else {
      nameArray = args;
    }
    if (!nameArray[0]) {
      throw new Error('jsTest.register requires at least one test name.');
    }
    var key;
    for (var i = 0; i < nameArray.length; i++) {
      key = nameArray[i];
      _this.registeredTestables[key] = true;
    }
  };
  // Grab the contents of the test files, and eval
  // them in window scope
  this.loadTestFiles = function () {
    _log('loadTestFiles called.');
    var testFiles = this.testFiles;
    serverBasePath = testFiles[0].split('/windmill-jstest/')[0];
    jsFilesBasePath = serverBasePath + '/windmill-jstest/';

    // Create a ref to the windmill object in the testing app
    windmill.testWin().windmill = windmill;
    // Load the asserts into the test window scope
    // as the 'jum' object
    windmill.testWin().jum = windmill.controller.asserts;
    // Create the timer object down in the test
    // window using global eval so IE can
    // recognize it as a function
    globalEval('<private var _timerCode string value>', _timerCode, true);

    loadedJSCodeFiles = {};
    // The aggregated source code for the tests
    this.testScriptSrc = '';
    var path;
    // Eval any init files first
    for (var i = 0; i < testFiles.length; i++) {
      path = testFiles[i];
      if (path.indexOf('/initialize.js') == -1) {
        continue;
      }
      var str = this.getFile(path);
      // Eval in window scope
      globalEval(path, str, this.runInTestWindowScope);
    }
    // Then eval the test files
    for (var i = 0; i < testFiles.length; i++) {
      path = testFiles[i].replace(jsFilesBasePath, '');
      if (path.indexOf('initialize.js') > -1) {
        continue;
      }
      var waitForIt = this.require(path);
    }
    this.setTestCodeState(this.testCodeStates.LOADED);
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
    var parseNamespaceObj = function(obj, namespace) {
      var parseObj = obj;
      var doParse = function (parseItem, parseItemName) {
        if (_isTestNamespace(parseItem, parseItemName)) {
          var n = namespace + '.' + parseItemName;
          parseNamespaceObj(parseItem, n);
        }
        else {
          arr.push(namespace + '.' + parseItemName);
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
        if (/^test_/.test(parseProp)) {
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
      if (_isTestNamespace(baseObj, name)) {
        parseNamespaceObj(baseObj, name);
      }
      else {
        arr.push(name);
      }
    }
    this.testList = combineLists(this.testList, arr);
  };
  // Have to get the initial list of testables on the base window
  // using source-code parsing, because we may need to run them
  // in a different order from which they have been added to the
  // window object
  this.getCompleteListOfTestNames = function () {
    var win = this.getCurrentTestScope();
    var topLevel = this.topLevelTestables;
    var registered = this.registeredTestables;
    // Start off with any explicitly registered testables
    for (var p in registered) {
      topLevel.push(p);
    }
    if (!this.runRegisteredTestsOnly) {
      var re;
      // Ignore anything in multiline comments
      // Simplified version of original regex from unitedscripters.com
      re = /\/\*(.|\n)*?\*\//g;
      var code = this.testScriptSrc.replace(re, '');
      // Find any symbol with name staring with "test_"
      // in the top-level window scope
      // This will ignore anything in a one-line //-style comment
      re = /(^var\s+|^function\s+)(test_[^\s(]+)/gm;
      var testName;
      while (m = re.exec(code)) {
        testName = m[2];
        // Don't re-add any testables that have already been
        // added via registration
        if (typeof registered[testName] == 'undefined') {
          topLevel.push(testName);
        }
      }
      // Prepend setup, append teardown if these exist on the base
      // window
      if (win.setup) {
        topLevel.unshift('setup');
      }
      if (win.teardown) {
        topLevel.push('teardown');
      }
    }
    // Okay, make sure we have some top-level testables to parse
    if (!topLevel.length) {
      throw new Error('No tests or test namespaces to parse.');
    }
    // Parse each of the top-level testables to populate the
    // testList property with the ordered hierarchy of test names
    for (var i = 0; i < topLevel.length; i++) {
      this.parseTestNamespace(topLevel[i]);
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
      var re;

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
        var objBasePath = '';
        var objPath = '';
        var limit;
        // Setups
        if (!testPhases || inclSetupPhase) {
          // Parse down the namespace chain, looking for setups
          // For namespace filters, look all the way down the chain,
          // for tests, ignore the last item
          // FIXME: It would be much faster to reparse the objs
          // rather than scanning through the entire list of tests
          // like this
          limit = pathArray.length - 1; if (isNamespace) { limit++ }
          for (var i = 1; i < limit; i++) {
            objBasePath = pathArray.slice(0, i).join('.');
            objPath = objBasePath + '.setup';
            for (var j = 0; j < testList.length; j++) {
              var testName = testList[j];
              if (testName.indexOf(objPath) == 0) {
                limitedList.push(testName);
              }
            }
          }
        }
        // Actual tests
        if (!testPhases || inclTestPhase) {
          // Namespace filter -- add any non-setup, non-teardown items
          if (isNamespace) {
            for (var i = 0; i < testList.length; i++) {
              var testName = testList[i];
              if (testName.indexOf(testFilter) == 0) {
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
          // FIXME: It would be much faster to reparse the objs
          // rather than scanning through the entire list of tests
          // like this
          limit = pathArray.length - 2; if (isNamespace) { limit++ }
          //limit = isNamespace ? pathArray.length - 1 : pathArray.length - 2;
          for (var i = limit; i > 0; i--) {
            //objPath = pathArray[i] + '.teardown';
            objBasePath = pathArray.slice(0, i).join('.');
            objPath = objBasePath + '.teardown';
            for (var j = 0; j < testList.length; j++) {
              var testName = testList[j];
              if (testName.indexOf(objPath) == 0) {
                limitedList.push(testName);
              }
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
  this.getActualLocation = function () {
    var win = this.getCurrentTestScope();
    return win.document.location.href;
  };
  this.showMsg = function (msg) {
    alert(msg);
  };
  this.getCurrentTestScope = function () {
    var win = this.runInTestWindowScope ?
      windmill.testWin() : window;
    return win;
  };
  this.lookupObjRef = function (objPathString) {
    var arr = objPathString.split('.');
    var win = this.getCurrentTestScope();
    var baseObj;
    var parseObjPath = function (name) {
      baseObj = !name ? win : baseObj[name];
      if (!baseObj) {
        var errMsg = 'Test "' + objPathString + '" does not exist.';
        // The syntax-error possibility is only for browsers with
        // a broken eval (IE, Safari 2) -- the script-append hack
        // blindly sets the text of the script without checking syntax
        if (_brokenEval) {
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
  this.setTestCodeState = function (state) {
    _log('testCodeState set to ' + state);
    this.testCodeState = state;
    return true;
  }
  this.verifyTestWindowState = function (callback) {
    _log('checking window state ...');
    var ret = true;
    _log('testCodeState is ' + this.testCodeState);
    if (this.testCodeState == this.testCodeStates.NOT_LOADED) {
      var f = function () {
        _log('loading test files ...');
        var waitForIt = _this.loadTestFiles.call(_this);
        _log('loaded test files.');
        callback.call(_this);
      };
      setTimeout(f, 2000);
      ret = false;
    }
    else if (this.testCodeState == this.testCodeStates.CANNOT_LOAD) {
      var f = function () {
        callback.call(_this);
      };
      setTimeout(f, 2000);
      ret = false;
    }
    return ret;
  };
  // Delegate to a method called on a setTimeout to give the
  // UI thread time to fire onbeforeunload event when leaving
  // the current page, and set the testCodeState to CANNOT_LOAD
  // Without this, the test engine can end up trying to run
  // the next test before it notices the test code on the page
  // has been unloaded
  this.runNextTest = function (retryTestName) {
    timeout = !!retryTestName ? 1000 : 0;
    setTimeout(function () {
        _this.runNextTestFreeUiThread.call(_this, retryTestName); },
            timeout);
  };
  this.runNextTestFreeUiThread = function (retryTestName) {
    _log('Starting runNextTest.');
    var testName = '';
    var testItem = null;
    if (_testsPaused || this.waiting) {
      _log('Tests paused, looping ...');
      setTimeout(function () { _this.runNextTest.call(_this); }, 1000);
      return false;
    }
    else if (this.testOrder.length == 0) {
      _log('Finished running tests');
      this.finish();
    }
    else {
      // If the window we're running tests in has
      // changed locations, reload all the test files
      // into the app scope
      if (!this.verifyTestWindowState(this.runNextTest)) {
        _log('Test code not loaded, looping ...');
        return false;
      }
      // Get the test name
      testName = retryTestName || this.testOrder.shift();

      // Test-run timing
      var timer = new windmill.TimeObj();
      timer.setName(testName);
      timer.startTime();
      _currentTestTimer = timer;

      try {
        // Need to separate scope and executable in cases
        // where testable is an executable function because
        // waits occur in a setTimeout loop that breaks scope
        // -----------
        // Namespaced testables
        if (testName.indexOf('.') > -1) {
          var testNameArr = testName.split('.');
          var testNameKey = testNameArr.pop();
          var testScope = testNameArr.join('.');
          testScope = this.lookupObjRef(testScope);
          testItem = testScope[testNameKey];
        }
        // Top-level, global-named testables
        else {
          testScope = this.getCurrentTestScope();
          testItem = this.lookupObjRef(testName);
        }
      }
      catch (e) {
        if (_objLookupRetries > _OBJ_LOOKUP_RETRY_LIMIT) {
          _objLookupRetries = 0;
          throw (e);
        }
        else {
          _objLookupRetries++;
          // Smart backoff for retries -- use the cube of
          // the retry number for an expanding retry window
          var delay = Math.pow(_objLookupRetries, 3) * 10;
          var retryFunc = function () {
              _this.runNextTest.call(_this, testName); }
          setTimeout(retryFunc, delay);
          return;
        }
      }
      _objLookupRetries = 0;

      // Tell IDE what is going on -- if the string is really
      // long and namespaced, just use the functions name
      var testNameArr = testName.split(".");
      windmill.stat('Running '+ testNameArr[testNameArr.length - 1] + '...');

      _log('Running test: ' + testName);

      if (!_isTestNamespace(testItem)) {
        var testType = _getTestableType(testItem);
        //_log('typeof testItem.length: ' + typeof testItem.length);
        _log('testItem.toString(): ' + testItem.toString());
        _log('testType: ' + testType);
        // Array-style tests -- array of UI actions or anon functions
        if (testType == _testables.ARR) {
          _log('testItem.length: ' + testItem.length);
          if (testItem.length > 0) {
            _log('Running array-style test: ' + testName);
            _testItemArrayObj = {
              name: testName,
              count: testItem.length,
              incr: 0,
              currentDelay: 0
            };
            this.runTestItemArray();
          }
          else {
            // Allow empty stubs
            _log('Empty stub array test.');
          }
        }
        // Normal test functions
        else if (testType == _testables.FUNC) {
          _log('Running test function: ' + testName);
          this.runSingleTestFunction(testName, testItem, testScope);
        }
        // API controller actions, waits, asserts, etc.
        else {
          _log('Running API controller action: ' + testName);
          this.runSingleTestAction(testName, testItem);
        }
      }
    }
    return true;
  };
  this.runSingleTestFunction = function (testName, testFunc,
    testScope, arrayIndex) {
    _log('Calling runSingleTestFunction for ' + testName);
    var success = false;
    // Run the test
    try {
      // Actually executing the function object
      // -----------------------
      if (testScope) {
        testFunc.call(testScope);
      }
      else {
        testFunc();
      }
      // Success for array-style tests reported in aggregate
      if (typeof arrayIndex == 'undefined') {
        this.handleSuccess(testName);
      }
      success = true;
    }
    // For each failure, create a TestFailure obj, add
    // to the failures list
    catch (e) {
      this.handleErr(e, testName);
    }
    // Array-style -- return control to the array loop
    if (typeof arrayIndex!= 'undefined') {
      return success;
    }
    // Single action -- run the next test
    else {
      _log('Calling runNextTest from runSingleTestFunction');
      this.runNextTest();
    }
  };
  this.runSingleTestAction = function (tests, item, incr) {
    var testName = typeof incr != 'undefined' ?
      tests.name : tests;
    _log('Calling runSingleTestAction for ' + testName);
    var success = false;
    // Add a parameter so we know the js framework
    // is the source so it knows to kick execution back
    item.params.origin = 'js';
    item.params.testName = testName;
    // Sleep
    if (item.method == 'waits.sleep') {
      // Array-style -- set the ms for the array loop to
      // use in the setTimeout
      if (typeof incr != 'undefined') {
        tests.currentDelay = item.params.milliseconds;
      }
      // Single UI action -- do the wait inline right here
      else {
        setTimeout(function () { _this.runNextTest.call(_this); },
          item.params.milliseconds);
      }
      return true;
    }
    // Public waits methods, not including sleep --
    // these execute in a setTimemout loop over in the waits
    // namespace, so we need both a local try/catch loop
    // here, and one over there to restart test execution
    // after a failure.
    // The failure handling over in waits needs to handle
    // both timeouts and execution failures
    else if (item.method.indexOf('waits.') > -1 &&
        item.method.indexOf('waits._') == -1 &&
        item.method != 'waits.sleep') {
      var localErr = false;
      var meth = item.method.replace('waits.', '');
      var func = _this.actions.waits[meth];
      // Callback so the controller can returns control
      // either to the array-test loop, or the normal test loop
      item.params.loopCallback = typeof incr != 'undefined' ?
        this.runTestItemArray : this.runNextTest;
      // This try/catch is for errors like the
      // method being incorrect/not-existing. Errors
      // like that in this execution scope need to be
      // handled here, and we need to make sure execution
      // continues -- see the localErr below
      try {
        if (typeof func == 'function') {
          func(item.params, item);
          // Let the js test framework know that it's in
          // a waiting state
          this.waiting = true;
          success = true;
        }
        else {
          throw new Error('"' + item.method +
            '" is not a valid API controller method.');
        }
      }
      catch (e) {
        this.handleErr(e, testName);
        success = false;
        localErr = true;
        this.waiting = false;
      }
      // Array-style -- return control to the array loop
      if (typeof incr != 'undefined') {
        return success;
      }
      else {
        // On success, do nothing
        // No need to run the next test -- the WM controller
        // will do that by calling the looopCallback set
        // above when the wait completes successfully or times out
        // // ---
        // On error, run the next test
        if (localErr) {
          this.runNextTest();
        }
      }
    }
    // UI actions -- these happen synchronously, so the local
    // try/catch handles all errors fine
    else {
      // Get the UI action to execute
      var testActionMethod = eval('windmill.jsTest.actions.' + item.method);
      // CheX0r for any needed string replacements for {$*} shortcuts
      item.params = windmill.utilities.doShortcutStringReplacements(item.params);
      // Execute the UI action with the set params
      windmill.stat('Running '+ item.method + '...');
      try {
        if (typeof testActionMethod == 'function') {
          testActionMethod(item.params);
          success = true;
          // Success for array-style tests reported in aggregate
          if (typeof incr == 'undefined') {
            this.handleSuccess(testName);
          }
        }
        else {
          throw new Error('"' + item.method +
            '" is not a valid API controller method.');
        }
      }
      catch (e) {
        // Use local var _this here for handleErr, because
        // testActionMethod function obj above is called inside
        // a function created by wrapperMethodBuilder that makes
        // executable functions for each of the UI actions.
        _this.handleErr(e, testName);
        success = false;
      }
      // Array-style -- return control to the array loop
      if (typeof incr != 'undefined') {
        return success;
      }
      // Single action -- error or not, run the next test
      else {
        _log('Calling runNextTest from runSingleTestAction');
        this.runNextTest();
      }
    }
  };
  this.waitsCallback = function (testName, e) {
    this.waiting = false;
    // Get a ref to array-based tests, if that's
    // what we have
    var tests = _testItemArrayObj;
    // Errors -- either timeout or execution error
    // report the error and abort, run next test
    if (e) {
      this.handleErr(e, testName);
      this.runNextTest();
    }
    // Success
    else {
      // If we're in the middle of some array-style tests
      // pass control back to the array-test loop
      if (tests && (tests.incr != tests.count)) {
        this.runTestItemArray();
      }
      // If this was a freestanding test, or the array-style
      // test is done, empty the storage of the array-test
      // report success, and run the next test
      else {
        _testItemArrayObj = null;
        this.handleSuccess(testName);
        this.runNextTest();
      }
    }
  };
  this.runTestItemArray = function () {
    var tests = _testItemArrayObj;
    var success = false;
    var runNextItemInArray = function () { _this.runTestItemArray.apply(_this); };
    _log('Calling runTestItemArray for ' + tests.name);

    tests.currentDelay = 0; // Reset the loop delay

    if (_testsPaused) {
      setTimeout(runNextItemInArray, 1000);
      return false;
    }
    // If the array of UI action objects is empty, go back
    // to the normal test loop -- get the next test, etc.
    else if (tests.incr == tests.count) {
      _testItemArrayObj = null;
      this.handleSuccess(tests.name);
      this.runNextTest();
    }
    else {
      // If the window we're running tests in has
      // changed locations, reload all the test files
      // into the app scope
      if (!this.verifyTestWindowState(this.runTestItemArray)) {
        return false;
      }
      // Look up the next array-style test item using string path
      // each time in case tests have reloaded due to
      // window location change
      var item = this.lookupObjRef(tests.name)[tests.incr];

      if (typeof item == 'undefined') {
        throw new Error('Test item in array-style test is undefined --' +
          ' likely a trailing comma separator has caused this.');
      }
      // Anonymous functions -- run like a freestanding single test
      else if (typeof item == 'function' ||
        (document.all && item.toString().indexOf('function') == 0)) {
        // Errors are caught, and failures are reported, above
        // in runSingleTestFunction, where the error object is available
        // 'success' of false stops further execution of this
        // array of tests
        success = this.runSingleTestFunction(tests.name, item, null, tests.incr);
      }
      // Sleeps, waits, UI actions
      else {
        success = this.runSingleTestAction(tests, item, tests.incr);
      }

      // Increment the counter to get the next item
      tests.incr++;

      // No errors running the current test-array item
      // either loop until wait/sleep is done, or run the
      // next item in the array
      if (success) {
        // Run the next item in the test array
        if (!this.waiting){
          setTimeout(runNextItemInArray, tests.currentDelay);
        }
      }
      // There was an error in the current test-array item
      // abort the entire array and go to the next test
      else {
        this.runNextTest();
      }
    }
  };
  this.handleErr = function (e, testName) {
    _log('this.handleErr executing ...');
    _currentTestTimer.endTime();
    var fail = new _this.TestFailure(testName, e);
    windmill.actOut(testName, {}, false);
        _this.sendJSReport(testName, false, e, _currentTestTimer);
    this.testFailures.push(fail);
  };
  this.handleSuccess = function (testName) {
    _currentTestTimer.endTime();
    if (windmill.chatty){
    windmill.out("<b>Test:</b> " + testName +
      "<br>Test Result: <font color=\"#61d91f\"><b>" + true + "</b></font>");
    }
    windmill.actOut(testName, {}, true);
    _currentTestTimer.write();
    _this.sendJSReport(testName, true, null, _currentTestTimer);
  };
  this.getFile = function (path) {
    var file = fleegix.xhr.doReq({ url: path,
	  async: false,
    preventCache: true });
    return file;
  };
  this.pauseTests = function () {
    _testsPaused = true;
  };
  this.resumeTests = function () {
    _testsPaused = false;
  };
  this.startTestTiming = function () {
    var summary = new TimeObj();
    summary.setName('jsSummary');
    summary.startTime();
    this.jsSuiteSummary = summary;
  };
  this.endTestTiming = function () {
    this.jsSuiteSummary.endTime();
  };
  this.reportResults = function () {
    var s = '';
    s += '<div><strong>Number of tests run: ' +
      this.testCount + '</strong></div>';
    s += '<div><strong>Number of failures: ' +
      this.testFailureCount + '</strong></div>';
    if (this.testFailureCount > 0) {
      s += '<div style="font-size: 90%;">';
      s += '<div>Failures ...</div>';
      var fails = this.testFailures;
      for (var i = 0; i < fails.length; i++) {
        var fail = fails[i];
        var msg = fail.shortMessage;
        // Escape angle brackets for display in HTML
        msg = msg.replace(/</g, '&lt;');
        msg = msg.replace(/>/g, '&gt;');
        s += '<div><span style="font-weight: bold; color: #666;">' +
          fail.testName + '</span>: ' + msg + '</div>';
      }
      s += '</div>';
    }
    windmill.out(s);
  };
};

windmill.jsTest.TestFailure = function (testName, errObj) {
  // Failure message will contain:
  // 1. Name of the test, 2. Optional error comment from
  // the failed assert, and 3. Error message from the
  // failed assert
  function getShortMessage() {
    var msg = '';
    msg += errObj.comment ? '(' + errObj.comment + ') ' : '';
    msg += errObj.message;
    return msg;
  }
  this.testName = testName;
  this.shortMessage = getShortMessage() || '';
  this.message = testName + ': ' + this.shortMessage;
  this.error = errObj;
};

//Send the report
windmill.jsTest.sendJSReport = function (testName, result, error, timer) {
  var reportHandler = function (str) {
    response = eval('(' + str + ')');
    if (!response.result || response.result != 200) {
      windmill.err('Error: Report receiving non 200 response.');
    }
  };
  var jsonObj = new jsonCall('1.1', 'report_without_resolve');
  var jsonStr = '';
  var uuid = new Date().getTime();
  var debug;
  if (windmill.chatty) {
    debug = error || null
  }
  else {
    debug = (error && error.message) ? error.message : null;
  }
  jsonObj.params = {
    "suite_name": testName,
    "result": !!result,
    "starttime": timer.getStart(),
    "endtime": timer.getEnd(),
    "uuid": uuid,
    "debug": debug
  };
  jsonStr = JSON.stringify(jsonObj);
  fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', jsonStr);
};

windmill.jsTest.actions = {};
// Extensions load last -- wait until everything has
// loaded before building all the wrapper methods
windmill.jsTest.actions.loadActions = function () {
  var wrapperMethodBuilder = function (name, meth) {
    var namespace = name ? windmill.controller[name] : windmill.controller;
    return function () {
      // Run the action in the UI -- no need for try/catch here,
      // as this function object gets called inside a try/catch
      // in the controller action test execution code
      if (typeof namespace[meth] == 'undefined') {
        throw new Error('No test name, method: ' + meth);
      }
      namespace[meth].apply(namespace, arguments);
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

fleegix.event.listen(window.document.body, 'onload', windmill.jsTest.actions, 'loadActions');

// Alias for use in test actions
var wm = windmill.jsTest.actions;
