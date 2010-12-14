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
    this.actionQueued = false;
    
    //If the are variables passed we need to do our lex and replace
    this.processVar = function(str){
      //only process if it's no an exec method
      if ((str.indexOf('"method": "exec') == -1)
        && (str.indexOf('commands.') == -1)
        && (str.indexOf('{$') != -1) 
        && (windmill.runTests)) {
        str = handleVariable(str);
      }
      return str;
    }
    
    this.goWait = function(){
      windmill.xhr.actionQueued = true;
      windmill.controller.waits.forElement(windmill.xhr.action.params, windmill.xhr.action);
    };
    
    this.runAction = function(){
      var _this = windmill.xhr;
      
      //setup state
      //windmill.serviceDelay = windmill.serviceDelayRunning;
      windmill.stat("Running " + _this.action.method + "...");
      windmill.ui.playback.setPlaying();
      //Put on windmill main page that we are running something
      _this.action_timer = new TimeObj();
      _this.action_timer.setName(_this.action.method);
      
      
      //If the action already exists in the UI, skip all the creating suite stuff
      if ($(_this.action.params.uuid) != null) {
          var action = $(_this.action.params.uuid);
          action.style.background = 'lightyellow';
      }
      //If it's a command we don't want to build any UI
      else if (_this.methodArr[0] != 'commands') {
        var action = _this.createActionFromSuite(_this.action.suite_name, _this.action);
      }
      
      //default to true
      var result = true;
      var info = null;
      var output;
      
      //Forgotten case; If the windmill.runTests is false, but we are trying to change it back to true with a command
      //This fix runs all commands regardless  
      //Run the action
      //If it's a user extension.. run it
      if ((windmill.runTests) || 
        (_this.methodArr[0] == 'commands')) {
          
          //try running the actions
          try {
            //Start the action running timer
              windmill.xhr.action_timer.startTime();
              
              //Get access to the function according to the method array
              //not's don't actually exist
              try {
                var func = stringToFunc(arrayToJSPath(_this.methodArr));
              } catch(err){ windmill.err(err); }
              

              //waits and nodes that have a lookup that isn't returning
              //if there is no node, this will be false
              //if there is a node, but it doesn't return it will throw
              //else we have a node
              if (_this.node) { var tempNode = _this.node; }
              try {
                _this.node = lookupNode(_this.action.params, false);
                } catch(err){
                _this.node = null;
              }
              if (tempNode) {
                if (tempNode != _this.node) {
                    //crazy bug in IE if this happens after a page reload
                    try {
                      windmill.events.triggerEvent(tempNode, 'blur', false);
                    } catch(e){}
                }
              }
              
              //auto wait for only UI actions
              //where the lookup fails.
              if ((_this.node == null) && 
                  (_this.methodArr[0] != 'waits') &&
                  (_this.methodArr[0] != 'asserts')){
                    
                windmill.pauseLoop();
                _this.action.params.aid = action.id;
                _this.goWait();
                return;
              }
              
              //Wait/open needs to not grab the next action immediately
              if (_this.action.method.indexOf('waits') != -1) {
                  windmill.pauseLoop();
                  _this.action.params.aid = action.id;
              }

              //asserts., waits.
              if (_this.methodArr.length > 1){
                
                  //if asserts.assertNotSomething we need to set the result to !result
                  if (_this.action.method.indexOf('asserts.assertNot') != -1) {
                      _this.methodArr[1] = _this.methodArr[1].replace('Not', '');
					            var assertNotErr = false;
                        
                      try {
                        var func = stringToFunc(arrayToJSPath(_this.methodArr));
                        output = func(_this.action.params);
                      } catch(err){
                        assertNotErr = true;
                      }
                      //If the not call didn't error, it's an error
                      if (!assertNotErr){
                        throw "AssertNot returned true, thus a fail.";
                      }
                  }
                  //Normal asserts and waits
                  else {
                    output = func(_this.action.params, _this.action);
                  }
              }                        
              //Every other action that isn't namespaced
              else {
                output = func(_this.action.params);
              }
              
              //End the timer
              _this.action_timer.endTime();
              //Report all bug commands on success
              if (_this.methodArr[0] != 'commands'){
                _this.action.params.aid = action.id;
                //serialize and send output to the UI
                //if it isn't undefined
                var serOutput = JSON.stringify(output);
                if (serOutput != undefined){
                  _this.action.params.output = serOutput;
                }
                windmill.actOut(_this.action.method, _this.action.params, result);
              }
          }
          catch(error) {
              //End the timer if something broke
              _this.action_timer.endTime();
              info = error;
              result = false;
              
              //Sometimes this is a huge dom exception which can't be serialized
              //so what we want to use is the message property
              if (error.message){
                _this.action.params.error = error.message;
								if (error.lineNumber){
									error.message += "" + error.lineNumber;
								}
              } else { 
                _this.action.params.error = error; 
              }
              
              windmill.actOut(_this.action.method, _this.action.params, result);

              //If the option to throw errors is set
              if ($('throwDebug').checked == true) {
                  if (console.log) { console.log(error); }
                  else { throw (error); }
              } else {
                  if (!$('toggleBreak').checked) {
                    windmill.continueLoop();
                  }
              }
          }
      }
      else {
        //we must be loading, change the status to reflect that
        windmill.stat("Loading " + _this.action.method + "...");
      }

      //Send the report if it's not in the commands namespace, we only call report for test actions
      if ((_this.methodArr[0] != 'commands') 
        && (_this.action.method.indexOf('waits') == -1) 
        && (windmill.runTests == true)) {
        
          var newParams = copyObj(_this.action.params);
          delete newParams.uuid;

          _this.sendReport(_this.action.method, result, _this.action_timer, info, output);
          _this.setActionBackground(action, result, _this.action);
          //Do the timer write
          _this.action_timer.write(newParams);
      }
    };
    
    //action callback
    this.actionHandler = function(str) {
        var _this = windmill.xhr;
        
        //Eval 
        try {
          _this.dataObj = JSON.parse(_this.processVar(str));
        } catch (err){ return; }
        
        _this.action = _this.dataObj.result;
        _this.methodArr = _this.action.method.split(".");
        
        //If there was a legit json response
        if (_this.dataObj.error) {
            windmill.err("There was a JSON syntax error: '" + 
              _this.dataObj.error + "'");
        }
        else {
            //Init and start performance but not if the protocol defer
            if (_this.action.method != 'defer') {
              _this.runAction();
            } else {
              //windmill.serviceDelay = windmill.serviceDelayDefer;
              windmill.ui.playback.resetPlayBack();
              windmill.stat("Ready, Waiting for tests...");
            }
        }
        //Get the next action from the service
        setTimeout("windmill.xhr.getNext()", windmill.serviceDelay);
    };

    //Send the report
    this.sendReport = function(method, result, timer, info, output) {
      
        //handle the response
        var reportHandler = function(response) {
            if (!response.result == 200) {
                windmill.err('Error: Report receiving non 200 response.');
            }
        };
        
        //send the report
        var result_string = JSON.stringify(windmill.xhr.action);
        var test_obj = {
            "result": result,
            "output": typeof(output) !== "undefined" ? output : null,
            "debug": typeof(info) !== "undefined" ? info : null,
            "uuid": windmill.xhr.action.params.uuid,
            "starttime": timer.getStart(),
            "endtime": timer.getEnd()
        };
        var jsonObject = new jsonCall('1.1', 'report');
        jsonObject.params = test_obj;
        var jsonString = JSON.stringify(jsonObject);
        //Actually send the report
        //fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', jsonString);
        jQuery.post('/windmill-jsonrpc/', jsonString, reportHandler);
    };

    //Get the next action from the server
    this.getNext = function() {
        
        //write to the output tab what is going on
        var handleTimeout = function() {
            windmill.err('One of the XHR requests to the server timed out.');
            setTimeout("windmill.xhr.getNext()", windmill.serviceDelay);
        }
        //var handleErr = function(){ setTimeout("windmill.xhr.getNext()", windmill.serviceDelay); }
        
        if (windmill.xhr.loopState) {
            var jsonObject = new jsonCall('1.1', 'next_action');
            var jsonString = JSON.stringify(jsonObject);

            //Execute the post to get the next action
            //Set the xhr timeout to be really high
            //handle the timeout manually
            //Prevent caching
            // fleegix.xhr.doReq({
            //     method: 'POST',
            //     handleSuccess: this.actionHandler,
            //     handleErr: function(){ setTimeout("windmill.xhr.getNext()", windmill.serviceDelay); },
            //     responseFormat: 'text',
            //     url: '/windmill-jsonrpc/',
            //     timeoutSeconds: windmill.xhrTimeout,
            //     handleTimeout: handleTimeout,
            //     preventCache: true,
            //     dataPayload: jsonString
            // });
            
            jQuery.ajax({
               type: "POST",
               url: "/windmill-jsonrpc/",
               data: jsonString,
               success: this.actionHandler,
               error:function(){ setTimeout("windmill.xhr.getNext()", windmill.serviceDelay); },
               cache: false,
               dataType: "text"
             });
            
        }
    };

    this.clearQueue = function() {
        var h = function(obj) {
            windmill.out('Cleared backend queue, ' + JSON.stringify(obj));
        }
        var test_obj = {};
        var jsonObject = new jsonCall('1.1', 'clear_queue');
        var jsonString = JSON.stringify(jsonObject);
        //Actually send the report
        //fleegix.xhr.doPost(h, '/windmill-jsonrpc/', jsonString);
        jQuery.post('/windmill-jsonrpc/', jsonString, h);

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
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (windmill.stopOnFailure == true) {
                windmill.xhr.loopState = false;
                windmill.stat("Paused, error?...");
            }
        }
        else {
            //Write to the result tab            
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
        
        //Access the action UI and output UI
		var action = $(aid);
        var output = $(aid+"result");
				
		//If we are in an auto-wait state
		if (windmill.xhr.actionQueued){
			//No longer in a waiting state after this if
			windmill.xhr.actionQueued = false;
			//Update the results
			windmill.actOut(windmill.xhr.action.method, windmill.xhr.action.params, result);
			//We want to add a new output line instead of accessing the old one
			output = null;
        }
        
        //If no object was provided then we just restart the loop and bail
		if (!obj) { 
          windmill.continueLoop();
          return false; 
        }
				
		//End any timing that is happening
        windmill.xhr.action_timer.endTime();

        //Failed action case
		if (!result) {
            if (action != null) { action.style.background = '#FF9692'; }
            if (output != null) { //output.style.background = '#FF9692'; 
              output.removeAttribute('class');
              output.removeAttribute('style');
              output.className = "ui-state-error ui-corner-all outputEntry";
              output.style.height = "13px";
            }
            
            
            //if the continue on error flag has been set by the shell.. then we just keep on going
            if (windmill.stopOnFailure == true) {
                windmill.xhr.loopState = false;
                windmill.stat("Paused, error?...");
            }
        }
				//Passing action case
        else {
            //Write to the result tab
            try {
                if ((typeof(action) != 'undefined') && (windmill.runTests)) {
                    action.style.background = '#C7FFCC';
                }
                if ((typeof(output) != 'undefined') && (windmill.runTests)) {
                    output.style.background = '#C7FFCC';
                }
            }
            catch(err) {}
        }
        //Send the report
        windmill.xhr.action = obj;
        //Don't report if we are running js tests
        if (obj.params.orig != 'js'){
          //windmill.xhr.sendReport(obj.method, result, windmill.xhr.action_timer);
          windmill.xhr.sendReport(obj.method, result, windmill.xhr.action_timer, undefined);
        }
        windmill.xhr.action_timer.write(obj.params);
        windmill.continueLoop();
    };
};
