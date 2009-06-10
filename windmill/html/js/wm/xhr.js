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
    
    //If the are variables passed we need to do our lex and replace
    this.processVar = function(str){
      //only process if it's no an exec method
      if ((str.indexOf('"method": "exec') == -1)
        && (str.indexOf('{$') != -1) 
        && (windmill.runTests)) {
        str = handleVariable(str);
      }
      return str;
    }
    
    this.runAction = function(){
      var self = windmill.xhr;
      
      //setup state
      windmill.serviceDelay = windmill.serviceDelayRunning;
      windmill.stat("Running " + self.action.method + "...");
      windmill.ui.playback.setPlaying();
      //Put on windmill main page that we are running something
      self.action_timer = new TimeObj();
      self.action_timer.setName(self.action.method);
      
      
      //If the action already exists in the UI, skip all the creating suite stuff
      if ($(self.action.params.uuid) != null) {
          var action = $(self.action.params.uuid);
          action.style.background = 'lightyellow';
      }
      //If it's a command we don't want to build any UI
      else if (self.methodArr[0] != 'commands') {
        var action = self.createActionFromSuite(self.action.suite_name, self.action);
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
        (self.methodArr[0] == 'commands')) {
          
          //try running the actions
          try {
            //Start the action running timer
              windmill.xhr.action_timer.startTime();
              //Wait/open needs to not grab the next action immediately
              if ((self.methodArr[0] == 'waits')) {
                  windmill.pauseLoop();
                  self.action.params.aid = action.id;
              }
              if (self.methodArr.length > 1){
                  //if asserts.assertNotSomething we need to set the result to !result
                  if (self.action.method.indexOf('asserts.assertNot') != -1) {
                      var m = self.methodArr[1].replace('Not', '');
                        try { 
                          output = windmill.controller[self.methodArr[0]][m](self.action.params);
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
                    output = windmill.controller[self.methodArr[0]][self.methodArr[1]](self.action.params, self.action);
                  }
              }                        
              //Every other action that isn't namespaced
              else { 
                output = windmill.controller[self.action.method](self.action.params); 
              }
              
              //End the timer
              self.action_timer.endTime();
              //Report all bug commands on success
              if (self.methodArr[0] != 'commands'){
                self.action.params.aid = action.id;
                windmill.actOut(self.action.method, self.action.params, result);
              }
          }
          catch(error) {
              //End the timer if something broke
              self.action_timer.endTime();
              info = error;
              result = false;
              
              //Sometimes this is a huge dom exception which can't be serialized
              //so what we want to use is the message property
              if (error.message){
                self.action.params.error = error.message;
              } else { 
                self.action.params.error = error; 
              }
              
              windmill.actOut(self.action.method, self.action.params, result);

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
        windmill.stat("Loading " + self.action.method + "...");
      }

      //Send the report if it's not in the commands namespace, we only call report for test actions
      if ((self.methodArr[0] != 'commands') && (self.methodArr[0] != 'waits') 
                                            && (windmill.runTests == true)) {
          var newParams = copyObj(self.action.params);
          delete newParams.uuid;

          self.sendReport(self.action.method, result, self.action_timer, info, output);
          self.setActionBackground(action, result, self.action);
          //Do the timer write
          self.action_timer.write(newParams);
      }
    };
    
    //action callback
    this.actionHandler = function(str) {
        var self = windmill.xhr;
        
        //Eval 
        try {
          self.dataObj = JSON.parse(self.processVar(str));
        } catch (err){ return; }
        
        self.action = self.dataObj.result;
        self.methodArr = self.action.method.split(".");
        
        //If there was a legit json response
        if (self.dataObj.error) {
            windmill.err("There was a JSON syntax error: '" + 
              self.dataObj.error + "'");
        }
        else {
            //Init and start performance but not if the protocol defer
            if (self.action.method != 'defer') {
              self.runAction();
            } else {
              windmill.serviceDelay = windmill.serviceDelayDefer;
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
        var reportHandler = function(str) {
            response = eval('(' + str + ')');
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
        fleegix.xhr.doPost(reportHandler, '/windmill-jsonrpc/', jsonString);
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
        if (!obj) { return false; }
        
        var action = $(aid);
        var output = $(aid+"result");
        windmill.xhr.action_timer.endTime();

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
    };
};
