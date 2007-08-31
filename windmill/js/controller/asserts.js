  //Currently only does one level below the provided div
  //To make it more thorough it needs recursion to be implemented later
  windmill.controller.asserts.text = function (param_object) { 
      
      var n = windmill.controller._lookupDispatch(param_object);
      var validator = param_object.validator;
    try{
     if (n.innerHTML.indexOf(validator) != -1){
       return true;
     }
     if (n.hasChildNodes()){
        for(var m = n.firstChild; m != null; m = m.nextSibling) {       
         if (m.innerHTML.indexOf(validator) != -1){
          return true;
         }
         if (m.value.indexOf(validator) != -1){
           return true;  
         }
        }
      }
    }
    catch(error){
     return false;
    } 
     return false;
 }; 
   
     //Assert that a specified node exists
  windmill.controller.asserts.node = function (param_object) { 
 
     var element = windmill.controller._lookupDispatch(param_object);
     if (!element){
      return false;
     }
      return true;
   };   
 
  //Assert that a form element contains the expected value
  windmill.controller.asserts.value = function (param_object) { 
     var n = windmill.controller._lookupDispatch(param_object);
     var validator = param_object.validator;
   
     if (n.value.indexOf(validator) != -1){
      return true;
     }
     return false;
   };
 
   // Assert that a an element's property is a particular
    // value
    windmill.controller.asserts.property = function (param_object) { 
 
     var element = windmill.controller._lookupDispatch(param_object);
     if (!element){
      return false;
     }
   
     var vArray = param_object.validator.split('|');
     var value = eval ('element.' + vArray[0]);
     if (value.indexOf(vArray[1]) != -1){
       return true;
     }
     return false;
   };   

  // Assert that a specified image has actually loaded
  // The Safari workaround results in additional requests
  // for broken images (in Safari only) but works reliably
  windmill.controller.asserts.imageLoaded = function (param_object) {
    var img = windmill.controller._lookupDispatch(param_object);
    if (!img || img.tagName != 'IMG') {
      return false;
    }
    var comp = img.complete;
    var ret = null; // Return value

    // Workaround for Safari -- it only supports the
    // complete attrib on script-created images
    if (typeof comp == 'undefined') {
      test = new Image();
      // If the original image was successfully loaded,
      // src for new one should be pulled from cache
      test.src = img.src;
      comp = test.complete;
    }

    // Check the complete attrib. Note the strict
    // equality check -- we don't want undefined, null, etc.
    // --------------------------
    // False -- Img failed to load in IE/Safari, or is
    // still trying to load in FF
    if (comp === false) {
      ret = false;
    }
    // True, but image has no size -- image failed to
    // load in FF
    else if (comp === true && img.naturalWidth == 0) {
      ret = false;
    }
    // Otherwise all we can do is assume everything's
    // hunky-dory
    else {
      ret = true;
    }
    return ret;
  };