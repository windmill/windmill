/*
Copyright 2006, Open Source Applications Foundation

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

windmill.xhr = new function () {
    
    //Keep track of the loop state, running or paused
    this.loopState = 1;
   
    //json_call
    this.json_call = function(version, method, params){
        this.version = version || null;
        this.method = method || null;
        this.params = params || [];
    }

    
     this.toggleCollapse = function(id){
        if (windmill.remote.document.getElementById(id).style.height == '18px'){
            windmill.remote.document.getElementById(id).style.height = '';
        }
        else{ windmill.remote.document.getElementById(id).style.height = '18px'; }            
    }
    
    //action callback
    this.actionHandler = function(str){
        windmill.xhr.xhrResponse = eval('(' + str + ')');
        //If there was a legit json response
        if ( windmill.xhr.xhrResponse.error ){
            //windmill.Log.debug("There was a JSON syntax error: '" + windmill.xhr.xhrResponse.error + "'");
        }
        else{
            
            if (windmill.xhr.xhrResponse.result.method != 'defer'){
                windmill.ui.writeStatus("Status: Running " + windmill.xhr.xhrResponse.result.method + "...");
            }
            else{  
                windmill.ui.writeStatus("Status: Waiting for tests...");
            }
            
            //Init and start performance but not if the protocol defer
            if (windmill.xhr.xhrResponse.result.method != 'defer'){

                //Put on windmill main page that we are running something
                var action_timer = new TimeObj();
                action_timer.setName(windmill.xhr.xhrResponse.result.method);
                action_timer.startTime();
                
                //If the action already exists in the UI, skip all the creating suite stuff
                if (windmill.remote.$(windmill.xhr.xhrResponse.result.params.uuid) != null){
                 var action = windmill.remote.$(windmill.xhr.xhrResponse.result.params.uuid);
                 action.style.background = 'lightyellow';
                }
                else {
                  //If the suite name is null, set it to default
                  if( windmill.xhr.xhrResponse.result.suite_name == null){
                    windmill.xhr.xhrResponse.result.suite_name = 'Default';
                  }
                  //Try to grab the stuite in the UI
                  var suite = windmill.remote.$(windmill.xhr.xhrResponse.result.suite_name);
                
                  //if the suite isn't already there, create it
                  if (suite == null){
                       var ide = windmill.remote.$('ide');
                       var suite = windmill.remote.document.createElement('div');
                       suite.id = windmill.xhr.xhrResponse.result.suite_name;
                       suite.style.width = "99%";
                       suite.style.background = "lightblue";
                       suite.style.overflow = 'hidden';
                       suite.style.border = '1px solid black';
                       suite.innerHTML = "<div style='width:100%'><table style='width:100%;font:12px arial;'><tr><td><strong>Suite </strong>"+
                          windmill.xhr.xhrResponse.result.suite_name+"</td><td><span align=\"right\" style='top:0px;float:right;'>"+
                          "<a href=\"#\" onclick=\"windmill.ui.saveSuite(\'"+windmill.xhr.xhrResponse.result.suite_name+
                           "\')\">[save]</a>&nbsp<a href=\"#\" onclick=\"windmill.ui.deleteAction(\'"+windmill.xhr.xhrResponse.result.suite_name+
                           "\')\">[delete]</a>&nbsp<a href=\"#\" onclick=\"javascript:opener.windmill.xhr.toggleCollapse(\'"+
                           windmill.xhr.xhrResponse.result.suite_name+"\')\">[toggle]</a></span></td></tr></table></div>";
                       windmill.remote.$('ide').appendChild(suite);
                     }
                    
                    //Add the action to the suite
                    var action = windmill.ui.buildAction(windmill.xhr.xhrResponse.result.method,windmill.xhr.xhrResponse.result.params);
                    var suite = windmill.remote.$(windmill.xhr.xhrResponse.result.suite_name);
                    suite.appendChild(action);
                    var ide = windmill.remote.$('ide');
                
                    //If the settings box is checked, scroll to the bottom
                    if ( windmill.remote.document.getElementById('autoScroll').checked == true){
                        ide.scrollTop = ide.scrollHeight;
                    }
                }
                //Run the action
                //If its a user extension.. run it
                try {
                    if (windmill.xhr.xhrResponse.result.method.indexOf('.') != -1){
                        var mArray = windmill.xhr.xhrResponse.result.method.split(".");                       
                        result = windmill.controller[mArray[0]][mArray[1]](windmill.xhr.xhrResponse.result.params);
                    }
                    else{  result = windmill.controller[windmill.xhr.xhrResponse.result.method](windmill.xhr.xhrResponse.result.params); }
                }
                catch (error) { 
                    windmill.ui.writeResult("<font color=\"#FF0000\">There was an error in the "+
                    windmill.xhr.xhrResponse.result.method+" action. "+error+"</font>");
                    windmill.ui.writeResult("<br>Action: <b>" + windmill.xhr.xhrResponse.result.method + 
                    "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');     
                    action.style.background = '#FF9692';

                }

                //End timer and store
                action_timer.endTime();
                var to_write = fleegix.json.serialize(windmill.xhr.xhrResponse.result);

                //Send the report if its not in the commands namespace, we only call report for test actions
                if(windmill.xhr.xhrResponse.result.method.split(".")[0] != 'commands'){
                    windmill.xhr.sendReport(windmill.xhr.xhrResponse.result.method, result, action_timer);

                    //action stuff only exists if we have an action in the UI, if we do:
                    //if we had an error display in UI
                    if (result == false){
                        if (typeof(action) != 'undefined'){ action.style.background = '#FF9692'; }
                        windmill.ui.writeResult("<br>Action: <b>" + windmill.xhr.xhrResponse.result.method + 
                        "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');   
                        //if the continue on error flag has been set by the shell.. then we just keep on going
                        if (windmill.stopOnFailure == true){
                            windmill.xhr.togglePauseJsonLoop();
                            windmill.ui.writeStatus("Status: Paused, error?...");    
                        }
                    }
                    else {
                        //Write to the result tab
                        windmill.ui.writeResult("<br>Action: <b>" + windmill.xhr.xhrResponse.result.method + "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');     
                        if (typeof(action) != 'undefined'){ action.style.background = '#C7FFCC'; }
                    }
                }
                //Do the timer write
                action_timer.write(to_write);

            }
        }
        
        //If the loop is running make the next request    
        if (windmill.xhr.loopState != 0){
            //Sleep for a few seconds before doing the next xhr call
            setTimeout("windmill.xhr.getNext()", 2000);
        }
          
    }
      
    //Make sure we get back a confirmation
    this.reportHandler = function(str){
        response = eval('(' + str + ')');
        
        if (!response.result == 200){
            windmill.ui.writeResult('Error: Report receiving non 200 response.');
        }
    }
    
    //Send the report
    this.sendReport = function(method, result, timer){
        
        //Get the result into a string
        var result_string = fleegix.json.serialize(windmill.xhr.xhrResponse.result)
        
        //Append the results of the test run
        var object_string = '{"result": '+result+',"uuid": "'+ windmill.xhr.xhrResponse.result.params.uuid +'", "starttime":"'+ timer.getStart() + '", "endtime":"'+ timer.getEnd() +'"}';
        //var object_string = '{"test":'+ result_string + ',"uuid": "", "starttime":"'+ timer.getStart() + '", "endtime":"'+ timer.getEnd() +'"}';
        //Turn this into an object
        //console.log(object_string);
        var test_obj = eval('(' + object_string + ')');
        
        //Create the json call object
        var json_object = new this.json_call('1.1', 'report');
        
        //Set the params
        json_object.params = test_obj;
        
        //Serialze the whole thing
        var json_string = fleegix.json.serialize(json_object);
       
        //Actually send the report
        fleegix.xhr.doPost(this.reportHandler, '/windmill-jsonrpc/', json_string);
    }
    
    //Get the next action from the server
    this.getNext = function(){
        var json_object = new this.json_call('1.1', 'next_action');
        var json_string = fleegix.json.serialize(json_object)
        fleegix.xhr.doPost(this.actionHandler, '/windmill-jsonrpc/', json_string);
    }
    
    //Start the json loop running
    this.startJsonLoop = function(){
        this.getNext();
    }
    
    //Handle the toggle of the loop paused/running
    this.togglePauseJsonLoop = function(){
        if (this.loopState == 1){
            this.loopState = 0;
            windmill.ui.toggleLoopButtonText();
        }
        else {
            this.loopState = 1;
            windmill.ui.toggleLoopButtonText();
            windmill.xhr.getNext();
        }
    }    
}