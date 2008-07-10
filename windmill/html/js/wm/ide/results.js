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

//Functions for writing status to the UI
/***************************************/
windmill.ui.results = new function() {

    //Writing to the performance tab
    this.writePerformance = function(str) {
        var resultsDiv = $("perfOut");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML
    }

    this.writeStatus = function(str) {
        //If the remote hasn't fully loaded, this kills the action
        //that is trying to be run, because this code either stalls or dies
        //this makes sure, and is set by the remote onload
        if (windmill.remoteLoaded == true) {
            var status = $("runningStatus");
            status.innerHTML = '<b>Status:</b> ' + str;
        }
    }

    //Writing to the results tab
    this.writeResult = function(str) {
        var resultsDiv = $("resOut");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
    }

};