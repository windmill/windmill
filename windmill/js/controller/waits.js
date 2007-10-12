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

//Wait a specified number of milliseconds
windmill.controller.waits.sleep = function (param_object) { 
  //console.log('inside sleep');
  done = function(){
    //console.log('inside done');
    windmill.waiting = false;
    windmill.controller.continueLoop();
    return true;
  }    
  setTimeout('done()', param_object.milliseconds);
  return true;
};
  
//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits.forElement = function (param_object) { 
  _this = this;

  var timeout = 20000;
  var count = 0;
  var p = param_object;
    
  if (p.timeout){
    timeout = p.timeout;
  }

  this.lookup = function(){
    if (count >= timeout){
      windmill.controller.continueLoop();
      return false;
    }
    var n = windmill.controller._lookupDispatch(p);
    count += 2500;
      
    this.check(n);
  }
    
  this.check = function(n){   
    if (!n){
      var x = setTimeout(function () { _this.lookup(); }, 1500);
    }

    else{
      windmill.waiting = false;
      windmill.controller.continueLoop();
      return true;
    }
  }
   
  this.lookup();
   
  //waits are going to wait, so I return true
  //Optimally it would return false if it times out, so when it does return false
  //the calling code will jump back up and process the ui accordingly
  return true;
};
  
//This is more of an internal function used by wait and click events
//To know when to try and reattach the listeners
//But if users wanted this manually they could use it
windmill.controller.waits.forPageLoad = function (param_object) { 
  _this = this;
  
  //Attach an onload listener to the new window
  //fleegix.event.unlisten(windmill.testWindow, 'onload', windmill, 'loaded');
  //fleegix.event.listen(windmill.testWindow, 'onload', windmill, 'loaded');

  var timeout = 20000;
  var count = 0;
  var p = param_object;
    
  if (p.timeout){
    timeout = p.timeout;
  }
  this.lookup = function(){
    if (count >= timeout){
      windmill.waiting = false;
      windmill.controller.continueLoop();
      return false;
    }
    //var n = windmill.controller._lookupDispatch(p);
    try { var n = windmill.testWindow.document;}
    catch(err) { var n = false; }
    
    count += 2500;
    this.check(n);
  }
    
  this.check = function(n){   
    if (!n){
      var x = setTimeout(function () { _this.lookup(); }, 1000);
    }
    else{
      //If we get here it means that the window onload wasn't attached
      //or it was attached and wiped out. We were able to grab the document
      //Object so the page is mostly loaded, reattach the listener
      try {
        if (typeof(windmill.testWindow.onload.listenReg) == 'undefined'){
          windmill.waiting = false;
          windmill.loaded();
        }
      }
      catch(err){
        windmill.waiting = false;
        windmill.loaded();
      }
      //default with the timeout to start running tests again if onload never gets launched
      return true;
    }
  }
  
  this.lookup();
  return true;
}
  
//Turn the loop back on when the page in the testingApp window is loaded
//this is an internal wait used only for the first load of the page
//a more generic one will be added if there is a need
windmill.controller.waits._forNotTitleAttach = function (param_object) { 
  _this = this;

  var timeout = 20000;
  var count = 0;
  var p = param_object;
    
  if (p.timeout){
    timeout = p.timeout;
  }
  this.lookup = function(){
    if (count >= timeout){
      windmill.waiting = false;
      windmill.controller.continueLoop();
      return false;
    }
    //var n = windmill.controller._lookupDispatch(p);
    try {
      if (windmill.testWindow.document.title == p.title){
	      var n = null;
      }
      else { var n = true };
    }
    catch(err){
      n = null;
    }
    count += 2500;
      
    this.check(n);
  }
    
  this.check = function(n){   
    if (!n){
      var x = setTimeout(function () { _this.lookup(); }, 1000);
    }
    else{
      
      try {
        if (typeof(windmill.testWindow.onload.listenReg) == 'undefined'){
          windmill.waiting = false;
          windmill.loaded();
        }
      }
      catch(err){
      }
      
      fleegix.event.unlisten(windmill.testWindow, 'onload', windmill, 'loaded');
      fleegix.event.listen(windmill.testWindow, 'onload', windmill, 'loaded');
      
      //if this doesn't happen for some reason, we wanna get the tests running
      //if the testWindow takes more than 10 seconds to load they can pass a timeout manually
      //that will ensure that it waits longer

      return true;
    }
  }
   
  this.lookup();
  return true;
}
