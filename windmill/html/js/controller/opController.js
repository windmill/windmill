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

//Opera specific controller functions

windmill.controller.what = function() {
  alert('Internet Explorer');
}
  
windmill.controller.click = function(paramObject){        
  var element = lookupNode(paramObject);
  windmill.events.triggerEvent(element, 'focus', false);

  // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
  try {windmill.events.triggerMouseEvent(element, 'mousedown', true); } catch(err){}
  try {windmill.events.triggerMouseEvent(element, 'mouseup', true); } catch(err){}
  

  if (paramObject.options){
    var arr = paramObject.options.split(',');
    arr.unshift(element, 'click', true, null, null);
    try { windmill.events.triggerMouseEvent.apply(this, arr); } catch(err){}
  }
  else { 
    try {windmill.events.triggerMouseEvent(element, 'click', true); } catch(err){}  
  }
  
};
  
//Sometimes opera requires that you manually toggle it
windmill.controller.check = function(paramObject){
  //return windmill.controller.click(paramObject);
  var element = lookupNode(paramObject);
  windmill.events.triggerEvent(element, 'focus', false);

  var state = element.checked;
  // And since the DOM order that these actually happen is as follows when a user clicks, we replicate.
  try {windmill.events.triggerMouseEvent(element, 'mousedown', true); } catch(err){}
  try {windmill.events.triggerMouseEvent(element, 'mouseup', true); } catch(err){}
  try {windmill.events.triggerMouseEvent(element, 'click', true); } catch(err){}

  //if the event firing didn't toggle the checkbox, do it directly
  if (element.checked == state){
    if (element.checked){
      element.checked = false;
    }
    else {
      element.checked = true;
    }
  }
};

//Radio buttons are even WIERDER in safari, not breaking in FF
windmill.controller.radio = function(paramObject){
  return windmill.controller.click(paramObject);
};
  
//double click for ie
windmill.controller.doubleClick = function(paramObject){      
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
   element.value += s.charAt(c);
   windmill.events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
   windmill.events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
   windmill.events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
  }

  // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
  //Another wierd chrome thing?
  windmill.events.triggerEvent(element, 'change', true);

};
  
