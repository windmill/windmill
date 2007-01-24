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

//Internet Explorer specific Controller functions

Controller.prototype.what = function() {
    alert('Internet Explorer');
}

    /**
   * In IE, getElementById() also searches by name - this is an optimisation for IE.
   */
  Controller.prototype.locateElementByIdentifer = function(identifier, inDocument, inWindow) {
      return inDocument.getElementById(identifier);
  };
  
  Controller.prototype.click = function(param_object){
         var element = this.lookup_dispatch(param_object);
         triggerMouseEvent(element, 'click', true);
         //element.click();
         
         if (element.href && (element.href.indexOf('javascript:', 0) == -1)){
             Windmill.XHR.loop_state = 0;
         }
  };
  
  //double click for ie, needs to be tested
  Controller.prototype.doubleClick = function(param_object){
         var element = this.lookup_dispatch(param_object);
         
         triggerEvent(element, 'focus', false);

           // Trigger the mouse event.
           triggerMouseEvent(element, 'dblclick', true);

           if (this.windowClosed()) {
               return;
           }

           triggerEvent(element, 'blur', false);
  };
 
  