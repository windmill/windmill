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

//Safari specific controller functions

windmill.controller.what = function() {
    alert('Safari');
} 

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
windmill.controller.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
    return PageBot.prototype._locateElementById(identifier, inDocument, inWindow)
            || PageBot.prototype._locateElementByName(identifier, inDocument, inWindow)
            || null;
};

//there is a problem with checking via click in safari
windmill.controller.check = function(param_object){
   return windmill.controller.click(param_object);    
}

//Radio buttons are even WIERDER in safari
windmill.controller.radio = function(param_object){
    var element = this._lookupDispatch(param_object);
    
    element.checked = true;
    
    return true;
}

//Safari Click function
windmill.controller.click = function(param_object){
    var element = this._lookupDispatch(param_object);
    if (!element){ return false; }
    windmill.events.triggerEvent(element, 'focus', false);
      
      // For form element it is simple.
      if (element['click']) {
          element['click']();
      }
      else{
        // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
        if (element.nodeName != 'SELECT'){
          windmill.events.triggerMouseEvent(element, 'mousedown', true);
          windmill.events.triggerMouseEvent(element, 'mouseup', true);
        }
        windmill.events.triggerMouseEvent(element, 'click', true);
      }
   return true;
};

//Double click for Safari
windmill.controller.doubleClick = function(param_object) {

    var element = this._lookupDispatch(param_object);
    if (!element){
           return false;
    }
    
    windmill.events.triggerEvent(element, 'focus', false);

    // Trigger the mouse event.
    windmill.events.triggerMouseEvent(element, 'dblclick', true);

   /* if (this._windowClosed()) {
      return;
      }
   */
    windmill.events.triggerEvent(element, 'blur', false);
    
    return true;
};

