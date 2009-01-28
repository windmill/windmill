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

  /**
  * Does absolutely nothing
  */ 
  this.defer = function (){
    //At some point we may want to display somewhere that we continually get deferred
    //when the backend has nothing for us to do
  };
  
  /**
  * Creates a windmill variable antry from a DOM element attribute
  * @param {Object} paramObject The JavaScript object providing the necessary options 
  */
  this.storeVarFromLocAttrib = function (paramObject) {
    var element = lookupNode(paramObject);

    var arr = paramObject.options.split('|');
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
  
  /**
  * Creates a windmill variable antry from evaluated JavaScript
  * @param {Object} paramObject The JavaScript providing the necessary options
  * @throws SyntaxError JavaScript eval exception 
  */
  this.storeVarFromJS = function (paramObject) {
    //extract the options
    var arr = paramObject.options.split('|');
    paramObject.name = arr[0];
    paramObject.js = arr[1];
    
    paramObject.value = eval.call(windmill.testWin(), paramObject.js);

    //if the code evaled and returned a value add it
    if (windmill.varRegistry.hasKey('{$'+paramObject.name +'}')){
      windmill.varRegistry.removeItem('{$'+paramObject.name +'}');
      windmill.varRegistry.addItem('{$'+paramObject.name +'}',paramObject.value);
    }
    else{
      windmill.varRegistry.addItem('{$'+paramObject.name +'}',paramObject.value);
    }
  };

  /**
  * Navigates the Windmill testing applicatoin to the provided url
  * @param {Object} paramObject The JavaScript object used to provide the necessary options
  */
  this.open = function (paramObject) {
    //clear the domain forwarding cache
    if (paramObject.reset == undefined){
      windmill.service.setTestURL(windmill.initialHost); 
    }
    //We need to tell the service where we are before we
    //head to a new page
    windmill.testWin().location = paramObject.url;
  };


  /**
  * Select an option from a Select element by either value or innerHTML
  * @param {Object} paramObject The JavaScript providing: Locator, option or value
  * @throws Exception Unable to select the specified option.
  */
  this.select = function (paramObject) {
    //lookup
    var element = lookupNode(paramObject);
    
    //if the index selector was used, select by index
    if (paramObject.index){
      element.options[paramObject.index].selected = true;
      return true;
    }
        
    //Sometimes we can't directly access these at this point, not sure why
    try {
      if (element.options[element.options.selectedIndex].text == paramObject['option']){
        return true;
      }
    } catch(err){ windmill.err(err)}
    try {  
      if (element.options[element.options.selectedIndex].value == paramObject['val']){
        return true;
      }
    } catch(err){ windmill.err(err)}
    
    windmill.events.triggerEvent(element, 'focus', false);
    var optionToSelect = null;
    for (opt = 0; opt < element.options.length; opt++){
      try {
        var el = element.options[opt];
        if (paramObject.option != undefined){
          if(el.innerHTML.indexOf(paramObject.option) != -1){
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
           if(el.value.indexOf(paramObject.val) != -1){
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
  
  /**
  * Drag one DOM element to the top x,y coords of another specified DOM element
  * @param {Object} paramObject The JavaScript object providing: Locator, option or value
  */
  this.dragDropElemToElem = function(paramObject){
    var p = paramObject;
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
    
    //get the bounding objects we want for starting and ending places
    //for the drag
    function getBounding(elem){
      //backup way to get the coords
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
      
      //get the coords and divide to find the middle
      if ( windmill.browser.isIE || windmill.browser.isGecko ) {
        var bound = elem.getBoundingClientRect();
        bound = {left:parseInt((bound.left+bound.right)/
        2),top:parseInt((bound.top+bound.bottom)/2)};
      }
      else {
        var bound = getCoords(elem);
        bound =  {left:parseInt(bound.left+elem.offsetWidth/
        2),top:parseInt(bound.top+elem.offsetHeight/2)}
      }
      return bound;
    };

    
    var dragCoords = null;
    var destCoords = null;

    dragCoords = getBounding(drag);
    destCoords = getBounding(dest);

    
    //Do the initial move to the drag element position
    windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, dragCoords.left, dragCoords.top);
    windmill.events.triggerMouseEvent(drag, 'mousedown', true, dragCoords.left, dragCoords.top);
    windmill.events.triggerMouseEvent(drag, 'mouseout', true, dragCoords.left, dragCoords.top);
    
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
     while (starty != endy){
       if (starty < endy){ starty++; }
       else{ starty--; }
       setTimeout("windmill.controller.doMove('top',"+startx+","+starty+")", delay);
       windmill.controller.moveCount++;
       delay = delay + 5;      
     }
  };
  
  /**
  * Drag a specified DOM element a specified amount of pixels
  * @param {Object} paramObject The JavaScript object providing: Locator and pixels (x,y)
  */  
  this.dragDropElem = function(paramObject) {
    var p = paramObject;
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
        windmill.events.triggerMouseEvent(el, 'mouseout', true, left, top);
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
           if (i < dist[1]){ newY++; }
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
  
  /**
  * Use absolute coordinates to click an element, and move it from one set of coords to another. 
  * @param {Object} paramObject The JavaScript object providing: Locator, coords ( Format; ex. '(100,100),(300,350)' )
  */
  this.dragDropAbs = function (paramObject) {
     var p = paramObject;
     var el = lookupNode(p);
    
     windmill.pauseLoop();
     windmill.controller.moveCount = 0;
     windmill.controller.ddeParamObj = paramObject;
     
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

  /**
  * Use absolute coordinates to click an element, and move it from one set of coords to another. 
  * @param {Object} paramObject The JavaScript object providing: Locator, destination paramObject
  */
  this.dragDrop = function (paramObject) {   
   
    var p = paramObject;
    var hash_key;
     
    eval ("hash_key=" + p.dragged.jsid + ";");
    p.dragged.id = hash_key;
    delete p.dragged.jsid;
             
    function getPos(elem, evType) {
      // paramObject.mouseDownPos or param_obj.mouseUpPos
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

  /**
  * Raw drag drop using abs x,y
  * @param {Object} paramObject The JavaScript object providing: Locator, source paramObject, dest paramObj
  */
  this.dragDropXY = function (paramObject) {

    var p = paramObject;
    var webApp = windmill.testWin();
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.source[0], p.source[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.destination[0], p.destination[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mouseup', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'click', true);

  };
   
  /**
  * Create a Windmill variable registry entry from the href of a provided locator
  * @param {Object} paramObject The JavaScript object providing: Locator
  */
  this.storeURL = function(paramObject) {
    var linkNode = lookupNode(paramObject);
    windmill.varRegistry.addItem('{$'+paramObject.link +'}',linkNode.href);
  }
  
  /**
  * Manually change the document.domain of the windmill IDE window
  * @param {Object} paramObject The JavaScript object providing: domain
  */
  this.setDocDomain = function(paramObject) {
    document.domain = paramObject.domain;
  };

  /**
  * Fire a mousedown event on the provided node
  * @param {Object} paramObject The JavaScript object providing: Locator
  */  
  this.mouseDown = function (paramObject) {
      var mupElement = lookupNode(paramObject);
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
  
  /**
  * Fire a mousemove event ending at a specified set of coordinates
  * @param {Object} paramObject The JavaScript object providing: coords
  */
  this.mouseMoveTo = function (paramObject) {
    var p = paramObject;
    var webApp = windmill.testWin();
    var coords = p.coords.split(',');
    coords[0] = coords[0].replace('(','');
    coords[1] = coords[1].replace(')','');
    
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, coords[0], coords[1]);
  };
  
  // this.mouseMove = function (paramObject){
  //    var p = paramObject;
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
    
  /**
  * Fire the mousemove event starting at one point and ending at another
  * @param {Object} paramObject The JavaScript object providing: coords (Format: '(x,y),(x,y)' )
  */
  this.mouseMove = function (paramObject) {
     windmill.pauseLoop();
     windmill.controller.moveCount = 0;
     var p = paramObject;
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
  
  /**
  * Fire the mouseup event against a specified node, defaulting to document.body
  * @param {Object} paramObject The JavaScript object providing: Locator
  */
  this.mouseUp = function (paramObject){
    try {
      var mupElement = lookupNode(paramObject);
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
  
  /**
  * Fire the mouseover event against a specified DOM element
  * @param {Object} paramObject The JavaScript object providing: Locator
  */  
  this.mouseOver = function (paramObject){
    var mdnElement = lookupNode(paramObject);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseover', true);
  };
  
  /**
  * Fire the mouseout event against a specified DOM element
  * @param {Object} paramObject The JavaScript object providing: Locator
  */
  this.mouseOut = function (paramObject){
    var mdnElement = lookupNode(paramObject);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseout', true);
  };
  
  /**
  * Fire keypress event
  * @param
  */
  this.keyPress = function(paramObject){
    try {
      var element = lookupNode(paramObject);
    } catch(err){ var element = windmill.testWin().document.body; }

    paramObject.options = paramObject.options.replace(/ /g, "");

    var opts = paramObject.options.split(",");
    windmill.events.triggerEvent(element, 'focus', false);
    //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
    windmill.events.triggerKeyEvent(element, "keypress", opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]));
  };
  
  /**
  * Fire keydown event
  * @param
  */
  this.keyDown = function(paramObject){
    try {
      var element = lookupNode(paramObject);
    } catch(err){ var element = windmill.testWin().document.body; }

    paramObject.options = paramObject.options.replace(/ /g, "");

    var opts = paramObject.options.split(",");
    windmill.events.triggerEvent(element, 'focus', false);
    //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
    windmill.events.triggerKeyEvent(element, "keyDown", opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]));
  };
  
  /**
  * Fire keydown event
  * @param
  */
  this.keyUp = function(paramObject){
    try {
      var element = lookupNode(paramObject);
    } catch(err){ var element = windmill.testWin().document.body; }

    paramObject.options = paramObject.options.replace(/ /g, "");

    var opts = paramObject.options.split(",");
    windmill.events.triggerEvent(element, 'focus', false);
    //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
    windmill.events.triggerKeyEvent(element, "keyUp", opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]));
  };
  
  /**
  * Trigger the back function in the Windmill Testing Application Window
  */
  this.goBack = function(paramObject){
    windmill.testWin().history.back();
  }
  
  /**
  * Trigger the forward function in the Windmill Testing Application Window
  */
  this.goForward = function(paramObject){
    windmill.testWin().history.forward();
  }
  
  /**
  * Trigger the refresh function in the Windmill Testing Application Window
  */
  this.refresh = function(paramObject){
    windmill.testWin().location.reload(true);
  }
  
  /**
  * Trigger the scroll function in the Windmill Testing Application Window
  * @param {Object} paramObject The JavaScript object providing: coords
  */
  this.scroll = function(paramObject){
    var d = paramObject.coords;
    d = d.replace('(','');
    d = d.replace(')','');
    var cArr = d.split(',');
    windmill.testWin().scrollTo(cArr[0],cArr[1]);
  }
  
  /**
  * Re-write the window alert function to instead send it's output to the output tab
  */
  this.reWriteAlert = function(paramObject){
    
    try {
      windmill.testWin().alert = function(s){
        windmill.alertStore.push(s);
        windmill.out("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
      };
    } catch(err){ windmill.err(err); }
    
    rwaRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;
      
      for (var i=0;i<iframeCount;i++){
          try{
  	        iframeArray[i].alert = function(s){
        		  windmill.alertStore.push(s);
        		  windmill.out("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
     	      };
  	        rwaRecurse(iframeArray[i]);
          }
          catch(error){             
           	windmill.err('Could not bind to iframe number '+ iframeCount +' '+error);     
          }
        }
      };
      rwaRecurse(windmill.testWin());
  };

  /**
  * Re-write the window alert function to instead send it's output to the output tab
  */
  this.reWriteConfirm = function(paramObject){
    
    try {
      windmill.testWin().confirm = function(s){
        windmill.confirmStore.push(s);
        return windmill.confirmAnswer;
      };
    } catch(err){ windmill.err(err); }
    
    rwcRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;
      
      for (var i=0;i<iframeCount;i++){
          try{
  	        iframeArray[i].confirm = function(s){
  	          windmill.confirmStore.push(s);
        		  return windmill.confirmAnswer;    
     	      };
  	        rwaRecurse(iframeArray[i]);
          }
          catch(error){             
           	windmill.err('Could not bind to iframe number '+ iframeCount +' '+error);     
          }
        }
      };
      rwcRecurse(windmill.testWin());
  };
  

  this.reWritePopups = function(paramObject){
     if (typeof windmill.testWin().oldOpen == "function"){
       return;
     }
     
    //Window popup wrapper
     try { windmill.testWin().oldOpen = windmill.testWin().open; } 
     catch(err){ 
       windmill.err("Did you close a popup window, without using closeWindow?");
       windmill.err("We can no longer access test windows, start over and don't close windows manually.");
       return;
     }
   
     //re-define the open function
     windmill.testWin().open = function(){
       if (windmill.browser.isIE){
          var str = '';
          var arg;
          for (var i = 0; i < arguments.length; i++) {
            arg = arguments[i];
            if (typeof arg == 'string') {
              str += '"' + arg + '"';
            }
            else {
              str += arg;
            }
            str += ","
          }
          str = str.substr(0, str.length-1);
          eval('var newWindow = windmill.testWin().oldOpen(' + str + ');');
       }
       else {
         var newWindow = windmill.testWin().oldOpen.apply(windmill.testWin(), arguments);
       }

       var newReg = [];
       for (var i = 0; i < windmill.windowReg.length; i++){
         try{
           var wDoc = windmill.windowReg[i].document;              
           newReg.push(windmill.windowReg[i]);
         } catch(err){}
         windmill.windowReg = newReg;
       }
       windmill.windowReg.push(newWindow);
     };
   };

  /**
  * Update the windmill.testWindow reference to point to a different window
  * @param {Object} paramObject The JavaScript object providing: path
  * @throws EvalException "Error setting the test window, undefined."
  */
  this.setTestWindow = function(paramObject){
    var res = eval ('windmill.testWindow ='+ paramObject.path +';');
    if (typeof(res) == 'undefined'){
      throw "Error setting the test window, undefined."
    }
  };
  
  /**
  * Set the windmill.testWindow by iterating through the windowReg to find a matching title
  * @param {Object} paramObject The JavaScript object providing: title
  */
  this.setWindowByTitle = function(paramObject){
    var title = paramObject.title;
    var newW = windmill.testWin();
    for (var i = 0; i < windmill.windowReg.length; i++){
      if (windmill.windowReg[i].document.title == title){
        newW = windmill.windowReg[i];
      }
    }
    windmill.testWindow = newW;
  };
  
  /**
  * Revert the windmill.testWindow to the original when the page was loaded
  * @param {Object} paramObject The JavaScript object providing: title
  */
  this.revertWindow = function(paramObject){
    windmill.testWindow = windmill.baseTestWindow;
  };
  
  /**
  * If the windmill.testWindow is not the original opener, close it.
  */
  this.closeWindow = function(paramObject){
    if (windmill.testWin() != windmill.baseTestWindow){
      windmill.testWin().close();
      windmill.testWindow = windmill.baseTestWindow;
    }
  };
  
  /**
  * Execute some arbitrary JS in the testing app window
  * @param {Object} paramObject The JavaScript object providing: js
  */
  this.execArbTestWinJS = function(paramObject){
    var js = paramObject.js;
    eval.call(windmill.testWin(), js);
  };
  
  /**
  * Execute some arbitrary JS
  * @param {Object} paramObject The JavaScript object providing: js
  */
  this.execIDEJS = function(paramObject){
    var js = paramObject.js;
    eval.call(window, js);
  };
};

