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
    var run_time = '';
    var identifier = '';
    
    //Set the identifier 
    this.set_name = function(identifier){
        this.identifier = identifier;
    }
    
    //Calculate how long it took
    this.calculate_time = function(){
        started_array = time_started.split(":");
        ended_array = time_ended.split(":");
        run_time = (ended_array[0] - started_array[0]) + ":" + (ended_array[1] - started_array[1])  + ":" + (ended_array[2] - started_array[2]) + ":" + (ended_array[3] - started_array[3]);
    }
    
    //Used for users who want to log the time and MS so they can compute how long a test took to run
    this.start_time = function(){

        var d = new Date();
        var curr_hour = d.getHours();
        var curr_min = d.getMinutes();
        var curr_sec = d.getSeconds();
        var curr_msec = d.getMilliseconds();

        var time = (curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec);
    	time_started = time;
	
    }

    //Storing end time used for performance computation
    this.end_time = function(identifier){

        var d = new Date();
        var curr_hour = d.getHours();
        var curr_min = d.getMinutes();
        var curr_sec = d.getSeconds();
        var curr_msec = d.getMilliseconds();

        var time = (curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec);
        time_ended = time;

    }
    
    //Write to the log div
    this.write = function(){
         var performanceDiv = parent.document.getElementById("tab3");
         performanceDiv.innerHTML = performanceDiv.innerHTML + "<br>Starting " + identifier + " : " + time_started;
         performanceDiv.innerHTML = performanceDiv.innerHTML + "<br>Ending " + identifier + " : " + time_ended;
         this.calculate_time();
         performanceDiv.innerHTML = performanceDiv.innerHTML + "<br>Total " + identifier + " : " + run_time;
    }
    
};
