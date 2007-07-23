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

//Functions for writing status to the UI
/***************************************/
windmill.ui.results = new function () {
    
    //Writing to the performance tab
    this.writePerformance = function(str){
      var resultsDiv = windmill.remote.$("tab3");
      resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
    }
    
    this.writeStatus = function(str){
      windmill.remote.$("runningStatus").innerHTML = str;
    }
    
    //Writing to the results tab
    this.writeResult = function(str){
        var resultsDiv = windmill.remote.$("tab4");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

};