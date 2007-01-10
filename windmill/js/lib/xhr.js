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
    this.xhr_response = null;
    
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
        if (Windmill.XHR.xhr_response.error){
          alert('There was a serious error with json syntax');
        }
        else{
            
            //Run the action
            //if (Windmill.XHR.xhr_response.params == undefined){    
                result = eval ('Windmill.Controller.' + Windmill.XHR.xhr_response.result.method + '( );');
            //}
            //else{
                //alert(Windmill.XHR.resp.result.params);
                //result = eval ('Windmill.Controller.' + Windmill.XHR.resp.result.method + '(' + Windmill.XHR.xhr_response + ');');
                //result = eval ('Windmill.Controller.' + Windmill.XHR.resp.result.method + '(true)');
                
            //}
            
            //Make an XHR call to get next action if loop is running
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