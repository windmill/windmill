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
    var browser = null;
    
    this.init = function (b){
        browser = b;
    }
    
    //So that users can generate a user for the current test randomly
    //Usually you want one username for the test so you can set it once and leave it for the test
    //a user can write a method to set overWrite to true if they want to replace it each time %random% is used in a json test
    this.randomRegistry = new function (){
        var string = null;
        var overWrite = false;
    }
    
    //The app your testing
     this.testingApp = parent.frames['webapp'];
        
    this.Start = function(){
        //Index page load report
          load_timer.endTime();

          windmill.ui.writeResult("<br>Start UI output session.<br> <b>User Environment: " + browser.current_ua + ".</b><br>");
          windmill.ui.writePerformance("<br>Starting UI performance session.<br> <b>User Environment: " + browser.current_ua + ".</b><br>");
          load_timer.write();
          
          
    }
    
    //windmill Options to be set
    this.stopOnFailure = false;
    this.showRemote = true;
    
};

//Set the browser
windmill.init(browser);


