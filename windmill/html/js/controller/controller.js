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
  this.flex                = {};  

/************************************
 * User facing windmill functionality
 ************************************/

  /**
  * Does absolutely nothing
  */ 
  this.defer = function (){
    //At some point we may want to display somewhere that we continually get deferred
    //when the backend has nothing for us to do
  };

  /**
  * Logs a message to the IDE window
  * @param
  */
  this.log = function(paramObject){
    if (paramObject.string) utils.log(paramObject.string);
    if (paramObject.array) utils.log.apply(this, paramObject.array);
    if (paramObject.method) utils.log.apply(this, paramObject.method());
  };

  //Expose lookupNode to the python controller
  this.lookup = function(paramObject){
    return lookupNode(paramObject);
  };

  this.rightClick = function(paramObject){
    var element = lookupNode(paramObject);
    windmill.events.triggerEvent(element, 'focus', false);

    var evt = element.ownerDocument.createEvent("HTMLEvents");
    evt.initEvent('contextmenu', true, true); // bubbles = true, cancelable = true

    if (document.createEventObject) {
      element.fireEvent('oncontextmenu', evt);
    }
    else {
      element.dispatchEvent(evt);
    }
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
    
    paramObject.value = windmill.testWin().eval(paramObject.js);

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
  * Creates a windmill variable antry from evaluated JavaScript
  * @param {Object} paramObject The JavaScript providing the necessary options
  * @throws SyntaxError JavaScript eval exception 
  */
  this.storeVarFromIDEJS = function (paramObject) {
    //extract the options
    var arr = paramObject.options.split('|');
    paramObject.name = arr[0];
    paramObject.js = arr[1];
    
    paramObject.value = eval(paramObject.js);

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

  //Set a select box to not selected
  this.selectReset = function (paramObject) {
    //lookup
    var element = lookupNode(paramObject);
    for (var i=0; i< element.options.length; i++) {
      element.options[i].selected = false;
    }
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
      //toggle
      if (element.options[paramObject.index].selected == true){
        element.options[paramObject.index].selected = false;
      }
      else {
        element.options[paramObject.index].selected = true;
      }
      return true;
    }

    //Sometimes we can't directly access these at this point, not sure why
    try {
      if (element.options[element.options.selectedIndex].text == paramObject['option']){
        return true;
      }
    } catch(err){ windmill.err(err); }
    try {
      if (element.options[element.options.selectedIndex].value == paramObject['val']){
        return true;
      }
    } catch(err){ windmill.err(err); }

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
    var drag = lookupNode(p, false);

    //create the params for the destination
    var destParams = {};
    for (attrib in p) {
      if (attrib.indexOf('opt') != -1){
        destParams[attrib.replace('opt', '')] = p[attrib];
        break;
      }
    }
    var dest = lookupNode(destParams, false);
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
         windmill.events.triggerMouseEvent(windmill.controller.destElem, 'mouseup', true, startx, starty);
         if (!windmill.browser.isIE){
           windmill.events.triggerMouseEvent(windmill.controller.destElem, 'click', true, startx, starty);
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
    var el = lookupNode(p, false);

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
  * Move draggable emement to absolute coordinates
  * @param {Object} paramObject The JavaScript object providing: Locator, coords ( Format; ex. '(100,100)' )
  */
  this.dragDropElemToAbs = function (paramObject) {
     var p = paramObject;
     var el = lookupNode(p, false);
    
     windmill.pauseLoop();
     windmill.controller.moveCount = 0;
     windmill.controller.ddeParamObj = paramObject;
     
     var webApp = windmill.testWin();
     //takes a coordinates param (x,y),(x,y) start, end
     p.coords = p.coords.replace('(','');
     p.coords = p.coords.replace(')','');
     var end = p.coords.split(',');
     
     //var start = coords[0].split(',');
     //start[0] = start[0].replace('(','');
     var start = [];
     start[0] = el.style.left.replace('px','');
     start[1] = el.style.top.replace('px','');
     var startx = start[0];
     var starty = start[1];
     
     //get to the starting point
      // var i = windmill.testWin().document.createElement('img');
      // i.id = "mc";
      // i.style.border = "0px";
      // i.style.left = start[0]+'px';
      // i.style.top = start[1]+'px';
      // i.style.position = "absolute";
      // i.zIndex = "100000000000";
      // windmill.testWin().document.body.appendChild(i);
      // i.src = "/windmill-serv/img/mousecursor.png";
     
     windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start[0], start[1]);
     windmill.events.triggerMouseEvent(lookupNode(p, false), 'mousedown', true, start[0], start[1]);
     var startx = start[0];
     var starty = start[1];
   
     windmill.controller.remMouse = function(x,y) {
       windmill.events.triggerMouseEvent(lookupNode(p, false), 'mouseup', true, x, y);
       windmill.events.triggerMouseEvent(lookupNode(p, false), 'click', true);
       //var c = windmill.testWin().document.getElementById('mc');
       //windmill.testWin().document.body.removeChild(c);
       windmill.continueLoop();
     }
   
     windmill.controller.doMove = function(attrib, startx, starty) {
       var w = windmill.testWin().document;
       //if (attrib == "left"){ w.getElementById('mc').style['left'] = startx+'px'; }
       //else{ w.getElementById('mc').style['top'] = starty+'px'; }
       windmill.events.triggerMouseEvent(w.body, 'mousemove', true, startx, starty); 
     
       windmill.controller.moveCount--;
       if (windmill.controller.moveCount == 0){
         //w.getElementById('mc').src = "/windmill-serv/img/mousecursorred.png";
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
    
    var dragged = lookupNode(p.dragged, false);
    var dest = lookupNode(p.destination, false);
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
  };

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

  var keyEvent = function(paramObject, event){
    var element;
    try {
      element = lookupNode(paramObject);
    } catch(err){ element = windmill.testWin().document.body; }

    paramObject.options = paramObject.options.replace(/ /g, "");

    var opts = paramObject.options.split(",");
    windmill.events.triggerEvent(element, 'focus', false);
    //element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown
    windmill.events.triggerKeyEvent(element, event, opts[0], eval(opts[1]), eval(opts[2]), eval(opts[3]), eval(opts[4]), eval(opts[5]), opts[6]);
  };

  /**
  * Fire focus event
  * @param
  */
  this.focus = function(paramObject){
    var element;
    try {
      element = lookupNode(paramObject);
    } catch(err){ element = windmill.testWin().document.body; }
    windmill.events.triggerEvent(element, 'focus', false);
  };

  /**
  * Fire focus event
  * @param
  */
  this.blur = function(paramObject){
    var element;
    try {
      element = lookupNode(paramObject);
    } catch(err){ element = windmill.testWin().document.body; }
    windmill.events.triggerEvent(element, 'blur', false);
  };

  /**
  * Fire keypress event
  * @param
  */
  this.keyPress = function(paramObject){
    keyEvent(paramObject, 'keypress');
  };

  /**
  * Fire keydown event
  * @param
  */
  this.keyDown = function(paramObject){
    keyEvent(paramObject, 'keydown');
  };

  /**
  * Fire keyup event
  * @param
  */
  this.keyUp = function(paramObject){
    keyEvent(paramObject, 'keyup');
  };

  /**
  * Trigger the back function in the Windmill Testing Application Window
  */
  this.goBack = function(paramObject){
    windmill.testWin().history.back();
  };

  /**
  * Trigger the forward function in the Windmill Testing Application Window
  */
  this.goForward = function(paramObject){
    windmill.testWin().history.forward();
  };

  /**
  * Trigger the refresh function in the Windmill Testing Application Window
  */
  this.refresh = function(paramObject){
    windmill.testWin().location.reload(true);
  };

  /**
  * Trigger the scroll function in the Windmill Testing Application Window
  * @param {Object} paramObject The JavaScript object providing: coords
  */
  this.scroll = function(paramObject){
    var coords = utils.parseCoords(paramObject.coords);
    windmill.testWin().scrollTo(coords.x,coords.y);
  };

  this.overrideDialogs = function(paramObject){
    windmill.overWrite();
  };

  this.show = function(paramObject){
    show(lookupNode(paramObject));
  };

  var rewritePopup = function(which){
    try {
      windmill.testWin()[which] = function(s){
        windmill[which + 'Store'].push(s);
        var out = utils.capitalize(which) + ": <b>" + s + ".</b>";
        if (windmill[which + 'Answer'] !== undefined) out += ' - ' + windmill[which + 'Answer'];
        windmill.out(out); 
        if (windmill[which + 'Answer'] !== undefined) return windmill[which + 'Answer'];
      };
    } catch(err){ windmill.err(err); }

    rwaRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;

      for (var i=0;i<iframeCount;i++){
          try{
            iframeArray[i][which] = function(s){
              windmill[which + 'Store'].push(s);
              var out = utils.capitalize(which) + ": <b>" + s + ".</b>";
              if (windmill[which + 'Answer'] !== undefined) out += ' - ' + windmill[which + 'Answer'];
              windmill.out(out);
              if (windmill[which + 'Answer'] !== undefined) return windmill[which + 'Answer'];
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
  this.reWriteAlert = function(paramObject){
    rewritePopup('alert');
  };

  /**
  * Re-write the window alert function to instead send it's output to the output tab
  */
  this.reWriteConfirm = function(paramObject){
    rewritePopup('confirm');
  };

  /**
   * Re-write the window prompt function to instead send it's output to the output tab
   */
  this.reWritePrompt = function(paramObject){
    rewritePopup('prompt');
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
            str += ",";
          }
          str = str.substr(0, str.length-1);
          eval('var newWindow = windmill.testWin().oldOpen(' + str + ');');
      }
      else {
        var newWindow = windmill.testWin().oldOpen.apply(windmill.testWin(), arguments);
      }

      var newReg = [];
      for (i = 0; i < windmill.windowReg.length; i++){
        try{
          var wDoc = windmill.windowReg[i].document;
          newReg.push(windmill.windowReg[i]);
        } catch(err){}
        windmill.windowReg = newReg;
      }
      windmill.windowReg.push(newWindow);
    };
  };

  this.setPromptDefault = function(paramObject){
    if (paramObject.val){
      windmill.promptAnswer = paramObject.val;
    } else {
      windmill.promptAnswer = "Windmill is great!";
    }
  };

  /**
  * Update the windmill.testWindow reference to point to a different window
  * @param {Object} paramObject The JavaScript object providing: path
  * @throws EvalException "Error setting the test window, undefined."
  */
  this.setTestWindow = function(paramObject){
    var res = eval ('windmill.testWindow ='+ paramObject.path +';');
    if (typeof(res) == 'undefined'){
      throw "Error setting the test window, undefined.";
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
      try {
        if (windmill.windowReg[i].document.title == title){
          newW = windmill.windowReg[i];
        }
      } catch(err){
        // The window reference is no longer valid, remove it
        windmill.windowReg.splice(i,i);
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
  * Execute some arbitrary JS
  * @param {Object} paramObject The JavaScript object providing: js
  */
  this.execIDEJS = function(paramObject){
    var js = paramObject.js;
    return eval.call(window, js);
  };

  this.execJS = function(paramObject){
    var js = paramObject.js;
    return windmill.testWin().eval(js);
  };

  this.execJQuery = function(paramObject){
    paramObject.jquery = windmill.helpers.replaceAll(paramObject.jquery, ").", ")<*>");
    var jQ = jQuery(windmill.testWin().document);
    var chain= paramObject.jquery.split('<*>');

    paramObject.jquery = windmill.helpers.replaceAll(paramObject.jquery, "<*>", ".");
    var start = eval('jQ.find'+chain[0]);
    var theRest = paramObject.jquery.replace(chain[0],'');
    element = eval('start'+theRest);
  };

  this.triggerEvent = function(paramObject){
    var element = lookupNode(paramObject);
    windmill.events.triggerEvent(element, paramObject.option, true);
  };
};






/* MooTools Element.Dimensions code, refactored to work as generic methods instead of prototype alterations. */



var utils = {

  getWindowScroll: function(win){
    var doc = win.document;
    doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
    return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
  },

  getSize: function(element){
    return {x: element.offsetWidth, y: element.offsetHeight};
  },

  getScrollSize: function(element){
    return {x: element.scrollWidth, y: element.scrollHeight};
  },

  getScroll: function(element){
    return {x: element.scrollLeft, y: element.scrollTop};
  },

  getScrolls: function(element){
    var position = {x: 0, y: 0};
    while (element && !utils.isBody(element)){
      position.x += element.scrollLeft;
      position.y += element.scrollTop;
      element = element.parentNode;
    }
    return position;
  },

  getOffsetParent: function(element){
    if (utils.isBody(element)) return null;
    if (!windmill.browser.isIE) return element.offsetParent;
    while ((element = element.parentNode) && !utils.isBody(element)){
      if (utils.styleString(element, 'position') != 'static') return element;
    }
    return null;
  },

  getOffsets: function(element){
    if (element.getBoundingClientRect){
      var bound = element.getBoundingClientRect(),
          bod = windmill.testWin().document.body,
          bodScroll = utils.getScroll(bod),
          elemScrolls = utils.getScrolls(element),
          elemScroll = utils.getScroll(element),
          isFixed = (utils.styleString(element, 'position') == 'fixed');

      return {
        x: parseInt(bound.left, 10) + elemScrolls.x - elemScroll.x + ((isFixed) ? 0 : bodScroll.x) - bod.clientLeft,
        y: parseInt(bound.top, 10)  + elemScrolls.y - elemScroll.y + ((isFixed) ? 0 : bodScroll.y) - bod.clientTop
      };
    }

    position = {x: 0, y: 0};
    if (utils.isBody(element)) return position;
    var el = element;
    while (el && !utils.isBody(el)){
      position.x += el.offsetLeft;
      position.y += el.offsetTop;

      if (Browser.Engine.gecko){
        if (!utils.borderBox(el)){
          position.x += utils.leftBorder(el);
          position.y += utils.topBorder(el);
        }
        var parent = el.parentNode;
        if (parent && utils.styleString(parent, 'overflow') != 'visible'){
          position.x += utils.leftBorder(parent);
          position.y += utils.topBorder(parent);
        }
                                   //no detection for webkit in general?
      } else if (el != element && (windmill.browser.isChrome || windmill.browser.isSafari)){
        position.x += utils.leftBorder(el);
        position.y += utils.topBorder(el);
      }

      el = element.offsetParent;
    }
    if (windmill.browser.isGecko && !utils.borderBox(element)){
      position.x -= utils.leftBorder(element);
      position.y -= utils.topBorder(element);
    }
    return position;
  },

  getPosition: function(element, relative){
    if (utils.isBody(element)) return {x: 0, y: 0};
    var offset = utils.getOffsets(element),
        scroll = utils.getScrolls(element);
    var position = {
      x: offset.x - scroll.x,
      y: offset.y - scroll.y
    };
    var relativePosition = (relative && (relative = relative)) ? utils.getPosition(relative) : {x: 0, y: 0};
    return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
  },

  getCoordinates: function(element, relative){
    var position = utils.getPosition(element, relative),
        size = utils.getSize(element);
    var obj = {
      left: position.x,
      top: position.y,
      width: size.x,
      height: size.y
    };
    obj.right = obj.left + obj.width;
    obj.bottom = obj.top + obj.height;
    return obj;
  },
  getDocument: function(element){
    return element.ownerDocument;
  },
  getWindow: function(element){
    return element.ownerDocument.window;
  },
  camelCase: function(str){
    return str.replace(/-\D/g, function(match){
      return match.charAt(1).toUpperCase();
    });
  },
  hyphenate: function(str){
    return str.replace(/[A-Z]/g, function(match){
      return ('-' + match.charAt(0).toLowerCase());
    });
  },
  capitalize: function(str){
    return str.replace(/\b[a-z]/g, function(match){
      return match.toUpperCase();
    });
  },
  styleString: function(element, property){
    if (element.currentStyle) return element.currentStyle[utils.camelCase(property)];
    var computed = utils.getDocument(element).defaultView.getComputedStyle(element, null);
    return (computed) ? computed.getPropertyValue([utils.hyphenate(property)]) : null;
  },
  styleNumber: function(element, style){
    var parsed = parseInt(utils.styleString(element, style), 10);
    if (isNaN(parsed)) parsed = 0;
    return parsed;
  },
  borderBox: function(element){
    return utils.styleString(element, '-moz-box-sizing') == 'border-box';
  },
  topBorder: function(element){
    return styleNumber(element, 'border-top-width');
  },
  leftBorder: function(element){
    return styleNumber(element, 'border-left-width');
  },
  isBody: function(element){
    return (/^(?:body|html)$/i).test(element.tagName);
  },
  getCompatElement: function(element){
    var doc = utils.getDocument(element);
    return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
  },
  getStyle: function(element, property, returnInt) {
    returnInt = returnInt == null ? true : returnInt;
    switch (property){
      case 'opacity': return this.get('opacity');
      case 'float': property = (windmill.browser.isIE) ? 'styleFloat' : 'cssFloat';
    }
    var result = element.style[property];
    if (result !== 0 && !result) result = utils.styleString(element, property);
    if (returnInt) {
      result = parseInt(result, 10);
      if (isNaN(result)) result = 0;
    }
    return result;
  },
  curry: function (fn, scope) {
    scope = scope || window;
    var args = [];
    for (var i=2, len = arguments.length; i < len; ++i) {
      args.push(arguments[i]);
    };
    return function() {
      fn.apply(scope, args);
    };
  },
  now: Date.now || function(){
    return +new Date;
  },
  splitterRegex: /[-|+]?\d+/g,
  parseCoords: function(str){
    if (str.indexOf('),(') >= 0) {
      var split = str.split('),(');
      return {
        start: utils.parseCoords(split[0]),
        end: utils.parseCoords(split[1])
      };
    } else {
      var match = str.match(utils.splitterRegex);
      return {
        x: parseInt(match[0], 10),
        y: parseInt(match[1], 10)
      };
    }
  },
  extend: function(obj1, obj2){
    for (name in obj2) {
      obj1[name] = obj2[name];
    }
    return obj1;
  },
  getCursor: function(){
    if (!this._cursor) {
      var i = this._cursor = windmill.testWin().document.createElement('img');
      i.id = "mc";
      i.style.display = 'none';
      i.style.border = "0px";
      i.style.position = "absolute";
      i.zIndex = "100000000000";
      windmill.testWin().document.body.appendChild(i);
      i.src = "/windmill-serv/img/mousecursor.png";
    }
    return this._cursor;
  },
  dragFromTo: function(opts){
    var options = {
      //the element to drag
      element: null,
      //or specify an explicit x/y for the start position
      start: null,
      //a callback to execute after the transition
      callback: function(){},
      // + one of the following
      //an element to move the dragged element to
        toElement: null, 
      //an offset with x/y integers that represent absolute position in the window to drag the element to
        endPosition: null,
      //an offset with x/y integers relative to the current element position to drag the element to
        offset: null
    };
    utils.extend(options, opts);
    var webApp = windmill.testWin();
    var start = options.start;
    if (!start) {
      var pos = utils.getCoordinates(options.element, windmill.testWin().document.body);
      var scrolls = utils.getWindowScroll(windmill.testWin().window);
      start = {
        x: pos.left + scrolls.x,
        y: pos.top + scrolls.y
      };
    }
    
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, start.x, start.y);
    windmill.events.triggerMouseEvent(element, 'mousedown', true, start.x, start.y);
    var end;
    //if there's a specific offset, go to that
    if (options.offset) {
      end = {
        x: start.x + options.offset.x,
        y: start.y + options.offset.y
      };
    //if there's an element, go to its offset position
    } else if (options.toElement){
      end = utils.getPosition(options.toElement, document.body);
    //else go to the specified end position
    } else {
      end = options.endPosition;
    }
    this.moveMouse({
      start: {
        x: start.x,
        y: start.y
      }, 
      end: end, 
      callback: function(){
        windmill.events.triggerMouseEvent(element, 'mouseup', true, end.x, end.y);
        windmill.events.triggerMouseEvent(element, 'click', true);
        options.callback();
      }
    });
  },
  moveMouse: function(opts){

    var options = {
      start: null,
      end: null,
      callback: function(){},
      showCursor: true,
      //if pause execution while we run the transition
      pauseLoop: true
    };

    utils.extend(options, opts);
    if (options.pauseLoop) {
      windmill.pauseLoop();
    }

    var cursor;
    if (options.showCursor) {
      cursor = this.getCursor();
      cursor.style.top = options.start.y + 'px';
      cursor.style.left = options.start.x + 'px';
      cursor.style.display = 'block';
    }
    windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, options.start.x, options.start.y);
    var xtrans = new Transition({
      from: options.start.x,
      to: options.end.x,
      onStep: function(x) {
        windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, x, options.start.y); 
        if (cursor) cursor.style.left = x + 'px';
      }
    });
    var ytrans = new Transition({
      from: options.start.y,
      to: options.end.y,
      onStep: function(y) {
        windmill.events.triggerMouseEvent(windmill.testWin().document.body, 'mousemove', true, options.end.x, y);
        if (cursor) cursor.style.top = y + 'px';
      },
      onComplete: function(){
        if (cursor) cursor.style.display = 'none';
        if (options.callback) options.callback();
        if (options.pauseLoop) windmill.continueLoop();
      }
    });
    xtrans.start().chain(function(){
      ytrans.start();
    });
  },
  type: function(obj){
    if (obj == undefined) return false;
    if (obj.nodeName){
      switch (obj.nodeType){
        case 1: return 'element';
        case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
      }
    } else if (typeof obj.length == 'number'){
      if (obj.callee) return 'arguments';
    }
    return typeof obj;
  },
  log: function(){
    var parse = function(){
      var str = '';
      for (var i = 0; i < arguments.length; i++) {
        var value = arguments[i];
        switch (utils.type(value)) {
          case 'element':
            str += value.tagName.toLowerCase();
            if (value.id) str += '#' + value.id;
            if (value.className) str += value.className.split(' ').join('.');
            break;

          case 'array':
            str +='[';
            var results = [];
            for (var index = 0; index < value.length; index++) {
              results.push(parse(value[index]));
            }
            str += results.join(', ') + ']';
            break;

          case 'object':
            var objs = [];
            for (name in value) {
              if (utils.type(value[name]) != 'object') {
                objs.push(name + ': ' + parse(value[name]));
              } else {
                objs.push(name + ': (object)');
              }
            }
            str += '{' + objs.join(', ') + '}';
            break;

          case 'function':
            str += '(function)';
            break;

          case 'boolean':
            str += String(value);
            break;

          default: str += value;
        }
        if (i != (arguments.length - 1)) str += ' ';
      }
      return str;
    };
    windmill.out(parse.apply(this, arguments));
  }
};
var Transition = function(options){
  /* 
    options = {
      from: 0, //required, integer
      to: 100, //required, integer
      duration: 10000, //milliseconds; optional - defaults to 1000
      onStep: someFunction(delta){}, //required
      onComplete: someOtherFunction(){}, //optional
      intOnly: true //the delta arg passed to onStep will be an integer (rounded)
    }
  */
  options.intOnly = options.intOnly != null ? options.intOnly : true;
  if (!options.duration) options.duration = 500;
  this.start = function(){
    this.time = utils.now();
    this.timer = setInterval(utils.curry(this.step, this), 20);
    return this;
  };
  this.step = function(){
    var time = utils.now();
    var delta = (options.to - options.from);
    var timeDelta = time - this.time;
    var destination = options.from + (delta * (timeDelta / options.duration));
    if (options.intOnly) destination = parseInt(destination, 10);
    if (time < this.time + options.duration && destination != options.to) {
      options.onStep(destination);
    } else {
      options.onStep(options.to);
      this.stop();
    }
  };
  this.stop = function(){
    clearInterval(this.timer);
    if (options.onComplete) options.onComplete();
    this.callChain();
    return this;
  };
  this.chained = [];
  this.chain = function(fn){
    this.chained.push(fn);
    return this;
  };
  this.callChain = function(){
    return (this.chained.length) ? this.chained.shift().apply(this, arguments) : false;
  };
  return this;
};