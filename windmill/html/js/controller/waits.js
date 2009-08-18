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
    windmill.continueLoop();
    //we passed the id in the parms object of the action in the ide
    var aid = paramObj.aid;
    delete paramObj.aid;
    //set the result in the ide
    windmill.xhr.setWaitBgAndReport(aid,true,obj);
  }    
  setTimeout('done()', paramObj.milliseconds);
};
  
windmill.controller.waits.forJS = function (paramObj, obj, pageLoad) { 
  _this = this;
  
  //we passed the id in the parms object of the action in the ide
  var jsTest = windmill.jsTest;
  var aid = paramObj.aid;
  delete paramObj.aid;
  var count = 0;
  var p = paramObj || {};
  var timeout = windmill.timeout;
  var isJsTest = (p.origin == 'js');
  var jsCode = p.js || p.test;

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
      // JS tests -- report error and return control either to
      // the array-test loop, or the normal test loop, by calling
      // the passed-in callback
      if (isJsTest) {
        var msg = 'Wait timed out after ' + timeout + ' milliseconds.';
        jsTest.waitsCallback.call(jsTest, p.testName, new Error(msg));
        return;
      }
      else {
        if (pageLoad){ 
          windmill.loaded();
          windmill.continueLoop();
        }
        else { windmill.continueLoop(); }
      }
      windmill.xhr.setWaitBgAndReport(aid,false,obj);
      return false;
    }
    count += 100;
    
    // Get a result
    var result;
    try {
      if (typeof jsCode == 'string') {
        result = eval(jsCode);
      }
      else if (typeof jsCode == 'function' ||
          (fleegix.isIE && jsCode.toString().indexOf('function') == 0)) {
        result = jsCode();
      }
      else {
        throw new Error('waits.forJS js property must be a function, or string to eval.');
      }
    }
    catch (e) {
      // JS tests -- report error and return control either to
      // the array-test loop, or the normal test loop, by calling
      // the passed-in callback
      if (isJsTest) {
        jsTest.waitsCallback.call(jsTest, p.testName, e);
        return; // Don't keep looping! :)
      }
      else {
        //waits.forPageLoad is not an assert
        //and since it's not 100% accurate
        //it should never make a test fail
        //thats what wait.forElement is for
        if (!pageLoad){
          throw e;
        }
      }
    }
    result = !!result; // Make sure we've got a Boolean
    
    if (!result){ var x = setTimeout(lookup, 100); }
    else {
        c = function () {
          // JS tests -- return control either to the array-test loop,
          // or the normal test loop, by calling the passed-in callback
          if (isJsTest) {
            jsTest.waitsCallback.call(jsTest, p.testName);
          }
          else{ 
             if (pageLoad){ windmill.loaded(); }
             else{ windmill.continueLoop(); }
          }
        
           //set the result in the ide
           if (windmill.chatty){
             windmill.xhr.setWaitBgAndReport(aid,true,obj);
           }
        }
      if ((windmill.browser.isSafari) || (windmill.browser.current_ua.indexOf('firefox/2') != -1)){
        setTimeout(c, 1500);
      }
      else{ setTimeout(c, 800); }
    }
  }
  
  //start the looking up
  lookup();
};

windmill.controller.waits.forJSTrue = windmill.controller.waits.forJS;

//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits.forElement = function (paramObj,obj) { 
    var p = paramObj || {};
    var f = function () {
      try { return lookupNode(p, false); }
      catch(err){}
    };
    p.test = f;
    return windmill.controller.waits.forJS(p, obj);
};

//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits.forElementProperty = function (paramObj,obj) { 
    var p = paramObj || {};
    var vArray = p.option.split('|');

    //if there is a timeout
    if (vArray[2]){
      paramObj.timeout = vArray[3];
    }
    //function
    var f = function () {
      try { 
        var node = lookupNode(p, false);
        var value = eval ('node.' + vArray[0]+';');
      
        if (value == vArray[1]){
          return true;
        }
      }
      catch(err){}
    };
    p.test = f;
    return windmill.controller.waits.forJS(p, obj);
};

//wait for an element to show up on the page
//if it doesn't after a provided timeout, defaults to 20 seconds
windmill.controller.waits.forNotElement = function (paramObj,obj) { 
    var p = paramObj || {};
    var f = function () {
      try{
        var node = lookupNode(p, false);
        return !node; 
      }
      catch(err){
        // looking up the node failed, so notElement is "true"
        return true;
      }
    };
    p.test = f;
    return windmill.controller.waits.forJS(p, obj);
};

//This is more of an internal function used by wait and click events
//To know when to try and reattach the listeners
//But if users wanted this manually they could use it
windmill.controller.waits.forPageLoad = function (paramObj,obj) {

  var p = paramObj || {};
  var sl = function(){
    var f = function () {
      //If the document.domain can't be accessed
      try {
        var v = windmill.testWin().document.domain;
      }catch(err){
//        document.domain = windmill.docDomain;
      }
      //check to see if we can get the window body
      try {
        var d = windmill.testWin().document.body.style;
      }catch(err){ d = null;}
      
      if (d != null){
        return true;
      }
      return false;
    };
    p.test = f;
    
    return windmill.controller.waits.forJS(p, obj, true);
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
        if (windmill.testWin().document.title != p.title){
          var d = windmill.testWin().document.body.style;
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
    return windmill.controller.waits.forJS(p, obj, true);
};
