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

/*******************************************************************************************************
/* Commands namespace functions, mostly system specific for the server to interact with the client
/******************************************************************************************************/
 
//Create multiple variables with one function call
//When we load the test suites we want to fill the registry
//with variables to make the tests cleaner when it comes to
//js paths and random vars, currently delimited by |'s
windmill.controller.commands.createVariables = function(paramObject){
  for (var i = 0;i<paramObject.variables.length;i++){
    windmill.varRegistry.addItem('{$'+paramObject.variables[i].split('|')[0] +'}',paramObject.variables[i].split('|')[1]);
  }
  //Send to the server
  sendCommandResult(true, paramObject.uuid, 'true');
};
 
//This function stores a variable and its value in the variable registry
windmill.controller.commands.createVariable = function(paramObject){
    var value = null;
    if (windmill.varRegistry.hasKey('{$'+paramObject.name +'}')){
      value = windmill.varRegistry.getByKey('{$'+paramObject.name +'}');
    }
    else{
      windmill.varRegistry.addItem('{$'+paramObject.name +'}',paramObject.value);
      value = windmill.varRegistry.getByKey('{$'+paramObject.name +'}');
    }
  
    //Send to the server
    sendCommandResult(true, paramObject.uuid, value);
    return true;
  };

//This function allows the user to specify a string of JS and execute it
windmill.controller.commands.execJS = function(paramObject){
      var res = true;
      var result = null;
      try {
	      result = eval(paramObject.code);
      } catch(error){
	      res = false;
      }
      //Send to the server
      sendCommandResult(res, paramObject.uuid, result);
      return true;
};

//Dynamically loading an extensions directory
windmill.controller.commands.loadExtensions = function(paramObject){
  var l = paramObject.extensions;
  for (var n in l){
    windmill.utilities.appendScript(window,l[n]); 
  }
  //Send to the server
  sendCommandResult(true, paramObject.uuid, 'true');
};

//Give the backend a list of available controller methods
windmill.controller.commands.getControllerMethods = function (paramObject){
	var str = '';
	for (var i in windmill.controller) { if ((i.indexOf('_') == -1) && (i != 'waits' )){ str += "," + i; } }
	for (var i in windmill.controller.extensions) {
	  if (str) { str += ',' }
	  str += 'extensions.'+i;
	}
	for (var i in windmill.controller.commands) {
	  if (str) { str += ',' }
	  str += 'commands.'+i;
	}
	for (var i in windmill.controller.asserts) {
	  if ((i.indexOf('_') == -1) && (i.indexOf('Registry') == -1) && 
	    (typeof(windmill.controller.asserts.assertRegistry[i]) != 'object')){

	    if (str) { str += ',' }
	      str += 'asserts.'+i;
	      str += ',';
	      str += 'asserts.assertNot'+i.replace('assert', '');
      }
	}
	for (var i in windmill.controller.waits) {
	  if (str) { str += ',' }
	  str += 'waits.'+i;
	}
	//Clean up
	var ca = new Array();
	ca = str.split(",");
	ca = ca.reverse();
	ca.pop();
	ca.pop();
	ca.pop();
	ca.pop();
	ca = ca.sort();
	
	sendCommandResult(true, paramObject.uuid, ca);
	
};
  
//Keeping the suites running 
windmill.controller.commands.setOptions = function (paramObject){
  if(typeof paramObject.stopOnFailure != "undefined") {
    windmill.stopOnFailure = paramObject.stopOnFailure;
  }
  if(typeof paramObject.runTests != "undefined") {
    windmill.runTests = paramObject.runTests;
    //Attempt to make the loading process a bit faster than running
    if (windmill.runTests == false){
     windmill.serviceDelay = 0;
    }
    else{ windmill.serviceDelay = 1000; }
  }
  //Send to the server
  sendCommandResult(res, paramObject.uuid, 'true');
  return true;
};

//Get the document HTML
windmill.controller.commands.getPageText = function (paramObject){
  var dom = windmill.testWin().document.documentElement.innerHTML.replace('\n','');
  dom = '<html>' + dom + '</html>';
  //Send to the server
  sendCommandResult(true, paramObject.uuid, dom);
};

//Function to start the running of jsTests
windmill.controller.commands.jsTests = function (paramObj) {
    //Setup needed variables
    windmill.jsTest.actions.loadActions();
    var wm = windmill.jsTest.actions;
    var testFiles = paramObj.files;
    if (!testFiles.length) {
      var err = 'No JavaScript tests to run.';
      windmill.jsTest.sendJSReport('jsTests', false, err,
        new TimeObj());
      throw new Error();
    }
    var _j = windmill.jsTest;
    windmill.pauseLoop();
    
    //Timing the suite
    var jsSuiteSummary = new TimeObj();
    jsSuiteSummary.setName('jsSummary');
    jsSuiteSummary.startTime();
    _j.jsSuiteSummary = jsSuiteSummary;

    _j.run(paramObj);
};

//Commands function to hande the test results of the js tests
windmill.controller.commands.jsTestResults = function () {
  var _j = windmill.jsTest;
  var jsSuiteSummary = _j.jsSuiteSummary;
  var s = '';
  s += '<b style="font-size:12px">Number of tests run:</b> ' + _j.testCount + '<br/>';
  s += '<b style="font-size:12px">Number of tests failures:</b> ' + _j.testFailureCount;
  if (_j.testFailureCount > 0) {
    s += '<br/>Test failures:<br/>';
    var fails = _j.testFailures;
    for (var i = 0; i < fails.length; i++) {
      var fail = fails[i];
      var msg = fail.message;
      // Escape angle brackets for display in HTML
      msg = msg.replace(/</g, '&lt;');
      msg = msg.replace(/>/g, '&gt;');
      s += msg;
    }
  };

  jsSuiteSummary.endTime();
  windmill.out(s);
  //We want the summary to have a concept of success/failure
  var result = !(_j.testFailureCount > 0);
  var method = 'JS Test Suite Completion';
  windmill.jsTest.sendJSReport(method, result, null, jsSuiteSummary);
  // Fire the polling loop back up
  windmill.continueLoop();
};

