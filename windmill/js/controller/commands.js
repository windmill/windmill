/*******************************************************************************************************
/* Commands namespace functions, mostly system specific for the server to inderact with the client
/******************************************************************************************************/
 
 //Create lots of variables
 windmill.controller.commands.createVariables = function(param_object){
  for (var i = 0;i<param_object.variables.length;i++){
   windmill.varRegistry.addItem('{$'+param_object.variables[i].split('|')[0] +'}',param_object.variables[i].split('|')[1]);
  }
    //Send to the server
    var json_object = new windmill.xhr.json_call('1.1', 'command_result');
    var params_obj = {"status":true, "uuid":param_object.uuid, "result":'true'};
    json_object.params = params_obj;
    var json_string = fleegix.json.serialize(json_object)

    var resp = function(str){ return true; }
    
    result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
    resp(result);        
 }
 
 //This function stores a variable and it's value in the variable registry
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
    var json_object = new windmill.xhr.json_call('1.1', 'command_result');
    var params_obj = {"status":true, "uuid":param_object.uuid, "result":value };

    json_object.params = params_obj;
    var json_string = fleegix.json.serialize(json_object)

    var resp = function(str){ return true; }
    
    result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
    resp(result);
    return true;
 }

 //This function allows the user to specify a string of JS and execute it
 windmill.controller.commands.execJS = function(param_object){
    //Lets send the result now to the server
    var json_object = new windmill.xhr.json_call('1.1', 'command_result');
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
 }

 //Give the backend a list of available controller methods
 windmill.controller.commands.getControllerMethods = function (param_object){
     var str = '';
     for (var i in windmill.controller) { if (i.indexOf('_') == -1){ str += "," + i; } }
     for (var i in windmill.controller.extensions) {
         if (str) { str += ',' }
         str += 'extensions.'+i;
     }
     for (var i in windmill.controller.commands) {
         if (str) { str += ',' }
         str += 'commands.'+i;
     }
     for (var i in windmill.controller.asserts) {
         if (str) { str += ',' }
         str += 'asserts.'+i;
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
    var json_object = new windmill.xhr.json_call('1.1', 'command_result');
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
      if(typeof param_object.showRemote != "undefined") {
          windmill.showRemote = param_object.showRemote;
      }
      if(typeof param_object.runTests != "undefined") {
          windmill.runTests = param_object.runTests;
      }
  
      return true;
  };
  
  //
 windmill.controller.commands.getDOM = function (param_object){
    var dom = windmill.testingApp.document.documentElement.innerHTML.replace('\n','');
    
    //Send to the server
    var json_object = new windmill.xhr.json_call('1.1', 'command_result');
    var params_obj = {"status":true, "uuid":param_object.uuid, "result":dom};
    json_object.params = params_obj;
    var json_string = fleegix.json.serialize(json_object)

    var resp = function(str){ return true; }
    
    result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
    resp(result); 
  }

 windmill.controller.commands.jsTests = function (paramObj) {
    var testFiles = paramObj.tests;
    if (!testFiles.length) {
      throw('No JavaScript tests to run.');
    }
    var _j = windmill.jsTest;
    windmill.controller.stopLoop();
    
    //Timing the suite
    var jsSuiteSummary = new TimeObj();
    jsSuiteSummary.setName('jsSummary');
    jsSuiteSummary.startTime();
    _j.jsSuiteSummary = jsSuiteSummary;

    _j.run(testFiles);
  };

 windmill.controller.commands.jsTestResults = function () {
    var _j = windmill.jsTest;
    var jsSuiteSummary = _j.jsSuiteSummary;
    var s = '';
    s += 'Number of tests run: ' + _j.testCount + '\n';
    s += 'Number of tests failures: ' + _j.testFailureCount + '\n';
    var fail = _j.testFailures;
    for (var i = 0; i < fail.length; i++) {
      s += fail[i].message + '\n';
    }

    jsSuiteSummary.endTime();
    windmill.ui.results.writeResult(s);
    //We want the summary to have a concept of success/failure
    var result = !(_j.testFailureCount > 0);
    var method = 'JS Test Suite Completion';
    windmill.jsTest.sendJSReport(method, result, null, jsSuiteSummary);
    // Fire the polling loop back up
    windmill.controller.continueLoop();

 };

