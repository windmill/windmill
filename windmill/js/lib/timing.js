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

function TimeObj() {
    
    var time_started = '0:0:0:0';
    var time_ended = '0:0:0:0';
    var start_ms = 0;
    var end_ms = 0;
    var run_time = '';
    var identifier = '';
    
  this.get_start = function(){
      return time_started;
  }
  
  this.get_end = function(){
        return time_ended;
    }
   
    //Set the identifier 
    this.set_name = function(identifier){
        this.identifier = identifier;
    }
    
    //Calculate how long it took
    this.calculate_time = function(){
         run_time = end_ms - start_ms;
    }
    
    //Used for users who want to log the time and MS so they can compute how long a test took to run
    this.start_time = function(){

        var d = new Date();
        start_ms = d.getTime();
    	time_started = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours() 
    	+ ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + 'Z'; 
    }

    //Storing end time used for performance computation
    this.end_time = function(identifier){

        var d = new Date();
        end_ms  = d.getTime();
        time_ended = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours() + ':' 
        + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + 'Z';
    }
    
    //Write to the log div
    this.write = function(parameters){
         this.calculate_time(); 
         var perf_tab = document.getElementById("tab3");
        
        if(!parameters){
            perf_tab.innerHTML = perf_tab.innerHTML + "<br>Executing: " + this.identifier;
        }
        else{
          perf_tab.innerHTML = perf_tab.innerHTML + "<br>Executing: " + this.identifier + " - Parameters: " + parameters;    
        }
               
         perf_tab.innerHTML = perf_tab.innerHTML + "<br>Starting: " + this.identifier + " : " + time_started;
         perf_tab.innerHTML = perf_tab.innerHTML + "<br>Ending: " + this.identifier + " : " + time_ended;
         perf_tab.innerHTML = perf_tab.innerHTML + "<br>Total: " + this.identifier + " : " + run_time + " ms<br>";
         perf_tab.scrollTop = perf_tab.scrollHeight;
    
    }
    
};
