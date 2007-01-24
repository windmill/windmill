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
    
    this.loop_state = 1;
    
    //json_call
    this.json_call = function(version, method, params){
        this.version = version || null;
        this.method = method || null;
        this.params = params || [];
    }

    //callback
    this.my_handler = function(str){

    
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
                result = Windmill.Controller[Windmill.XHR.xhr_response.result.method](Windmill.XHR.xhr_response.result.params); 
                //eval("result=" + "Windmill.Controller." + Windmill.XHR.xhr_response.result.method + "(" + Windmill.XHR.xhr_response.result.params + ");");
                } 
            catch (error) { Windmill.Log.debug("Error Executing " + Windmill.XHR.xhr_response.result.method); }
            
            //End and store the performance
            if (Windmill.XHR.xhr_response.result.method != 'defer'){
                action_timer.end_time();
                action_timer.write();
            }
            
            //If the loop is running make the next request    
            if (Windmill.XHR.loop_state != 0){
                //Sleep for a few seconds before doing the next xhr call
                setTimeout("Windmill.XHR.get_next()", 3000);
            }
        }
    }

    this.get_next = function(){
        var json_object = new this.json_call('1.1', 'next_action');
        var json_string = fleegix.json.serialize(json_object)
        fleegix.xhr.doPost(this.my_handler, '/windmill-jsonrpc/', json_string);
    }
    
    this.start_json_loop = function(){
        this.get_next();
    }
    
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