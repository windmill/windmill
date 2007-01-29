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
    this.loop_state = 1;
   
    //json_call
    this.json_call = function(version, method, params){
        this.version = version || null;
        this.method = method || null;
        this.params = params || [];
    }

    //action callback
    this.action_handler = function(str){

        Windmill.XHR.xhr_response = eval('(' + str + ')');
       
        //If there was a legit json response
        if ( Windmill.XHR.xhr_response.error ){
            Windmill.Log.debug("There was a JSON syntax error: '" + Windmill.XHR.xhr_response.error + "'");
        }
        else{
            
            //Init and start performance but not if the protocol defer
            if (Windmill.XHR.xhr_response.result.method != 'defer'){
                
                var action_timer = new TimeObj();
                action_timer.set_name(Windmill.XHR.xhr_response.result.method);
                action_timer.start_time();
            }
            
            //Run the action  
            try { //result = Windmill.Controller.click(Windmill.XHR.xhr_response.result.params); }
                var result = Windmill.Controller[Windmill.XHR.xhr_response.result.method](Windmill.XHR.xhr_response.result.params); 
                //eval("result=" + "Windmill.Controller." + Windmill.XHR.xhr_response.result.method + "(" + Windmill.XHR.xhr_response.result.params + ");");
            }
            catch (error) { 
                //result = false;
                Windmill.Log.debug("Error Executing " + Windmill.XHR.xhr_response.result.method);
                Windmill.UI.write_result('Error: Non DOM error running '+ Windmill.XHR.xhr_response.result.method);
                
            }
            
            //If we have a false result we need to freeze the loop
            //Then tell the user we did that
            if (result == false){
                Windmill.XHR.toggle_pause_json_loop();
                alert("There was an error in the "+Windmill.XHR.xhr_response.result.method+" action, so your execution loop was paused. Goto the 'Action Loop' tab to resume.");
            }
            
            //End and store the performance
            if (Windmill.XHR.xhr_response.result.method != 'defer'){
                action_timer.end_time();
                action_timer.write();
                
                //Send the report
                Windmill.XHR.send_report(Windmill.XHR.xhr_response.result.method, result, action_timer);
                
                //Write to the result tab
                Windmill.UI.write_result(Windmill.XHR.xhr_response.result.method + ": " + result);     
    
            }

            //If the loop is running make the next request    
            if (Windmill.XHR.loop_state != 0){
                //Sleep for a few seconds before doing the next xhr call
                setTimeout("Windmill.XHR.get_next()", 2000);
            }
        }
    }
    
    //Make sure we get back a confirmation
    this.report_handler = function(str){
        response = eval('(' + str + ')');
        
        if (!response.result == 200){
            Windmill.UI.write_result('Error: Report receiving non 200 response.');
        }
    }
    
    
    //Send the report
    this.send_report = function(method, result, timer){
        
        //Get the result into a string
        var result_string = fleegix.json.serialize(Windmill.XHR.xhr_response.result)
        
        //Append the results of the test run
        var object_string = '{"test":'+ result_string + ',"result": '+ result +', "starttime":"'+ timer.get_start() + '", "endtime":"'+ timer.get_end() +'"}';
        
        //Turn this into an object
        var test_obj = eval('(' + object_string + ')');
        
        //Create the json call object
        var json_object = new this.json_call('1.1', 'report');
        
        //Set the params
        json_object.params = test_obj;
        
        //Serialze the whole thing
        var json_string = fleegix.json.serialize(json_object);
       
        //Actually send the report
        fleegix.xhr.doPost(this.report_handler, '/windmill-jsonrpc/', json_string);
    }
    
    //Get the next action from the server
    this.get_next = function(){
        var json_object = new this.json_call('1.1', 'next_action');
        var json_string = fleegix.json.serialize(json_object)
        fleegix.xhr.doPost(this.action_handler, '/windmill-jsonrpc/', json_string);
    }
    
    //Start the json loop running
    this.start_json_loop = function(){
        this.get_next();
    }
    
    //Handle the toggle of the loop paused/running
    this.toggle_pause_json_loop = function(){
        if (this.loop_state == 1){
            this.loop_state = 0;
            Windmill.UI.toggle_loop_button_text();
        }
        else {
            this.loop_state = 1;
            Windmill.UI.toggle_loop_button_text();
            Windmill.XHR.get_next();
        }
    }    
}