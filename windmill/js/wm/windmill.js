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

var windmill = new function () {
    this.browser = null;
    
    this.init = function (b){
        this.browser = b;
    }
    
    //More namespacing
    this.builder={};
    this.helpers={};
    
    //We need to allow users to store data locally
    //So we are using the fleegix hash data structure
    this.varRegistry = new fleegix.hash.Hash();
    
    //The app your testing
     this.testingApp = parent.frames['webapp'];
    
    this.Start = function(){
      //Index page load report
      load_timer.endTime();

      windmill.ui.results.writeResult("<br>Start UI output session.<br> <b>User Environment: " + 
      browser.current_ua + ".</b><br>");
      windmill.ui.results.writePerformance("<br>Starting UI performance session.<br> <b>User Environment: " + 
      browser.current_ua + ".</b><br>");
      load_timer.write();

    }
    
    //windmill Options to be set
    this.stopOnFailure = false;
    this.showRemote = true;
    this.runTests = true;
    
};

//Set the browser
windmill.init(browser);
