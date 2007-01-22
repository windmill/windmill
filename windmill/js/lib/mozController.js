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

//Mozilla specific Controller functions
//more
Controller.prototype.what = function() {
    alert('Mozilla');
}

//Click function for Mozilla with Chrome
Controller.prototype.click = function(param_object){
      
       var element = this.lookup_dispatch(param_object);
       
       element.addEventListener('click', function(evt) {
           preventDefault = evt.getPreventDefault();
       }, false);

       // Trigger the event.
       triggerMouseEvent(element, 'click', true);
       
       //Apparently there is some annoying issue with chrome..and this fixes it. Concept from selenium browerbot.
       if (!Windmill.Browser.isChrome && !preventDefault) {
           if (element.href) {
               document.getElementById('webapp').src = element.href;
           } else if (element.parentNode.href){
               document.getElementById('webapp').src = element.parentNode.href;
           }
           else{
               
           }
       }
     
};

//Double click for Mozilla
Controller.prototype.doubleClick = function(param_object) {

 var element = this.lookup_dispatch(param_object);
 triggerEvent(element, 'focus', false);

 // Trigger the mouse event.
 triggerMouseEvent(element, 'dblclick', true);

 if (this._windowClosed()) {
     return;
 }

 triggerEvent(element, 'blur', false);
};

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
Controller.prototype.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
    return Windmill.Controller.locateElementById(identifier, inDocument, inWindow)
            || Windmill.Controller.locateElementByName(identifier, inDocument, inWindow)
            || null;
};
