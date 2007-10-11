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

//Mozilla specific controller functions
//more
windmill.controller.what = function() {
    alert('Mozilla');
}

//Click function for Mozilla with Chrome
windmill.controller.click = function(param_object){
      var element = this._lookupDispatch(param_object);
      if (!element){ return false; }
      element.addEventListener('click', function(evt) {
           preventDefault = evt.getPreventDefault();
       }, false);
       
       // Trigger the event.
       // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
       windmill.events.triggerMouseEvent(element, 'mousedown', true);
       windmill.events.triggerMouseEvent(element, 'mouseup', true);
       windmill.events.triggerMouseEvent(element, 'click', true);
      
       //Apparently there is some annoying issue with chrome..and this fixes it. Concept from selenium browerbot.
       	if (!browser.isChrome && !preventDefault) {
	        if (element.href) {
             windmill.controller.open({"url":element.href});
             
             //if the url is calling JS then its ajax and we don't need to wait for any full page load.. hopefully.
             if (element.href.indexOf('javascript:', 0) == -1){
                  windmill.xhr.loopState = 0;
                  return true;
              }
           }
        }
       return true;     
};

//there is a problem with checking via click in safari
windmill.controller.check = function(param_object){
  return windmill.controller.click(param_object);    
}

//Radio buttons are even WIERDER in safari, not breaking in FF
windmill.controller.radio = function(param_object){
  return windmill.controller.click(param_object);      
}

//Double click for Mozilla
windmill.controller.doubleClick = function(param_object) {

 //Look up the dom element, return false if its not there so we can report failure
 var element = this._lookupDispatch(param_object);
 if (!element){
    return false;
 }
    
 windmill.events.triggerEvent(element, 'focus', false);

 // Trigger the mouse event.
 windmill.events.triggerMouseEvent(element, 'dblclick', true);

 /*if (this._windowClosed()) {
     return;
 }*/

 windmill.events.triggerEvent(element, 'blur', false);
 
 return true;
};

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
windmill.controller.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
  return windmill.controller.locateElementById(identifier, inDocument, inWindow)
  || windmill.controller.locateElementByName(identifier, inDocument, inWindow)
  || null;
};
