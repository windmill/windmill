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
windmill.TimeObj = function() {

    var timeStarted = '0:0:0:0';
    var timeEnded = '0:0:0:0';
    var startMS = 0;
    var endMS = 0;
    var runTime = '';
    var identifier = '';
    var runTime = '';
    
    this.getStart = function() {
        return timeStarted;
    }
    this.getEnd = function() {
        return timeEnded;
    }
    this.getRun = function(){
      return runTime;
    }
    //Set the identifier 
    this.setName = function(identifier) {
        this.identifier = identifier;
    }
    //Calculate how long it took
    this.calculateTime = function() {
        runTime = endMS - startMS;
    }
    //Used for users who want to log the time and MS so they can compute how long a test took to run
    this.startTime = function() {
        var d = new Date();
        startMS = d.getTime();
        timeStarted = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours()
        + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + 'Z';
    }

    //Storing end time used for performance computation
    this.endTime = function(identifier) {
        var d = new Date();
        endMS = d.getTime();
        timeEnded = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + 'T' + d.getHours() + ':'
        + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + 'Z';
    }
    //Write to the log div
    this.write = function(params) {
        this.calculateTime();
        
        windmill.perf(this, params);
        
        // windmill.perf("<b>Total: </b><i>" + runTime + "</i> ms");
        // windmill.perf("Ending:  <i>" + timeEnded + "</i>");
        // windmill.perf("Starting: <i>" + timeStarted + "</i>");
        // 
        // if (!parameters) {
        //   windmill.perf("<br><b>Executing: <font color=\"orange\">" + this.identifier + "</font></b>");
        // }
        // else {
        //   var param = eval("(" + parameters + ")");
        //   delete param.uuid;
        //   delete param.test;
        //   parameters = fleegix.json.serialize(param);
        //   windmill.perf("<br><b>Executing: <font color=\"orange\">" + this.identifier + "</font></b><br>"+
        //     "Parameters: " + parameters);
        // }
    }
};

var TimeObj = windmill.TimeObj;

windmill.performance = new function() {
  //Setting up a performance timing object
  timing = new TimeObj();
};
