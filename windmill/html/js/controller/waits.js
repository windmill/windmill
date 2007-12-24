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
  windmill.waiting = true;
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
  
windmill.controller.waits.forJSTrue = function (paramObj) { 
  _this = this;

  var count = 0;
  var p = paramObj || {};
  var timeout = 20000;
  var isJsTest = (p.orig == 'js');
  var testCondition = p.test;
    
  // If we get the weird string "NaN" (yes, the actual 
  // string, "NaN" :)) value from the IDE, or some other 
  // unusable string , just use the default value of 2 seconds
  if (!isNaN(timeout)) {
    timeout = p.timeout;
    if (typeof timeout != 'number'){
      timeout = parseInt(timeout, 10);
    }
  }

  var lookup = function () {
    if (count >= timeout) {
      if (isJsTest) {
        windmill.jsTest.runTestItemArray();
        windmill.jsTest.waiting = false;
        windmill.jsTest.handleErr('waits.forElement timed out after ' + timeout + ' seconds.');
      }
      else {
        windmill.controller.continueLoop();
      }
      return false;
    }
    count += 2500;
    
    // Get a result
    var result;
    if (typeof testCondition == 'string') {
      result = eval(testCondition);
    }
    else if (typeof testCondition == 'function') {
      result = testCondition();
    }
    else {
      throw new Error('waits.forTrue test condition must be a string or function.');
    }
    result = !!result; // Make sure we've got a Boolean
    
    if (!result){
      var x = setTimeout(lookup, 1500);
    }
    else {
        c = function () {
          //If this method is being called by the js test framework
          if (isJsTest) {
            windmill.jsTest.waiting = false;
            windmill.jsTest.runTestItemArray();
          }
          else{
            windmill.controller.continueLoop();
          }
        }
      setTimeout(c, 1000);
    }
  }
    
  lookup();
   
  //waits are going to wait, so I return true
  //Optimally it would return false if it times out, so when it does return false
  //the calling code will jump back up and process the ui accordingly
  return true;

};

//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits.forElement = function (paramObj) { 
    var p = paramObj || {};
    var f = function () {
      return windmill.controller._lookupDispatch(p);
    };
    p.test = f;
    return windmill.controller.waits.forJSTrue(p);
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
          windmill.loaded();
        }
      }
      catch(err){ windmill.loaded(); }
      //default with the timeout to start running tests again if onload never gets launched
      return true;
    }
  }
  this.lookup();
  
  //if windmill.timeout goes by and the tests haven't been started
  //We go ahead and start them, longer waits can happen by changing windmill.timeout
  ct = function(){ 
	 	windmill.controller.continueLoop(); 
	}       
 	windmill.loadTimeoutId = setTimeout('ct()', windmill.timeout);
  
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
      windmill.controller.continueLoop();
      return false;
    }
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
          windmill.loaded();
        }
      }
      catch(err){ this.lookup() }
        fleegix.event.unlisten(windmill.testWindow, 'onload', windmill, 'loaded');
        fleegix.event.listen(windmill.testWindow, 'onload', windmill, 'loaded');
      return true;
    }
  }

  this.lookup();
  
  //if windmill.timeout goes by and the tests haven't been started
  //We go ahead and start them, longer waits can happen by changing windmill.timeout
  ct = function(){ 
	 	windmill.controller.continueLoop(); 
	}       
 	windmill.loadTimeoutId = setTimeout('ct()', windmill.timeout); 
  
  return true;
}
