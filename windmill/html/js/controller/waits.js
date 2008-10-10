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
windmill.controller.waits.sleep = function (paramObj, obj) { 
  windmill.waiting = true;
  //if a number of milliseconds werent provided in a int format
  if ((paramObj.milliseconds == "") || (parseInt(paramObj.milliseconds, 10) == NaN)){
    paramObj.milliseconds = 5000;
  }
  
  done = function(){
    windmill.waiting = false;
    windmill.controller.continueLoop();
    //we passed the id in the parms object of the action in the ide
    var aid = paramObj.aid;
    delete paramObj.aid;
    //set the result in the ide
    windmill.xhr.setWaitBgAndReport(aid,true,obj);
  }    
  setTimeout('done()', paramObj.milliseconds);
  return true;
};
  
windmill.controller.waits.forJSTrue = function (paramObj, obj, pageLoad) { 
  _this = this;
  
  //we passed the id in the parms object of the action in the ide
  var aid = paramObj.aid;
  delete paramObj.aid;
  var count = 0;
  var p = paramObj || {};
  var timeout = 8000;
  var isJsTest = (p.orig == 'js');
  var testCondition = p.test;
  
  // If we get the weird string "NaN" (yes, the actual 
  // string, "NaN" :)) value from the IDE, or some other 
  // unusable string , just use the default value of 20 seconds
  if (p.timeout) {
    if (parseInt(p.timeout, 10) != NaN){
      timeout = p.timeout;
    }
  }
  
  //implement windmill safe waits
  //most browser javascript interpreters time out when the wait is greater than 60 seconds
  if ((windmill.safeWaits) && (timeout > 60000)){
    timeout = 60000;
  }
  
  //lookup method
  var lookup = function () {
    if (count >= timeout) {
      if (isJsTest) {
        windmill.jsTest.runTestItemArray();
        windmill.jsTest.waiting = false;
        windmill.jsTest.handleErr('waits.forElement timed out after ' + timeout + ' seconds.');
      }
      else {
        if (pageLoad){ 
          windmill.loaded();
          windmill.controller.continueLoop();
        }
        else{ windmill.controller.continueLoop(); }
      }
      windmill.xhr.setWaitBgAndReport(aid,false,obj);
      return false;
    }
    count += 100;
    
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
    
    if (!result){ var x = setTimeout(lookup, 100); }
    else {
        c = function () {
          //If this method is being called by the js test framework
          if (isJsTest) {
            windmill.jsTest.waiting = false;
            windmill.jsTest.runTestItemArray();
          }
          else{ 
             if (pageLoad){ windmill.loaded(); }
             else{ windmill.controller.continueLoop(); }
          }
        
           //set the result in the ide
            windmill.xhr.setWaitBgAndReport(aid,true,obj);
        }
      setTimeout(c, 500);
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
windmill.controller.waits.forElement = function (paramObj,obj) { 
    var p = paramObj || {};
    var f = function () {
      try { return windmill.controller._lookupDispatch(p); }
      catch(err){}
    };
    p.test = f;
    return windmill.controller.waits.forJSTrue(p, obj);
};
  
//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits.forNotElement = function (paramObj,obj) { 
    var p = paramObj || {};
    var f = function () {
      try{
        var node = windmill.controller._lookupDispatch(p);
        return !node; 
      }
      catch(err){}
    };
    p.test = f;
    return windmill.controller.waits.forJSTrue(p, obj);
};

//This is more of an internal function used by wait and click events
//To know when to try and reattach the listeners
//But if users wanted this manually they could use it
windmill.controller.waits.forPageLoad = function (paramObj,obj) {

  var p = paramObj || {};
  var sl = function(){
    var f = function () {
      try {
        var v = opener.document.domain;
      }catch(err){
        document.domain = windmill.docDomain;
      }
      try {
        var d = opener.document.body.style;
      }catch(err){ d = null;}
      
      if (d != null){
        return true;
      }
      
      return false;
    };
    p.test = f;
    
    return windmill.controller.waits.forJSTrue(p, obj, true);
  }
  setTimeout(sl, 500);
  //we can't access the body, so now wait for the loading
  //setTimeout(sl, 0);
}
  
//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits._forNotTitleAttach = function (paramObj, obj) { 
    var p = paramObj || {};
    var f = function () {
      try {
        windmill.setEnv();
        if (opener.document.title != p.title){
          var d = opener.document.body.style;
          windmill.start();
          return true;
        }
        return false;
      } catch(err){
        return false; 
      }
    };
    p.test = f;
    p.timeout = 60000;
    return windmill.controller.waits.forJSTrue(p, obj, true);
};