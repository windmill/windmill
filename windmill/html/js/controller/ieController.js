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

//Internet Explorer specific controller functions

windmill.controller.what = function() {
  alert('Internet Explorer');
}

/**
 * In IE, getElementById() also searches by name - this is an optimisation for IE.
 */
windmill.controller.locateElementByIdentifer = function(identifier, inDocument, inWindow) {
  return inDocument.getElementById(identifier);
};
  
windmill.controller.click = function(param_object){        
   var element = this._lookupDispatch(param_object);
    if (!element){ return false; }
    windmill.events.triggerEvent(element, 'focus', false);

    // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
    try {windmill.events.triggerMouseEvent(element, 'mousedown', true); } catch(err){}
    try {windmill.events.triggerMouseEvent(element, 'mouseup', true); } catch(err){}
    try {windmill.events.triggerMouseEvent(element, 'click', true); } catch(err){}
  
   return true;
};
  
//there is a problem with checking via click in safari
windmill.controller.check = function(param_object){
  return windmill.controller.click(param_object);
}

//Radio buttons are even WIERDER in safari, not breaking in FF
windmill.controller.radio = function(param_object){
    //var element = this._lookupDispatch(param_object);
    return windmill.controller.click(param_object);
}
  
//double click for ie
windmill.controller.doubleClick = function(param_object){      
   var element = this._lookupDispatch(param_object);
   if (!element){
     return false;
   }
   windmill.events.triggerEvent(element, 'focus', false);

     // Trigger the mouse event.
     //windmill.events.triggerMouseEvent(element, 'dblclick', true, clientX, clientY);
     windmill.events.triggerMouseEvent(element, 'dblclick', true);   
   /* if (this.windowClosed()) {
         return;
     }*/
     windmill.events.triggerEvent(element, 'blur', false);       
  return true;
};
 
  
