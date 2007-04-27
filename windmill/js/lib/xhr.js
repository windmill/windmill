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
            else{  windmill.ui.writeStatus("Status: Waiting for tests..."); }
            
            //Init and start performance but not if the protocol defer
            if (windmill.xhr.xhrResponse.result.method != 'defer'){
                
                //Put on windmill main page that we are running something
                var action_timer = new TimeObj();
                action_timer.setName(windmill.xhr.xhrResponse.result.method);
                action_timer.startTime();

                //Run the action
                //If its a user extension.. run it
                try {
                    //var result = windmill.controller[windmill.xhr.xhrResponse.result.method](windmill.xhr.xhrResponse.result.params);
                    if (windmill.xhr.xhrResponse.result.method.indexOf('.') != -1){
                        var mArray = windmill.xhr.xhrResponse.result.method.split(".");
                        result = windmill.controller[mArray[0]][mArray[1]](windmill.xhr.xhrResponse.result.params);  
                    }
                    else{ result = windmill.controller[windmill.xhr.xhrResponse.result.method](windmill.xhr.xhrResponse.result.params); }
                }
                catch (error) { 
                    windmill.ui.writeResult("<font color=\"#FF0000\">There was an error in the "+windmill.xhr.xhrResponse.result.method+" action. "+error+"</font>");
                    windmill.ui.writeResult("<br>Action: <b>" + windmill.xhr.xhrResponse.result.method + "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');     
                }

                //End timer and store
                action_timer.endTime();
                var to_write = fleegix.json.serialize(windmill.xhr.xhrResponse.result);

                //Send the report
                windmill.xhr.sendReport(windmill.xhr.xhrResponse.result.method, result, action_timer);

                //if we had an error display in UI
                if (result == false){
                    //if the continue on error flag has been set by the shell.. then we just keep on going
                    if (windmill.stopOnFailure == true){
                        windmill.xhr.togglePauseJsonLoop();
                        windmill.ui.writeStatus("Status: Paused, error?...");    
                    }
                }

                else{
                    //Write to the result tab
                    windmill.ui.writeResult("<br>Action: <b>" + windmill.xhr.xhrResponse.result.method + "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');     
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