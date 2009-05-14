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
if (typeof windmill.controller == 'undefined') { windmill.controller = {}; }
if (typeof windmill.controller.commands == 'undefined') { windmill.controller.commands = {}; }

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
  windmill.pauseLoop();
  var l = paramObject.extensions;
  
  for (var n = 0; n < l.length; n++){
    var src = windmill.utilities.getFile(l[n]);
    eval(src);
  }
  //Send to the server
  sendCommandResult(true, paramObject.uuid, 'true');
  windmill.continueLoop();
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
  sendCommandResult(true, paramObject.uuid, 'true');
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
    var jsTest = windmill.jsTest;
    // Stop the normal controller loop -- JS test loop
    // is a separate system that handles waits/sleeps
    // and running each JS test in the queue
    windmill.pauseLoop();
    // Set the callback that will restart the
    // controller loop
    jsTest.completedCallback = windmill.continueLoop;
    // Run the JS tests
    jsTest.run(paramObj);
};

