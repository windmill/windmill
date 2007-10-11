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

var windmill = new function () {
    this.browser = null;
    
    this.init = function (b){
      this.browser = b;
    }
    
    //More namespacing
    this.builder={};
    this.helpers={};
    
    //The timeout for page loading, if the onload is never called
    //how long do we wait before we start firing tests again
    this.timeout = 20000;
    
    //We need to allow users to store data locally
    //So we are using the fleegix hash data structure
    this.varRegistry = new fleegix.hash.Hash();
    
    //The app your testing
    this.testWindow = opener;
    
    //This is so that if you are doing multiple frame testing
    //And you have to change testingApp to point at various frames
    //You can still keep track of the base window
    this.baseTestWindow = opener;
    this.remoteLoaded = false;
    this.remote = parent.window;
    
    
    this.Start = function(){
      windmill.service.setStartURL();
      
      if (windmill.testWindow.document.title == "Windmill Testing Framework"){
        windmill.controller.waits._forNotTitleAttach({"title":"Windmill Testing Framework"});
      }
      else {
       this.controller.continueLoop(); 
      }
      try {
        windmill.ui.results.writeResult("<br>Start UI output session.<br> <b>User Environment: " + 
        browser.current_ua + ".</b><br>");
        windmill.ui.results.writePerformance("<br>Starting UI performance session.<br> <b>User Environment: " + 
        browser.current_ua + ".</b><br>");
      }
      catch(err){}
      //setTimeout("windmill.controller.continueLoop()", 2000);  
      //Set a variable so that windmill knows that the remote has fully loaded
      this.remoteLoaded = true;
    }
    
    //When the page is unloaded turn off the loop until it loads the new one
    this.unloaded = function(){
      console.log('unloaded');

      this.controller.stopLoop();
      checkPage = function(){ windmill.controller.waits.forPageLoad({}); }
      setTimeout('checkPage()', 1000);
    }
    
    //On load setup all the listener stuff
    //Set the listener on the testingApp on unload
    this.loaded = function(){
     console.log('loaded');
       windmill.ui.domexplorer.setExploreState();
       windmill.ui.recorder.setRecState();
       fleegix.event.unlisten(windmill.testWindow, 'onunload', windmill, 'unloaded');
       fleegix.event.listen(windmill.testWindow, 'onunload', windmill, 'unloaded');

     delayed = function(){
       windmill.controller.continueLoop();
     }
     setTimeout('delayed()', 2000);
    }
    
    //windmill Options to be set
    this.stopOnFailure = false;
    this.showRemote = true;
    this.runTests = true;
    
};

//Set the browser
windmill.init(browser);
