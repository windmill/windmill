  windmill.controller.waits.sleep = function (param_object) { 
    windmill.xhr.loopState = 0;
    //make sure the current iteration has time to stop
    done = function(){
      windmill.xhr.loopState = 1;
      windmill.xhr.getNext();
      return true;
    }    
    setTimeout('done()', param_object.milliseconds);
  };
  
  windmill.controller.waits.forElement = function (param_object) { 
    return;
  };
  