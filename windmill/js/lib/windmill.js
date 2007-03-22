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

function windmillObject(browser) {
    
    this.Browser = browser;
    
    //Setup log4js object
    this.Log =  new Log4js.getLogger("windmill_log");
    this.Log.setLevel(Log4js.Level.ALL);
    
    //Setup controller
    this.Controller = new Controller();
    
    //Setup performance
    this.Performance = new Performance();
    
    //Init UI functionality
    this.UI = new UI();
    
    //Init XHR and loop stuff
    this.XHR = new XHR();
    
    //The app your testing
     this.TestingApp = parent.frames['webapp'];
        
    this.Start = function(){
        //Index page load report
          load_timer.endTime();

          Windmill.UI.writeResult("Start UI output session.<br> <b>User Environment: " + browser.current_ua + ".</b><br>");
          Windmill.UI.writePerformance("Starting UI performance session.<br> <b>User Environment: " + browser.current_ua + ".</b><br>");
          load_timer.write();
    }
    
    //Windmill Options to be set
    this.stopOnFailure = true;
    this.showRemote = true;
    
};

//Instantiate the windmill object, had to move it here because if I do it in the onload I can't call its members in the start.html body
Windmill = new windmillObject(browser);



