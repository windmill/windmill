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
windmill.controller.commands.createVariables = function(param_object){
  for (var i = 0;i<param_object.variables.length;i++){
    windmill.varRegistry.addItem('{$'+param_object.variables[i].split('|')[0] +'}',param_object.variables[i].split('|')[1]);
  }
  //Send to the server
  var json_object = new json_call('1.1', 'command_result');
  var params_obj = {"status":true, "uuid":param_object.uuid, "result":'true'};
  json_object.params = params_obj;
  var json_string = fleegix.json.serialize(json_object)

  var resp = function(str){ return true; }
    
  result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
  resp(result);        
};
 
//This function stores a variable and its value in the variable registry
windmill.controller.commands.createVariable = function(param_object){
    var value = null;
    if (windmill.varRegistry.hasKey('{$'+param_object.name +'}')){
      value = windmill.varRegistry.getByKey('{$'+param_object.name +'}');
    }
    else{
      windmill.varRegistry.addItem('{$'+param_object.name +'}',param_object.value);
      value = windmill.varRegistry.getByKey('{$'+param_object.name +'}');
    }
  
    //Send to the server
    var json_object = new json_call('1.1', 'command_result');
    var params_obj = {"status":true, "uuid":param_object.uuid, "result":value };

    json_object.params = params_obj;
    var json_string = fleegix.json.serialize(json_object)

    var resp = function(str){ return true; }
    
    result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
    resp(result);
    return true;
  };

//This function allows the user to specify a string of JS and execute it
windmill.controller.commands.execJS = function(param_object){
      //Lets send the result now to the server
      var json_object = new json_call('1.1', 'command_result');
      var params_obj = {};
    
      try {
	      params_obj.result = eval(param_object.code);
      }
      catch(error){
	      params_obj.result = error;
      }
    
      params_obj.status = true;
      params_obj.uuid = param_object.uuid;
      json_object.params = params_obj;
      var json_string = fleegix.json.serialize(json_object)

      var resp = function(str){ return true; }
    
      result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
      resp(result);
      return false;
};

//Dynamically loading an extensions directory
windmill.controller.commands.loadExtensions = function(param_object){
  var l = param_object.extensions;
  for (var n in l){
    windmill.utilities.appendScript(windmill.remote,l[0]); 
  }
};

//Give the backend a list of available controller methods
windmill.controller.commands.getControllerMethods = function (param_object){
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
	  if ((i.indexOf('_') == -1) && (typeof(windmill.controller.asserts.assertRegistry[i]) != 'object')){

	    if (str) { str += ',' }
	      str += 'asserts.'+i;
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

	//Send to the server
	var json_object = new json_call('1.1', 'command_result');
	var params_obj = {"status":true, "uuid":param_object.uuid, "result":ca};
	json_object.params = params_obj;
	var json_string = fleegix.json.serialize(json_object)

	var resp = function(str){ return true; }
    
	result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
	resp(result);
};
  
//Keeping the suites running 
windmill.controller.commands.setOptions = function (param_object){
  if(typeof param_object.stopOnFailure != "undefined") {
    windmill.stopOnFailure = param_object.stopOnFailure;
  }
  if(typeof param_object.runTests != "undefined") {
    windmill.runTests = param_object.runTests;
    //Attempt to make the loading process a bit faster than running
    if (windmill.runTests == false){
     windmill.serviceDelay = 0;
    }
    else{ windmill.serviceDelay = 1000; }
  }
  
  return true;
};

//Get the document HTML
windmill.controller.commands.getPageText = function (param_object){
  var dom = windmill.testWindow.document.documentElement.innerHTML.replace('\n','');
  dom = '<html>' + dom + '</html>';
  //Send to the server
  var json_object = new json_call('1.1', 'command_result');
  var params_obj = {"status":true, "uuid":param_object.uuid, "result":dom};
  json_object.params = params_obj;
  var json_string = fleegix.json.serialize(json_object)

  var resp = function(str){ return true; }
    
  result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
  resp(result); 
};

//Function to start the running of jsTests
windmill.controller.commands.jsTests = function (paramObj) {
    //Setup needed variables
    windmill.jsTest.actions.loadActions();
    var wm = windmill.jsTest.actions;
    var testFiles = paramObj.files;
    if (!testFiles.length) {
      throw new Error('No JavaScript tests to run.');
    }
    var _j = windmill.jsTest;
    windmill.controller.stopLoop();
    
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
  s += 'Number of tests run: ' + _j.testCount + '<br/>';
  s += 'Number of tests failures: ' + _j.testFailureCount + '<br/>';
  if (_j.testFailureCount > 0) {
    s += 'Test failures:<br/>';
    var fails = _j.testFailures;
    for (var i = 0; i < fails.length; i++) {
      var fail = fails[i];
      var msg = fail.message;
      // Escape angle brackets for display in HTML
      msg = msg.replace(/</g, '&lt;');
      msg = msg.replace(/>/g, '&gt;');
      s += msg + '<br/>';
    }
  };

  jsSuiteSummary.endTime();
  windmill.ui.results.writeResult(s);
  //We want the summary to have a concept of success/failure
  var result = !(_j.testFailureCount > 0);
  var method = 'JS Test Suite Completion';
  windmill.jsTest.sendJSReport(method, result, null, jsSuiteSummary);
  // Fire the polling loop back up
  windmill.controller.continueLoop();

};

