  //Wait a specified number of milliseconds
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
  
  //wait for an element to show up on the page
  //if it doesn't after a provided timeout, defaults to 20 seconds
  windmill.controller.waits.forElement = function (param_object) { 
    var timeout = 20000;
    var count = 0;
    var p = param_object;
    
    if (p.timeout){
      timeout = p.timeout;
    }

    this.lookup = function(){
      //if we have reached the timeout
      if (count == 20000){
        return false;
      }
      else {
        var n = windmill.controller._lookupDispatch(p);
        count += 2500;
        console.log(count);
      }
      check(n);
    }
    
    this.check = function(n){   
      if (!n){
        console.log(n);
        setTimeout('this.lookup()', 2500);
      }
      else { return true; }
   }
   
   this.lookup();
    
  };
  