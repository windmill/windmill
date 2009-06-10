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
windmill.controller.click = function(paramObject){
    var element = lookupNode(paramObject);
    windmill.events.triggerEvent(element, 'focus', false);

    // Add an event listener that detects if the default action has been prevented.
    // (This is caused by a javascript onclick handler returning false)
    // we capture the whole event, rather than the getPreventDefault() state at the time,
    // because we need to let the entire event bubbling and capturing to go through
    // before making a decision on whether we should force the href
    var savedEvent = null;

    element.addEventListener('click', function(evt) {
        savedEvent = evt;
    }, false);
    
    // Trigger the event.
    windmill.events.triggerMouseEvent(element, 'mousedown', true);
    windmill.events.triggerMouseEvent(element, 'mouseup', true);
    
    //if click options are attached for keyboard keys
    if (paramObject.options){
      var arr = paramObject.options.split(',');
      arr.unshift(element, 'click', true, null, null);
      windmill.events.triggerMouseEvent.apply(this, arr);
    }
    else { windmill.events.triggerMouseEvent(element, 'click', true); }

    try {
      // Perform the link action if preventDefault was set.
      // In chrome URL, the link action is already executed by triggerMouseEvent.
      if (!browser.isChrome && savedEvent != null && !savedEvent.getPreventDefault()) {
          if ((element.href) && (element.href != "#")) {
              //windmill.controller.open({"url": element.href, 'reset':false});
              if (element.target.length > 0) {
                  getParentWindow(element).open(element.href, element.target);
              }
              else {
                  getParentWindow(element).location = element.href;
              }
          } 
          else {
              var itrElement = element;
              while (itrElement != null) {
                if ((itrElement.href) && (itrElement.href != "#")) {
                  getParentWindow(itrElement).location = itrElement.href;
                  //windmill.controller.open({"url": itrElement.href, 'reset':false});
                  break;
                }
                itrElement = itrElement.parentNode;
              }
          }
      }
    }
    catch(err){}
};

//there is a problem with checking via click in safari
windmill.controller.check = function(paramObject){
  return windmill.controller.click(paramObject);    
};

//Radio buttons are even WIERDER in safari, not breaking in FF
windmill.controller.radio = function(paramObject){
  return windmill.controller.click(paramObject);      
};

//Double click for Mozilla
windmill.controller.doubleClick = function(paramObject) {
 //Look up the dom element, return false if its not there so we can report failure
 var element = lookupNode(paramObject);
 windmill.events.triggerEvent(element, 'focus', false);
 windmill.events.triggerMouseEvent(element, 'dblclick', true);
 windmill.events.triggerEvent(element, 'blur', false);
};

//Type Function
 windmill.controller.type = function (paramObject){
   var element = lookupNode(paramObject);

   //clear the box
   element.value = '';
   //Get the focus on to the item to be typed in, or selected
   windmill.events.triggerEvent(element, 'focus', false);
   windmill.events.triggerEvent(element, 'select', true);
    
   //Make sure text fits in the textbox
   var maxLengthAttr = element.getAttribute("maxLength");
   var actualValue = paramObject.text;
   var stringValue = paramObject.text;
    
   if (maxLengthAttr != null) {
     var maxLength = parseInt(maxLengthAttr);
     if (stringValue.length > maxLength) {
       //truncate it to fit
       actualValue = stringValue.substr(0, maxLength);
     }
   }
   
   var s = actualValue;
   for (var c = 0; c < s.length; c++){
     windmill.events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
     windmill.events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
     if (s.charAt(c) == "."){
       element.value += s.charAt(c);
     }
     windmill.events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
   }
   //if for some reason the key events don't do the typing
   if (element.value != s){
     element.value = s;
   }
    
   // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
   //Another wierd chrome thing?
   windmill.events.triggerEvent(element, 'change', true);
 };
