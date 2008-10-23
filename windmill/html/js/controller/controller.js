/*
Copyright 2006-2007, Open Source Applications Foundation
 2006, Open Source Applications Foundation
Copyright 2004 ThoughtWorks, Inc

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

/*
 Functionality that works for every browser
 Mozilla specific functionality abstracted to mozcontroller.js
 Safari specific functionality abstracted to safcontroller.js
 IE specific functionality abstracted to iecontroller.js

 The reason for this is that the start page only includes the one corresponding
 to the current browser, this means that the functionality in the controller
 object is only for the current browser, and there is only one copy of the code being
 loaded into the browser for performance.
*/
 
windmill.controller = new function () {
  
  //Some namespacing for controller functionality
  this.extensions           = {};
  this.commands             = {};
  this.asserts              = {};
  this.waits                = {};
    
  this._getDocumentStr = function () { return windmill.testWindowStr + '.document'; }
  this._getWindowStr = function() { return windmill.testWindowStr; }
  this._getDocument = function () { return windmill.testWindow.document; }
  this._getWindow = function() { return windmill.testWindow; }
  

/************************************
/* User facing windmill functionality
/************************************/

  //When the service has nothing for us to do  
  this.defer = function (){
    //At some point we may want to display somewhere that we continually get deferred
    //when the backend has nothing for us to do
  };
  
  //Store an attribute of a DOM element in the variable registry
  this.storeVarFromLocAttrib = function (param_object) {
    var element = lookupNode(param_object);

    var arr = param_object.options.split('|');
    var varName = arr[0];
    var attrib = arr[1];
    
    var attribValue = element[attrib];
    
    if (windmill.varRegistry.hasKey('{$'+varName+'}')){
      windmill.varRegistry.removeItem('{$'+varName +'}');
      windmill.varRegistry.addItem('{$'+varName +'}', attribValue);
    }
    else{
      windmill.varRegistry.addItem('{$'+varName +'}', attribValue);
    }
  };
  
  //expects a name and js param
  this.storeVarFromJS = function (param_object) {
    //extract the options
    var arr = param_object.options.split('|');
    param_object.name = arr[0];
    param_object.js = arr[1];
    
    param_object.value = eval.call(windmill.testWin(), param_object.js);

    //if the code evaled and returned a value add it
    if (windmill.varRegistry.hasKey('{$'+param_object.name +'}')){
      windmill.varRegistry.removeItem('{$'+param_object.name +'}');
      windmill.varRegistry.addItem('{$'+param_object.name +'}',param_object.value);
    }
    else{
      windmill.varRegistry.addItem('{$'+param_object.name +'}',param_object.value);
    }
  };

  //open an url in the webapp iframe
  this.open = function (param_object) {
    //clear the domain forwarding cache
    if (param_object.reset == undefined){
      windmill.service.setTestURL(windmill.initialHost); 
    }
    //We need to tell the service where we are before we
    //head to a new page
    windmill.testWin().location = param_object.url;
  };


  /* Select the specified option and trigger the relevant events of the element.*/
  this.select = function (param_object) {
    var element = lookupNode(param_object);
    
    //if it's already selected
    if (element.options[element.options.selectedIndex].text == param_object['option']){
      return true;
    }
    if (element.options[element.options.selectedIndex].value == param_object['value']){
      return true;
    }
    
    windmill.events.triggerEvent(element, 'focus', false);
    var optionToSelect = null;
    for (opt = 0; opt < element.options.length; opt++){
      try {
        var el = element.options[opt];
        if (param_object.option != undefined){
          if(el.innerHTML.indexOf(param_object.option) != -1){
            if (el.selected && el.options[opt] == optionToSelect){
              continue;
            }
            optionToSelect = el;
            optionToSelect.selected = true;
            windmill.events.triggerEvent(element, 'change', true);
            break;
          }
        }
        else {
           if(el.value.indexOf(param_object.value) != -1){
              if (el.selected && el.options[opt] == optionToSelect){
                continue;
              }
              optionToSelect = el;
              optionToSelect.selected = true;
              windmill.events.triggerEvent(element, 'change', true);
              break;
            }
        }
      }
      catch(err){}
    }
    if (optionToSelect == null){
      throw "Unable to select the specified option.";
    }
  };
  
  //Drag one eleent to the top x,y coords of another specified element
  this.dragDropElemToElem = function(p){
    //Get the drag and dest
    var drag = lookupNode(p);

    //create the params for the destination
    var destParams = {};
    for (attrib in p) {
      if (attrib.indexOf('opt') != -1){
        destParams[attrib.replace('opt', '')] = p[attrib];
        break;
      }
    }
    var dest = lookupNode(destParams);
    windmill.pauseLoop();
    
    windmill.controller.dragElem = drag;
    windmill.controller.destElem = dest;
    
    function getCoords(obj) {
    	var curleft = curtop = 0;
    	if (obj.offsetParent) {
        do {
        	curleft += obj.offsetLeft;
        	curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
      }  
      return {left:curleft,top:curtop};
    }
    
    var dragCoords = null;
    var destCoords = null;
    
    //in IE and Mozilla we can use the getBoundingClientRect()
    if ( windmill.browser.isIE || windmill.browser.isGecko) {
      dragCoords = drag.getBoundingClientRect();
      destCoords = dest.getBoundingClientRect();
    }
    else {
      dragCoords = getCoords(drag);
      destCoords = getCoords(dest);
    }
    
    //Do the initial move to the drag element position
    windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, dragCoords.left, dragCoords.top);
    windmill.events.triggerMouseEvent(drag, 'mousedown', true, dragCoords.left, dragCoords.top); //do the mousedown
    //windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, destCoords.left, destCoords.top); //do the move
    //windmill.events.triggerMouseEvent(dest, 'mouseup', true, destCoords.left, destCoords.top);
    //IE doesn't appear to expect a click to complete the simulation
    // if (!windmill.browser.isIE){
    //   windmill.events.triggerMouseEvent(dest, 'click', true, destCoords.left, destCoords.top);
    // }

     windmill.controller.doRem = function() {
         windmill.continueLoop();
     }
     windmill.controller.doMove = function(attrib, startx, starty) {
       windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, startx, starty); 
   
       windmill.controller.moveCount--;
       if (windmill.controller.moveCount == 0){
         windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true, startx, starty);
         if (!windmill.browser.isIE){
           windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'click', true, startx, starty);
         }
         setTimeout('windmill.controller.doRem()', 1000);
       }
     }

     windmill.controller.moveCount = 0;
     var startx = dragCoords.left;
     var starty = dragCoords.top;
     var endx = destCoords.left;
     var endy = destCoords.top;
     
     var delay = 0;
     while (startx != endx){
       if (startx < endx){ startx++; }
       else{ startx--; }
       setTimeout("windmill.controller.doMove('left',"+startx+","+starty+")", delay)
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
       //move the y
      //var delay = 0;
     while (starty != endy){
       if (starty < endy){ starty++; }
       else{ starty--; }
       setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
  };
  
  this.dragDropElem = function(param_object) {
    var p = param_object;
    var el = lookupNode(p);

    windmill.pauseLoop();
    windmill.controller.moveCount = 0;
    windmill.controller.dragElem = el;

    //ie specific drag and drop simulation
    if (windmill.browser.isIE){
       var dist = p.pixels.split(',');
        dist[0] = dist[0].replace('(','');
        dist[1] = dist[1].replace(')','');

        var box = el.getBoundingClientRect(); 
        var left = box.left;
        var top = box.top + 2;

        windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, left, top);
        windmill.events.triggerMouseEvent(el, 'mousedown', true, left, top);
        // windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, left+100, top);
        //        windmill.events.triggerMouseEvent(el, 'mouseup', true, left, top);

        windmill.controller.doRem = function(x,y) {
            try{
              windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true, x, y);
            }
            catch(err){}
            windmill.continueLoop();
         }
         windmill.controller.doMove = function(x,y) {
           windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, x, y);
           windmill.controller.moveCount--;
           if (windmill.controller.moveCount == 0){
             setTimeout('windmill.controller.doRem('+x+','+y+')', 1000);
           }
         }

         var delay = 0;
         var i = 0;
         var newX = left;

         while(i != dist[0]){
           if (i < dist[0]){ newX++; }
           else{ newX--; }

           setTimeout("windmill.controller.doMove("+newX+","+top+")", delay)
           if (i < dist[0]){ i++; }
           else{ i--; }
           windmill.controller.moveCount++;
           delay = delay + 5;
         }

         //var delay = 0;
         var i = 0;
         var newBox = el.getBoundingClientRect(); 
         var newY = top;

         while(i != dist[1]){
           if (i < dist[0]){ newY++; }
           else{ newY--; }

           setTimeout("windmill.controller.doMove("+newX+", "+newY+")", delay)
           if (i < dist[1]){ i++; }
           else{ i--; }
           windmill.controller.moveCount++;
           delay = delay + 5;
         }
    }
    //all other browsers with sane event models
    else {
       // var i = windmill.testWindow.document.createElement('img');
       //     i.id = "mc";
       //     i.style.border = "0px";
       //     i.style.left = '0px';
       //     i.style.top = '0px';
       //     i.style.position = "absolute";
       //     i.zIndex = "100000000000";
       //     el.appendChild(i);
       //     i.src = "/windmill-serv/img/mousecursor.png"; 

        //takes a coordinates param (x,y),(x,y) start, end
        var dist = p.pixels.split(',');
        dist[0] = dist[0].replace('(','');
        dist[1] = dist[1].replace(')','');

        windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, el.offsetLeft, el.offsetTop);
        windmill.events.triggerMouseEvent(el, 'mousedown', true);
    
        windmill.controller.doRem = function() {
           windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'mouseup', true);
           windmill.events.triggerMouseEvent(windmill.controller.dragElem, 'click', true);
           windmill.continueLoop();
        }
        windmill.controller.doMove = function(x,y) {
          windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, x, y);
          windmill.controller.moveCount--;
          if (windmill.controller.moveCount == 0){
            setTimeout('windmill.controller.doRem()', 1000);
          }
        }

        var delay = 0;
        var i = 0;
        while(i != dist[0]) {
          setTimeout("windmill.controller.doMove("+i+", 0)", delay)
          if (i < dist[0]){ i++; }
          else{ i--; }
          windmill.controller.moveCount++;
          delay = delay + 5;
        }
    
        var newX = i;
        //var delay = 0;
        var i = 0;
        while(i != dist[1]) {
          setTimeout("windmill.controller.doMove("+newX+", "+i+")", delay)
          if (i < dist[1]){ i++; }
          else{ i--; }
          windmill.controller.moveCount++;
          delay = delay + 5;
        }
    }
  };
  
  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDropAbs = function (param_object) {
     var p = param_object;
     var el = lookupNode(p);
    
     windmill.pauseLoop();
     windmill.controller.moveCount = 0;
     windmill.controller.ddeParamObj = param_object;
     
     var webApp = windmill.testWin();
     //takes a coordinates param (x,y),(x,y) start, end
     var coords = p.coords.split('),(');
     
     var start = coords[0].split(',');
     start[0] = start[0].replace('(','');
     
     var end = coords[1].split(',');
     end[1] = end[1].replace(')','');
     
     //get to the starting point
      var i = windmill.testWin().document.createElement('img');
      i.id = "mc";
      i.style.border = "0px";
      i.style.left = start[0]+'px';
      i.style.top = start[1]+'px';
      i.style.position = "absolute";
      i.zIndex = "100000000000";
      windmill.testWin().document.body.appendChild(i);
      i.src = "/windmill-serv/img/mousecursor.png";
     
     windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
     windmill.events.triggerMouseEvent(lookupNode(p), 'mousedown', true, start[0], start[1]);
     var startx = start[0];
     var starty = start[1];
   
     windmill.controller.remMouse = function(x,y) {
       windmill.events.triggerMouseEvent(lookupNode(p), 'mouseup', true, x, y);
       windmill.events.triggerMouseEvent(lookupNode(p), 'click', true);
       var c = windmill.testWin().document.getElementById('mc');
       windmill.testWin().document.body.removeChild(c);
       windmill.continueLoop();
     }
   
     windmill.controller.doMove = function(attrib, startx, starty) {
       var w = windmill.testWin().document;
       if (attrib == "left"){ w.getElementById('mc').style['left'] = startx+'px'; }
       else{ w.getElementById('mc').style['top'] = starty+'px'; }
       windmill.events.triggerMouseEvent(w.body, 'mousemove', true, startx, starty); 
     
       windmill.controller.moveCount--;
       if (windmill.controller.moveCount == 0){
         w.getElementById('mc').src = "/windmill-serv/img/mousecursorred.png";
         setTimeout('windmill.controller.remMouse('+startx+','+starty+')', 1500);
       }
     }
   
     //move the x
     var delay = 0;
     while (startx != end[0]) {
       if (startx < end[0]){ startx++; }
       else{ startx--; }
       setTimeout("windmill.controller.doMove('left',"+startx+","+starty+")", delay)
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
     //move the y
     //var delay = 0;
     while (starty != end[1]){
        if (starty < end[1]){ starty++; }
        else{ starty--; }
        setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
        windmill.controller.moveCount++;
        delay = delay + 5;      
      }
   };


  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDrop = function (param_object) {   
   
    var p = param_object;
    var hash_key;
     
    eval ("hash_key=" + p.dragged.jsid + ";");
    p.dragged.id = hash_key;
    delete p.dragged.jsid;
             
    function getPos(elem, evType) {
      // param_object.mouseDownPos or param_obj.mouseUpPos
      var t = evType + 'Pos';
      var res = [];
      // Explicit function for getting XY of both
      // start and end position for drag  start 
      // to be calculated from the initial pos of the
      // dragged, and end to be calculated from the
      // position of the destination
      if (p[t]) {
        var f = eval(p[t]);
        res = f(elem);
      }
      // Otherwise naively assume top/left XY for both
      // start (dragged) and end (destination)
      else {
        res = [elem.offsetLeft, elem.offsetTop];
      }
       
      return res;
    };     
    
    var dragged = lookupNode(p.dragged);
    var dest = lookupNode(p.destination);
    var mouseDownPos = getPos(dragged, 'mouseDown');
    var mouseUpPos = getPos(dest, 'mouseUp');
    
    var webApp = windmill.testWin();
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseDownPos[0], mouseDownPos[1]);
    windmill.events.triggerMouseEvent(dragged, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseUpPos[0], mouseUpPos[1]);
    windmill.events.triggerMouseEvent(dragged, 'mouseup', true);
    windmill.events.triggerMouseEvent(dragged, 'click', true);
    
  };

  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDropXY = function (param_object) {

    var p = param_object;
    var webApp = windmill.testWin();
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.source[0], p.source[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.destination[0], p.destination[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mouseup', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'click', true);

  };
   
  //Functions for interacting with the windmill variable storage
  //Store the url of a provided link on the page, to be accessed later
  //Ususally with an open
  this.storeURL = function(param_object) {
    var linkNode = lookupNode(param_object);
    windmill.varRegistry.addItem('{$'+param_object.link +'}',linkNode.href);
  }
  
  //Allow the user to update the document.domain for the IDE
  this.setDocDomain = function(param_object) {
    document.domain = param_object.domain;
  };

  //Directly access mouse events
  this.mouseDown = function (param_object) {
      var mupElement = lookupNode(param_object);
      if (mupElement == null){
        mupElement = windmill.testWin().document.body;
      }
      if (windmill.browser.isIE){
          var box = mupElement.getBoundingClientRect(); 
          var left = box.left;
          var top = box.top + 2;
          windmill.events.triggerMouseEvent(mupElement, 'mousedown', true, left, top);  
      }
      else { windmill.events.triggerMouseEvent(mupElement, 'mousedown', true);  }
  };
    //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.mouseMoveTo = function (param_object) {
    var p = param_object;
    var webApp = windmill.testWin();
    var coords = p.coords.split(',');
    coords[0] = coords[0].replace('(','');
    coords[1] = coords[1].replace(')','');
    
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, coords[0], coords[1]);
  };
  
  // this.mouseMove = function (param_object){
  //    var p = param_object;
  //    var webApp = windmill.testWin();
  //    var coords = p.coords.split('),(');
  //          
  //    var start = coords[0].split(',');
  //    start[0] = start[0].replace('(','');
  //           
  //    var end = coords[1].split(',');
  //    end[1] = end[1].replace(')','');
  //    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
  //    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, end[0], end[1]);
  //    alert('mooch??');
  //      
  //   return true;
  // };
    
  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.mouseMove = function (param_object) {
     windmill.pauseLoop();
     windmill.controller.moveCount = 0;
     var p = param_object;
     var webApp = windmill.testWin();
     //takes a coordinates param (x,y),(x,y) start, end
     var coords = p.coords.split('),(');
     
     var start = coords[0].split(',');
     start[0] = start[0].replace('(','');
     
     var end = coords[1].split(',');
     end[1] = end[1].replace(')','');
  
     //get to the starting point
      var i = windmill.testWin().document.createElement('img');
      i.id = "mc";
      i.style.border = "0px";
      i.style.left = start[0]+'px';
      i.style.top = start[1]+'px';
      i.style.position = "absolute";
      i.zIndex = "100000000000";
      windmill.testWin().document.body.appendChild(i);
      i.src = "/windmill-serv/img/mousecursor.png";
     
     windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
     var startx = start[0];
     var starty = start[1];
   
     windmill.controller.remMouse = function() {
       var c = windmill.testWin().document.getElementById('mc');
       windmill.testWin().document.body.removeChild(c);
       windmill.continueLoop();
     }
   
     windmill.controller.doMove = function(attrib, startx, starty) {
       var w = windmill.testWin().document;
       if (attrib == "left"){ w.getElementById('mc').style['left'] = startx+'px'; }
       else{ w.getElementById('mc').style['top'] = starty+'px'; }
       windmill.events.triggerMouseEvent(w.body, 'mousemove', true, startx, starty); 
     
       windmill.controller.moveCount--;
       if (windmill.controller.moveCount == 0){
         w.getElementById('mc').src = "/windmill-serv/img/mousecursorred.png";
         setTimeout('windmill.controller.remMouse()', 1000);
       }
     }
   
     //move the x
     var delay = 0;
     while (startx != end[0]){
       if (startx < end[0]){ startx++; }
       else{ startx--; }
       setTimeout("windmill.controller.doMove('left',"+startx+","+starty+")", delay)
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
     //move the y
     //var delay = 0;
     while (starty != end[1]){
        if (starty < end[1]){ starty++; }
        else{ starty--; }
        setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
        windmill.controller.moveCount++;
        delay = delay + 5;      
      }
  };
  
  this.mouseUp = function (param_object){
    try {
      var mupElement = lookupNode(param_object);
    } catch(err){}
    
    if (mupElement == null){
      mupElement = windmill.testWin().document.body;
    }
    if(windmill.browser.isIE){
      var box = mupElement.getBoundingClientRect(); 
      var left = box.left;
      var top = box.top + 2;
      windmill.events.triggerMouseEvent(mupElement, 'mouseup', true, left, top);
    }
    else{
      windmill.events.triggerMouseEvent(mupElement, 'mouseup', true);
    }
  };
  
  this.mouseOver = function (param_object){
    var mdnElement = lookupNode(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseover', true);
  };

  this.mouseOut = function (param_object){
    var mdnElement = lookupNode(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseout', true);
  };
  
  //Browser navigation functions
  this.goBack = function(param_object){
    windmill.testWin().history.back();
  }
  this.goForward = function(param_object){
    windmill.testWin().history.forward();
  }
  this.refresh = function(param_object){
    windmill.testWin().location.reload(true);
  }
  
  this.scroll = function(param_object){
    var d = param_object.coords;
    d = d.replace('(','');
    d = d.replace(')','');
    var cArr = d.split(',');
    windmill.testWin().scrollTo(cArr[0],cArr[1]);
  }
  
  //After the app reloads you have to re overwrite the alert function for the TestingApp
  this.reWriteAlert = function(param_object){
    windmill.reAlert = true;
    windmill.testWin().alert = function(s){
      windmill.out("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
    };
    
    rwaRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;
      
      for (var i=0;i<iframeCount;i++){
          try{
  	        iframeArray[i].alert = function(s){
        		  windmill.out("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
     	      };
  	        rwaRecurse(iframeArray[i]);
          }
          catch(error){             
           	windmill.out('Could not bind to iframe number '+ iframeCount +' '+error);     
          }
        }
    }
    rwaRecurse(windmill.testWin());
    };

  //Allow the user to set the testWindow to a different window 
  //or frame within the page 
  this.setTestWindow = function(param_object){
    var res = eval ('windmill.testWindow ='+ param_object.path +';');
    if (typeof(res) == 'undefined'){
      throw "Error setting the test window, undefined."
    }
  };
  
  this.setWindowByTitle = function(param_object){
    var title = param_object.title;
    var newW = windmill.testWin();
    for (var i = 0; i < windmill.windowReg.length; i++){
      if (windmill.windowReg[i].document.title == title){
        newW = windmill.windowReg[i];
      }
    }
    windmill.testWindow = newW;
  };
  
  this.revertWindow = function(param_object){
    windmill.testWindow = windmill.baseTestWindow;
  };
  
  this.closeWindow = function(param_object){
    if (windmill.testWin() != windmill.baseTestWindow){
      windmill.testWin().close();
      windmill.testWindow = windmill.baseTestWindow;
    }
  };
  
  //Execute some arbitrary JS in the testing app window
  this.execJS = function(param_object){
    var js = param_object.js;
    eval.call(windmill.testWin(), js);
  };

};

