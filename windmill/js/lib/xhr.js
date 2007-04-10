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
//Mozilla specific functionality abstracted to mozController.js
//Safari specific functionality abstracted to safController.js
//IE specific functionality abstracted to ieController.js

//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the Controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.

function XHR() {
    
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

        Windmill.XHR.xhrResponse = eval('(' + str + ')');

        //If there was a legit json response
        if ( Windmill.XHR.xhrResponse.error ){
            Windmill.Log.debug("There was a JSON syntax error: '" + Windmill.XHR.xhrResponse.error + "'");
        }
        else{
            
            if (Windmill.XHR.xhrResponse.result.method != 'defer'){
                Windmill.UI.writeStatus("Status: Running " + Windmill.XHR.xhrResponse.result.method + "...");   
            }
            else{
                Windmill.UI.writeStatus("Status: Waiting for tests...");
            }
            
            //Init and start performance but not if the protocol defer
            if (Windmill.XHR.xhrResponse.result.method != 'defer'){
                
                //Put on windmill main page that we are running something
                var action_timer = new TimeObj();
                action_timer.setName(Windmill.XHR.xhrResponse.result.method);
                action_timer.startTime();

                //Run the action 
                try {
                    var result = Windmill.Controller[Windmill.XHR.xhrResponse.result.method](Windmill.XHR.xhrResponse.result.params); 
                }
                catch (error) {
                    result = false;
                }

                //End timer and write
                action_timer.endTime();
                var to_write = fleegix.json.serialize(Windmill.XHR.xhrResponse.result);
                action_timer.write(to_write);

                //Send the report
                Windmill.XHR.sendReport(Windmill.XHR.xhrResponse.result.method, result, action_timer);

                //if we had an error display in UI
                if (result == false){
                    
                    Windmill.UI.writeResult("<font color=\"#FF0000\">There was an error in the "+Windmill.XHR.xhrResponse.result.method+" action.</font>");
                    Windmill.UI.writeResult("<br>Action: <b>" + Windmill.XHR.xhrResponse.result.method + "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#FF0000\"><b>" + result + '</b></font>');     
                    //alert("There was an error in the "+Windmill.XHR.xhrResponse.result.method+" action, so your execution loop was paused. Goto the 'Action Loop' tab to resume.");
      
                    //if the continue on error flag has been set by the shell.. then we just keep on going
                    if (Windmill.stopOnFailure == true){
                        Windmill.XHR.togglePauseJsonLoop();
                        Windmill.UI.writeStatus("Status: Paused, error?...");    
                        
                    }
                }

                else{
                    //Write to the result tab
                    Windmill.UI.writeResult("<br>Action: <b>" + Windmill.XHR.xhrResponse.result.method + "</b><br>Parameters: " + to_write + "<br>Test Result: <font color=\"#61d91f\"><b>" + result + '</b></font>');     
                }

            }
        }
          
        //If the loop is running make the next request    
        if (Windmill.XHR.loopState != 0){
            //Sleep for a few seconds before doing the next xhr call
            setTimeout("Windmill.XHR.getNext()", 2000);
        }
          
    }
      
    //Make sure we get back a confirmation
    this.reportHandler = function(str){
        response = eval('(' + str + ')');
        
        if (!response.result == 200){
            Windmill.UI.writeResult('Error: Report receiving non 200 response.');
        }
    }
    
    
    //Send the report
    this.sendReport = function(method, result, timer){
        
        //Get the result into a string
        var result_string = fleegix.json.serialize(Windmill.XHR.xhrResponse.result)
        
        //Append the results of the test run
        var object_string = '{"test":'+ result_string + ',"result": '+ result +', "starttime":"'+ timer.getStart() + '", "endtime":"'+ timer.getEnd() +'"}';
        
        //Turn this into an object
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
            Windmill.UI.toggleLoopButtonText();
        }
        else {
            this.loopState = 1;
            Windmill.UI.toggleLoopButtonText();
            Windmill.XHR.getNext();
        }
    }    
}