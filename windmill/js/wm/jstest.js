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
  this.testFiles = null;
  this.testOrder = null;
  this.testFailures = [];
  this.testCount = 0;
  this.testFailureCount = 0;

  // Initialize everything to starting vals
  this.init = function () {
    this.testFiles = null;
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
      this.testFiles = tests;
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
      return true;
  };
  // Called from the eval of initialize.js,
  // registers all the tests to be run, in order
  this.registerTests = function (arr) {
    this.testOrder = arr;
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
      window.eval.apply(window, [str]);
    }
    return true;
  };
  this.runTests = function () {
    var order = this.testOrder;
    var arr = null; // parseTestName recurses through this
    var p = null; // Appended to by parseTestName
    var testName = '';
    var testFunc = null;
    var parseTestName = function (n) {
      p = !n ? window : p[n];
      return arr.length ? parseTestName(arr.shift()) : p;
    };
    for (var i = 0; i < order.length; i++) {
      // Get the test name
      testName = order[i];
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
      //Tell IDE what is going on
      windmill.ui.results.writeStatus('Running '+ testName + '...');
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
        windmill.ui.results.writeResult("<br>Test: <b>" + testName + "<br>Test Result:" + true);
        //send report for pass
        windmill.jsTest.sendJSReport(testName, true, null,jsTestTimer);
      }
      // For each failure, create a TestFailure obj, add
      // to the failures list
      catch (e) {
        jsTestTimer.endTime();
        windmill.ui.results.writeResult("<br>Test: <b>" + testName + "<br>Test Result:" + false + '<br>Error: '+ e);     
        windmill.jsTest.sendJSReport(testName, false, e, jsTestTimer);
        
        var fail = new windmill.jsTest.TestFailure(testName, e);
        this.testFailures.push(fail);
      }
      // Clean up after ourselves
      delete testFunc;
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
    
//Send the report
windmill.jsTest.sendJSReport = function(testname, result, error, timer){
    var reportHandler = function(str){
      response = eval('(' + str + ')');
      if (!response.result == 200){ windmill.ui.results.writeResult('Error: Report receiving non 200 response.'); }
    }
    var result_string = fleegix.json.serialize(windmill.xhr.xhrResponse.result)
    var test_obj = {"result":result,"starttime":timer.getStart(),"endtime":timer.getEnd(),"debug":testName+','+error };
    var json_object = new windmill.xhr.json_call('1.1', 'report_without_resolve');
    json_object.params = test_obj;
    var json_string = fleegix.json.serialize(json_object);
   
    //Actually send the report
    fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', json_string);
};

//Controller wrapper, allowing the javascript tests
//to drive the UI and report back correctly
//Ex: windmill.jsTest.cw('click', {"link": "Sign up."});
windmill.jsTest.cw = function(method, params){
  //We want to time how long this takes
  var cwTimer = new TimeObj();
  cwTimer.setName(method);
  cwTimer.startTime();
  //Run the action in the UI
  var result = windmill.controller[method](params);
  //End the timer
  cwTimer.endTime();
  //Send a report to the backend
  windmill.jsTest.sendJSReport(method, result, null, cwTimer);
  //Continue on with the test running
  return;
};
