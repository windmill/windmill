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
         if (!element){
                return false;
         }
            
          // Trigger the event.
            // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
            triggerMouseEvent(element, 'mousedown', true);
            triggerMouseEvent(element, 'mouseup', true);
            triggerMouseEvent(element, 'click', true);
         
         if (element.href && (element.href.indexOf('javascript:', 0) == -1)){
             Windmill.XHR.loopState = 0;
         }
         
         return true;
  };
  
  //there is a problem with checking via click in safari
  Controller.prototype.check = function(param_object){

      return Windmill.Controller.click(param_object);

  }

  //Radio buttons are even WIERDER in safari, not breaking in FF
  Controller.prototype.radio = function(param_object){
      //var element = this.lookup_dispatch(param_object);
      return Windmill.Controller.click(param_object);

  }
  
  //double click for ie, needs to be tested
  Controller.prototype.doubleClick = function(param_object){
         
         var element = this.lookup_dispatch(param_object);
         if (!element){
                return false;
         }
         
         triggerEvent(element, 'focus', false);

           // Trigger the mouse event.
           triggerMouseEvent(element, 'dblclick', true);

         /*  if (this.windowClosed()) {
               return;
           }*/

           triggerEvent(element, 'blur', false);
           
           return true;
  };
 
  