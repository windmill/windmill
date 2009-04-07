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

//Functionality that works for every browser
//Mozilla specific functionality abstracted to mozcontroller.js
//Safari specific functionality abstracted to safcontroller.js
//IE specific functionality abstracted to iecontroller.js
//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.
windmill.xhr = new function() {

    //Keep track of the loop state, running or paused
    this.loopState = false;
    this.timeoutId = null;
    
    //If the are variables passed we need to do our lex and replace
    this.processVar = function(str){
      if ((str.indexOf('{$') != -1) && (windmill.runTests == true)) {
        str = handleVariable(str);
      }
      return str;
    }
    
    //action callback
    this.actionHandler = function(str) {
        //Process variables but not for the execJS or execIDEJS
        if ((str.indexOf('execJsInTestWindow') == -1) && (str.indexOf('execArbTestWinJS') == -1) && (str.indexOf('execIDEJS') == -1)){
          str = windmill.xhr.processVar(str);
        }
        
        //Eval 
        try {
          windmill.xhr.xhrResponse = JSON.parse(str);
        } catch (err){ return; }
        
        var resp = windmill.xhr.xhrResponse;
        var method = resp.result.method;
        var params = resp.result.params;
        
        //If there was a legit json response
        if (resp.error) {
            windmill.err("There was a JSON syntax error: '" + 
            resp.error + "'");
        }
        else {
            if (method != 'defer') {           
                windmill.serviceDelay = windmill.serviceDelayRunning;
                windmill.stat("Running " + method + "...");
                windmill.ui.playback.setPlaying();
            }
            else {          
                windmill.serviceDelay = windmill.serviceDelayDefer;
                windmill.ui.playback.resetPlayBack();
                windmill.stat("Ready, Waiting for tests...");
            }

            //Init and start performance but not if the protocol defer
            if (method != 'defer') {

                //Put on windmill main page that we are running something
                windmill.xhr.action_timer = new TimeObj();
                windmill.xhr.action_timer.setName(method);

                //If the action already exists in the UI, skip all the creating suite stuff
                if ($(params.uuid) != null) {
                    var action = $(params.uuid);
                    action.style.background = 'lightyellow';
                }
                //If its a command we don't want to build any UI
                else if (method.split(".")[0] != 'commands') {
                  var action = windmill.xhr.createActionFromSuite(resp.result.suite_name, resp.result);
                }
                
                //default to true
                var result = true;
                var info = null;
                var output;
                
                //Forgotten case; If the windmill.runTests is false, but we are trying to change it back to true with a command
                //This fix runs all commands regardless  
                //Run the action
                //If it's a user extension.. run it
                if ((windmill.runTests == true) || (method.split(".")[0] == 'commands')) {

                    //split the action up
                    var mArray = method.split(".");
                    
                    //try running the actions
                    try {
                      //Start the action running timer
                        windmill.xhr.action_timer.startTime();
                        //Wait/open needs to not grab the next action immediately
                        if ((method.split(".")[0] == 'waits')) {
                            windmill.pauseLoop();
                            params.aid = action.id;
                        }
                        if (method.indexOf('.') != -1) {
                            //if asserts.assertNotSomething we need to set the result to !result
                            if (method.indexOf('asserts.assertNot') != -1) {
                                var m = mArray[1].replace('Not', '');
                                  try { 
                                    //windmill.controller[mArray[0]][m](params);
                                    output = windmill.controller[mArray[0]][m](params);
                                  } catch(err){
                                    var assertNotErr = true;
                                  }
                                  //If the not call didn't error, it's an error
                                  if (!assertNotErr){
                                    throw "returned true.";
                                  }
                            }
                            //Normal asserts and waits
                            else {
                                //windmill.controller[mArray[0]][mArray[1]](params, resp.result);
                                output = windmill.controller[mArray[0]][mArray[1]](params, resp.result);
                            }
                        }                        
                        //Every other action that isn't namespaced
                        else { output = windmill.controller[method](params); }
                        
                        //End the timer
                        windmill.xhr.action_timer.endTime();
                        //Report all bug commands on success
                        if (method.split(".")[0] != 'commands'){
                          params.aid = action.id;
                          windmill.actOut(method, params, result);
                        }
                    }
                    catch(error) {
                        //End the timer if something broke
                        windmill.xhr.action_timer.endTime();
                        info = error;
                        result = false;
                        
                        //Sometimes this is a huge dom exception which can't be serialized
                        //so what we want to use is the message property
                        if (error.message){
                          params.error = error.message;
                        }
                        else { params.error = error; }
                        
                        windmill.actOut(method, params, result);
                        // var newParams = copyObj(params);
                        // delete newParams.uuid;
                        // 
                        // windmill.out("<font color=\"#FF0000\">" + 
                        // method + ": " + error + "</font>");
                        // 
                        // windmill.out("<br>Action: <b>" + method + 
                        // "</b><br>Parameters: " + fleegix.json.serialize(newParams) + 
                        // "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');

                        //If the option to throw errors is set
                        if ($('throwDebug').checked == true) {
                            if (console.log) { console.log(error); }
                            else { throw (error); }
                        }
                        else {
                            if (!$('toggleBreak').checked) {
                                windmill.continueLoop();
                            }
                        }
                    }
                }
                else {
                  //we must be loading, change the status to reflect that
                  windmill.stat("Loading " + method + "...");
                }
                var m = method.split(".");
                //Send the report if it's not in the commands namespace, we only call report for test actions
                if ((m[0] != 'commands') && (m[0] != 'waits') && (windmill.runTests == true)) {
                    var newParams = copyObj(params);
                    delete newParams.uuid;
                    //End timer and store
                    //windmill.xhr.action_timer.endTime();
                    //windmill.xhr.sendReport(method, result, windmill.xhr.action_timer, info);
                    windmill.xhr.sendReport(method, result, windmill.xhr.action_timer, info, output);
                    windmill.xhr.setActionBackground(action, result, resp.result);
                    //Do the timer write
                    windmill.xhr.action_timer.write(newParams);
                }
            }
        }
        //Get the next action from the service
        setTimeout("windmill.xhr.getNext()", windmill.serviceDelay);

    };

    //Send the report
    this.sendReport = function(method, result, timer, info, output) {
      
        //handle the response
        var reportHandler = function(str) {
            response = eval('(' + str + ')');
            if (!response.result == 200) {
                windmill.err('Error: Report receiving non 200 response.');
            }
        };
        
        //send the report
        var result_string = JSON.stringify(windmill.xhr.xhrResponse.result);
        var test_obj = {
            "result": result,
            "output": typeof(output) !== "undefined" ? output : null,
            "debug": typeof(info) !== "undefined" ? info : null,
            "uuid": windmill.xhr.xhrResponse.result.params.uuid,
            "starttime": timer.getStart(),
            "endtime": timer.getEnd()
        };
        var jsonObject = new jsonCall('1.1', 'report');
        jsonObject.params = test_obj;
        var jsonString = JSON.stringify(jsonObject);
        //Actually send the report
        fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', jsonString);
    };

    //Get the next action from the server
    this.getNext = function() {
        
        //write to the output tab what is going on
        var handleTimeout = function() {
            windmill.err('One of the XHR requests to the server timed out.');
        }
        //var handleErr = function(){ setTimeout("windmill.xhr.getNext()", windmill.serviceDelay); }
        
        if (windmill.xhr.loopState) {
            var jsonObject = new jsonCall('1.1', 'next_action');
            var jsonString = JSON.stringify(jsonObject);

            //Execute the post to get the next action
            //Set the xhr timeout to be really high
            //handle the timeout manually
            //Prevent caching
            fleegix.xhr.doReq({
                method: 'POST',
                handleSuccess: this.actionHandler,
                handleErr: function(){ setTimeout("windmill.xhr.getNext()", windmill.serviceDelay); },
                responseFormat: 'text',
                url: '/windmill-jsonrpc/',
                timeoutSeconds: windmill.xhrTimeout,
                handleTimeout: handleTimeout,
                preventCache: true,
                dataPayload: jsonString
            });

        }

    };

    this.clearQueue = function() {
        var h = function(str) {
            windmill.out('Cleared backend queue, ' + str);
        }
        var test_obj = {};
        var jsonObject = new jsonCall('1.1', 'clear_queue');
        var jsonString = JSON.stringify(jsonObject);
        //Actually send the report
        fleegix.xhr.doPost(h, '/windmill-jsonrpc/', jsonString);

    };

    this.createActionFromSuite = function(suiteName, actionObj) {
        //If the suite name is null, set it to default
        if (suiteName == null) {
            suiteName = 'Default';
        }
        windmill.ui.currentSuite = suiteName;
        var suite = windmill.ui.remote.getSuite(suiteName);

        //Add the action to the suite
        var action = windmill.ui.remote.buildAction(actionObj.method, actionObj.params);
        //var suite = $(result);
        suite.appendChild(action);
        //IE Hack
        if (windmill.browser.isIE) {
            $(action.id).innerHTML = action.innerHTML;
        }
        var ide = $('ideForm');

        //If the settings box is checked, scroll to the bottom
        if ($('autoScroll').checked == true) {
            ide.scrollTop = ide.scrollHeight;
        }
        return action;
    };

    this.setActionBackground = function(action, result, obj) {
 
        if (result != true) {
            if (typeof(action) != 'undefined') {
                action.style.background = '#FF9692';
                action.parentNode.style.border.borderTop = "1px solid red";
                action.parentNode.style.border.borderBottom = "1px solid red";
            }
            // windmill.out("<br>Action: <b>" + obj.method + 
            //      "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + 
            //      "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');
            //             
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (windmill.stopOnFailure == true) {
                windmill.xhr.loopState = false;
                windmill.stat("Paused, error?...");
            }
        }
        else {
            //Write to the result tab
            // windmill.out("<br>Action: <b>" + obj.method + 
            // "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + 
            // "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');
            
            if ((typeof(action) != 'undefined') && (windmill.runTests == true)) {
                action.style.background = '#C7FFCC';
                if (action.parentNode.style.borderTop.indexOf("red") != -1){
                  action.parentNode.style.borderTop = "1px solid green";
                  action.parentNode.style.borderBottom = "1px solid green";
                }
            }
        }
    };
    this.setWaitBgAndReport = function(aid, result, obj) {
        if (!obj) { return false; }
        
        var action = $(aid);
        var output = $(aid+"result");
        windmill.xhr.action_timer.endTime();

        if (result != true) {
            if (action != null) { action.style.background = '#FF9692'; }
            if (output != null) { output.style.background = '#FF9692'; }
            
            // windmill.out("<br>Action: <b>" + obj.method + 
            // "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + 
            // "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');
            
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (windmill.stopOnFailure == true) {
                windmill.xhr.loopState = false;
                windmill.stat("Paused, error?...");
            }
        }
        else {
            //Write to the result tab
            // windmill.out("<br>Action: <b>" + obj.method + 
            // "</b><br>Parameters: " + fleegix.json.serialize(obj.params) + 
            // "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');
            
            try {
                if ((typeof(action) != 'undefined') && (windmill.runTests == true)) {
                    action.style.background = '#C7FFCC';
                }
                if ((typeof(output) != 'undefined') && (windmill.runTests == true)) {
                    output.style.background = '#C7FFCC';
                }
            }
            catch(err) {}
        }
        //Send the report
        windmill.xhr.xhrResponse.result = obj;
        //Don't report if we are running js tests
        if (obj.params.orig != 'js'){
          //windmill.xhr.sendReport(obj.method, result, windmill.xhr.action_timer);
          windmill.xhr.sendReport(obj.method, result, windmill.xhr.action_timer, undefined);
        }
        windmill.xhr.action_timer.write(obj.params);
    };


};
