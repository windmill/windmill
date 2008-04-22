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
    
  this.optionLocatorFactory = new OptionLocatorFactory();

    
  /*******************************
    /* Helper functions, non user facing
    /* Note: the getControllerMethods command above returns a list of all the user facing functions to the user
    /* And the ones that start with an underscore are ignored in that list
    /* So if you are adding functionality for internal use and doesnt map from json please start with _
    /*******************************/
    
  this._getDocumentStr = function () { return windmill.testWindowStr + '.document'; }
  this._getWindowStr = function() { return windmill.testWindowStr; }
  this._getDocument = function () { return windmill.testWindow.document; }
  this._getWindow = function() { return windmill.testWindow; }
  
  //Translates from the way we are passing objects to functions to the lookups
  this._lookupDispatch = function (param_object){
    var s = null;
    var element = null;
    //If a link was passed, lookup as link
    if(typeof param_object.link != "undefined") {
      s = 'Looking up link '+ param_object.link;
      element = this.findElement("link=" + param_object.link)
    }
    
    //if xpath was passed, lookup as xpath
    if(typeof param_object.xpath != "undefined") {
      s = 'Looking up xpath '+ param_object.xpath;        
      element = this.findElement("xpath=" + param_object.xpath);
    }
    
    //if id was passed, do as such
    if(typeof param_object.id != "undefined") {
      s = 'Looking up id '+ param_object.id;
      element = this.findElement("id=" + param_object.id)
    }
    
    //if jsid was passed
    if(typeof param_object.jsid != "undefined") {
      //Here if the user hasn't specified the test window scope
      //we use the default and prepend it, else we eval whatever js they passed
      var jsid; 
      if ((param_object.jsid.indexOf('windmill.testWindow') != -1) || (param_object.jsid.indexOf('_w') != -1)){
        eval ("jsid=" + param_object.jsid + ";");
      }
      else{
        eval ("jsid=" + this._getWindowStr() + '.' +param_object.jsid + ";");
      }
        s = 'Looking up jsid '+ jsid;
        element = this.findElement("id=" + jsid);
    }
    //if name was passed
    if(typeof param_object.name != "undefined") {
      s = 'Looking up name '+ param_object.name;
      element = this.findElement("name=" + param_object.name)
    }
    windmill.ui.results.writeResult(s);
    return element;
  };

  //Function to handle the random keyword scenario
  this.handleVariable = function (val){
    var ret = val;
    var matches = val.match(/{\$[^}]*}/g);
    if (matches) {
      for (var i = 0; i < matches.length; i++){
        var m = matches[i];
        if (windmill.varRegistry.hasKey(m)){
          ret = val.replace(m, windmill.varRegistry.getByKey(m));
        }
        //if it doesn't exist and contains the string random we create it (username or pass etc)
        else if (m.indexOf('random') != -1){
          ret = val.replace(m, windmill.varRegistry.addItemCreateValue(m));
        }
      }
    }
    return ret;
  };

/************************************
/* User facing windmill functionality
/************************************/

  //When the service has nothing for us to do  
  this.defer = function (){
    //At some point we may want to display somewhere that we continually get deferred
    //when the backend has nothing for us to do
  };
  
  //After a page is done loading, continue the loop
  this.continueLoop = function (){
      
    cont = function(){
        //If the doc domain has changed
        //and we can't get to it, try updating it
        try{
          var v = opener.document.domain;
        }
        catch(err){
          document.domain = windmill.docDomain;
        }
        
      $('loopLink').innerHTML = 'Pause Loop';
      if (windmill.xhr.loopState == false){
        windmill.xhr.loopState = true;
        windmill.xhr.getNext();
      }
    }
    //Just making sure the page is fully loaded
    setTimeout("cont()", 1000);
  };

  this.stopLoop = function () {
    windmill.xhr.loopState = false;
  };

  //open an url in the webapp iframe
  this.open = function (param_object) {
    //We need to tell the service where we are before we
    //head to a new page
    try{ windmill.testWindow.location = param_object.url; }
    catch(err){}
    //Turn off loop until the onload for the iframe restarts it
      done = function(){
        windmill.controller.waits.forPageLoad({});
        return true;
      }
    setTimeout('done()', 2000);
    return true;
  };
  
  //Type Function
  this.type = function (param_object){

    var element = this._lookupDispatch(param_object);
    if (!element){
      return false;
    }
    //clear the box
    element.value = '';
    //Get the focus on to the item to be typed in, or selected
    windmill.events.triggerEvent(element, 'focus', false);
    windmill.events.triggerEvent(element, 'select', true);
     
    //Make sure text fits in the textbox
    var maxLengthAttr = element.getAttribute("maxLength");
    var actualValue = param_object.text;
    var stringValue = param_object.text;
     
    if (maxLengthAttr != null) {
      var maxLength = parseInt(maxLengthAttr);
      if (stringValue.length > maxLength) {
        //truncate it to fit
        actualValue = stringValue.substr(0, maxLength);
      }
    }
    
    var s = actualValue;
    for (var c = 0; c < s.length; c++){
      if ((!windmill.browser.isSafari) && (!windmill.browser.isOpera)){
        windmill.events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
      }
      else if (windmill.browser.isOpera){
       windmill.events.triggerKeyEvent(element, 'keydown', s.charAt(c), true, false,false, false,false);
       windmill.events.triggerKeyEvent(element, 'keypress', s.charAt(c), true, false,false, false,false); 
      }
      element.value += s.charAt(c);
      windmill.events.triggerKeyEvent(element, 'keyup', s.charAt(c), true, false,false, false,false);
    }
     
    // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
    //Another wierd chrome thing?
    windmill.events.triggerEvent(element, 'change', true);
     
    return true;
  };


  /* Select the specified option and trigger the relevant events of the element.*/
  this.select = function (param_object) {
    var element = this._lookupDispatch(param_object);
    if (!element){ return false; }
      
    var locatorType = param_object.locatorType || 'LABEL';
    /*if (!("options" in element)) {
    //throw new WindmillError("Specified element is not a Select (has no options)");
           
    }*/
    
    var locator = this.optionLocatorFactory.fromLocatorString(
  							    locatorType.toLowerCase() + '=' + param_object.option);

    var optionToSelect = locator.findOption(element);
    
    windmill.events.triggerEvent(element, 'focus', false);
    var changed = false;
    for (var i = 0; i < element.options.length; i++) {
      var option = element.options[i];
      if (option.selected && option != optionToSelect) {        
        option.selected = false;
        changed = true;
      }
      else if (!option.selected && option == optionToSelect) {        
        option.selected = true;
        changed = true;        
      }
    }
  

    if (changed) {
      windmill.events.triggerEvent(element, 'change', true);
    }
    return true;
  };

  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDrop = function (param_object){   
   
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
  }
                
    
    var dragged = this._lookupDispatch(p.dragged);
    var dest = this._lookupDispatch(p.destination);
    var mouseDownPos = getPos(dragged, 'mouseDown');
    var mouseUpPos = getPos(dest, 'mouseUp');
    
    var webApp = windmill.testWindow;
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseDownPos[0], mouseDownPos[1]);
    windmill.events.triggerMouseEvent(dragged, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseUpPos[0], mouseUpPos[1]);
    windmill.events.triggerMouseEvent(dragged, 'mouseup', true);
    windmill.events.triggerMouseEvent(dragged, 'click', true);
        
    return true;
  };

  //Drag Drop functionality allowing functions passed to calculate cursor offsets
  this.dragDropXY = function (param_object){

    var p = param_object;
    var webApp = windmill.testWindow;
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.source[0], p.source[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousedown', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.destination[0], p.destination[1]);
    windmill.events.triggerMouseEvent(webApp.document.body, 'mouseup', true);
    windmill.events.triggerMouseEvent(webApp.document.body, 'click', true);

    return true;
  };
   
  //Functions for interacting with the windmill variable storage
  //Store the url of a provided link on the page, to be accessed later
  //Ususally with an open
  this.storeURL = function(param_object){
    var linkNode = this._lookupDispatch(param_object);
    if (linkNode){
      windmill.varRegistry.addItem('{$'+param_object.link +'}',linkNode.href);
      return true;
    }
    else{
      return false;
    }
  }
  
  //Allow the user to update the document.domain for the IDE
  this.setDomain = function(param_object){
    document.domain = param_object.domain;
    return true;
  }

  //Directly access mouse events
  this.mousedown = function (param_object){
      var mupElement = this._lookupDispatch(param_object);
      windmill.events.triggerMouseEvent(mupElement, 'mousedown', true);  
    
      return true;
  };

  this.mouseup = function (param_object){
    var mdnElement = this._lookupDispatch(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseup', true);
    
    return true;
  };
  
  this.mouseover = function (param_object){
    var mdnElement = this._lookupDispatch(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseover', true);
    
    return true;
  };

  this.mouseout = function (param_object){
    var mdnElement = this._lookupDispatch(param_object);
    windmill.events.triggerMouseEvent(mdnElement, 'mouseout', true);
    
    return true;
  };
  
  //Browser navigation functions
  this.goBack = function(param_object){
    windmill.testWindow.history.back();
    return true;
  }
  this.goForward = function(param_object){
    windmill.testWindow.history.forward();
    return true;
  }
  this.refresh = function(param_object){
    windmill.testWindow.location.reload(true);
    return true;
  }
  
  //After the app reloads you have to re overwrite the alert function for the TestingApp
  this.reWriteAlert = function(param_object){
    windmill.rwAlert = true;
    windmill.testWindow.alert = function(s){
      windmill.ui.results.writeResult("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
    };
    
    rwaRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;
      
      for (var i=0;i<iframeCount;i++){
          try{
  	        iframeArray[i].alert = function(s){
        		  windmill.ui.results.writeResult("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
     	      };
  	        rwaRecurse(iframeArray[i]);
          }
          catch(error){             
           	windmill.ui.results.writeResult('There was a problem rewriting alert on one of your iframes, is it cross domain?' +
  					  'Binding to all others.' + error);     
          }
        }
    }
    rwaRecurse(windmill.testWindow);
    
    return true;
  };
  
    //After the app reloads you have to re overwrite the alert function for the TestingApp
 /* this.reWriteOpen = function(param_object){
    //Keep track of the real window open function
    windmill.openWindow = windmill.testWindow.open;
    
    windmill.testWindow.open = function(){
      //alert('asda');
      var args = Array.prototype.slice.call(arguments);
      var p = windmill.openWindow.apply(window, args);
      var date = new Date();
      var wid = date.getTime();
      windmill.varRegistry.addItem(wid,p);
      return p;
    };
    
    rwaRecurse = function(frame){
      var iframeCount = frame.frames.length;
      var iframeArray = frame.frames;
      
      for (var i=0;i<iframeCount;i++){
          try{
  	        iframeArray[i].open = function(){
               var args = Array.prototype.slice.call(arguments);
               var p = windmill.openWindow.apply(window, args);
               var date = new Date();
               var wid = date.getTime();
               windmill.varRegistry.addItem(wid,p);
               return p;
     	      };
  	        rwaRecurse(iframeArray[i]);
          }
          catch(error){             
           	windmill.ui.results.writeResult('There was a problem rewriting open on one of your iframes, is it cross domain?' +
  					  'Binding to all others.' + error);     
          }
        }
    }
    rwaRecurse(windmill.testWindow);
    
    return true;
  };
   */
  //Allow the user to set the testWindow to a different window 
  //or frame within the page 
  this.setTestWindow = function(param_object){
    var res = eval ('windmill.testWindow ='+ param_object.path +';');
    if (typeof(res) != 'undefined'){
      return true;
    }
    return false;
  }
  
  // The browser nav buttons
  
  
  /********************************************************************************
  /* DOM location functionality, all used for various types of lookups in the DOM
  /*********************************************************************************/
        
  // Refine a list of elements using a filter.
  this.selectElementsBy = function (filterType, filter, elements) {
    var filterFunction = this.filterFunctions[filterType];
    if (! filterFunction) {
      throw new WindmillError("Unrecognised element-filter type: '" + filterType + "'");
    }

    return filterFunction(filter, elements);
  };

  this.filterFunctions = {};

  this.filterFunctions.name = function (name, elements) {
    var selectedElements = [];
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].name === name) {
        selectedElements.push(elements[i]);
      }
    }
    return selectedElements;
  };

  this.filterFunctions.value = function (value, elements) {
    var selectedElements = [];
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].value === value) {
        selectedElements.push(elements[i]);
      }
    }
    return selectedElements;
  };

  this.filterFunctions.index = function (index, elements) {
    index = Number(index);
    if (isNaN(index) || index < 0) {
      //throw new WindmillError("Illegal Index: " + index);
      //console.log('Error')

    }
    if (elements.length <= index) {
      //throw new WindmillError("Index out of range: " + index);
      //console.log('Error')
    }
    return [elements[index]];
  };

  this.selectElements = function (filterExpr, elements, defaultFilterType) {

    var filterType = (defaultFilterType || 'value');

    // If there is a filter prefix, use the specified strategy
    var result = filterExpr.match(/^([A-Za-z]+)=(.+)/);
    if (result) {
      filterType = result[1].toLowerCase();
      filterExpr = result[2];
    }

    return this.selectElementsBy(filterType, filterExpr, elements);
  };

    
  //Registers all the ways to do a lookup
  this._registerAllLocatorFunctions = function () {
    // TODO - don't do this in the constructor - only needed once ever
    this.locationStrategies = {};
    for (var functionName in this) {
      var result = /^locateElementBy([A-Z].+)$/.exec(functionName);
      if (result != null) {
        var locatorFunction = this[functionName];
        if (typeof(locatorFunction) != 'function') {
  	      continue;
        }
        // Use a specified prefix in preference to one generated from
        // the function name
        var locatorPrefix = locatorFunction.prefix || result[1].toLowerCase();
        this.locationStrategies[locatorPrefix] = locatorFunction;
      }
  };

        
  //Find a locator based on a prefix.
  this.findElementBy = function (locatorType, locator, inDocument, inWindow) {
    var locatorFunction = this.locationStrategies[locatorType];
    if (! locatorFunction) {
      windmill.ui.results.writeResult("Unrecognised locator type: '" + locatorType + "'");
    }
            
    return locatorFunction.call(this, locator, inDocument, inWindow);
  };

      
  // The implicit locator, that is used when no prefix is supplied.
  this.locationStrategies['implicit'] = function(locator, inDocument, inWindow) {
    if (locator.startsWith('//')) {
      return this.locateElementByXPath(locator, inDocument, inWindow);
    }
    if (locator.startsWith('document.')) {
      return this.locateElementByDomTraversal(locator, inDocument, inWindow);
    }
           
    return this.locateElementByIdentifier(locator, inDocument, inWindow);
            
  };
}
    
this.findElement = function (locator) {
    var locatorType = 'implicit';
    var locatorString = locator;
        
    // If there is a locator prefix, use the specified strategy
    var result = locator.match(/^([A-Za-z]+)=(.+)/);
    if (result) {
      locatorType = result[1].toLowerCase();
      locatorString = result[2];
    }
    //Closure to store the actual element found
    var e = null;
    
    //inline function to recursively find the element in the DOM, cross frame.
    var findElementRecursive = function(w, locatorType, locatorString){
      //do the lookup in the current window
      element = windmill.controller.findElementBy(locatorType, locatorString, w.document, w);   
      if (!element){
        var frameCount = w.frames.length;
        var frameArray = w.frames;   
        for (var i=0;i<frameCount;i++){ findElementRecursive(frameArray[i], locatorType, locatorString); }
      }
      else {
        e = element;
      }
    };   
    
    findElementRecursive(windmill.testWindow, locatorType, locatorString);
    if (e) { return e; }

    // Element was not found by any locator function.
    windmill.ui.results.writeResult("Element " + locator + " not found");
};


    
//Find the element with id - can't rely on getElementById, coz it returns by name as well in IE.. 
this.locateElementById = function (identifier, inDocument, inWindow) {
        
  var element = inDocument.getElementById(identifier);
  if (element && element.id === identifier) {
    return element;
  }
  else {
    return null;
  }
};

    
//Find an element by name, refined by (optional) element-filter expressions.
this.locateElementByName = function (locator, document, inWindow) {
  var elements = document.getElementsByTagName("*");

  var filters = locator.split(' ');
  filters[0] = 'name=' + filters[0];

  while (filters.length) {
    var filter = filters.shift();
    elements = this.selectElements(filter, elements, 'value');
  }

  if (elements.length > 0) {
    return elements[0];
  }
  return null;
};


// Finds an element using by evaluating the specified string.
this.locateElementByDomTraversal = function (domTraversal, document, window) {

  //var browserbot = this.browserbot;
  var element = null;
  try {
    element = eval(domTraversal);
  } catch (e) {
    windmill.ui.results.writeResult("dom Traversal, element not found.");
  }

  if (!element) {
    return null;
  }

  return element;
};
this.locateElementByDomTraversal.prefix = "dom";

    
//Finds an element identified by the xpath expression. Expressions _must_
//begin with "//".
this.locateElementByXPath = function (xpath, inDocument, inWindow) {

  // Trim any trailing "/": not valid xpath, and remains from attribute
  // locator.
  if (xpath.charAt(xpath.length - 1) == '/') {
    xpath = xpath.slice(0, -1);
  }

  // Handle //tag
  var match = xpath.match(/^\/\/(\w+|\*)$/);
  if (match) {
    var elements = inDocument.getElementsByTagName(match[1].toUpperCase());
    if (elements == null) return null;
    return elements[0];
  }

  // Handle //tag[@attr='value']
  var match = xpath.match(/^\/\/(\w+|\*)\[@(\w+)=('([^\']+)'|"([^\"]+)")\]$/);
  if (match) {
    // We don't return the value without checking if it is null first.
    // This is beacuse in some rare cases, this shortcut actually WONT work
    // but that the full XPath WILL. A known case, for example, is in IE
    // when the attribute is onclick/onblur/onsubmit/etc. Due to a bug in IE
    // this shortcut won't work because the actual function is returned
    // by getAttribute() rather than the text of the attribute.
    var val = this._findElementByTagNameAndAttributeValue(
							  inDocument,
							  match[1].toUpperCase(),
							  match[2].toLowerCase(),
							  match[3].slice(1, -1)
							  );
    if (val) {
      return val;
    }
  }

  // Handle //tag[text()='value']
  var match = xpath.match(/^\/\/(\w+|\*)\[text\(\)=('([^\']+)'|"([^\"]+)")\]$/);
  if (match) {
    return this._findElementByTagNameAndText(
					     inDocument,
					     match[1].toUpperCase(),
					     match[2].slice(1, -1)
					     );
  }

  return this._findElementUsingFullXPath(xpath, inDocument);
};

this._findElementByTagNameAndAttributeValue = function (
							inDocument, tagName, attributeName, attributeValue
							) {
  if (browser.isIE && attributeName == "class") {
    attributeName = "className";
  }
  var elements = inDocument.getElementsByTagName(tagName);
  for (var i = 0; i < elements.length; i++) {
    var elementAttr = elements[i].getAttribute(attributeName);
    if (elementAttr == attributeValue) {
      return elements[i];
    }
  }
  return null;
};

this._findElementByTagNameAndText = function (
					      inDocument, tagName, text
					      ) {
  var elements = inDocument.getElementsByTagName(tagName);
  for (var i = 0; i < elements.length; i++) {
    if (windmill.events.getText((elements[i]) == text)) {
      return elements[i];
    }
  }
  return null;
};

this._namespaceResolver = function (prefix) {
  if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
    return 'http://www.w3.org/1999/xhtml';
  } else if (prefix == 'mathml') {
    return 'http://www.w3.org/1998/Math/MathML';
  } else {
    throw new Error("Unknown namespace: " + prefix + ".");
  }
}

  this._findElementUsingFullXPath = function (xpath, inDocument, inWindow) {
    // HUGE hack - remove namespace from xpath for IE
    if (browser.isIE) {
      xpath = xpath.replace(/x:/g, '')
    }

    // Use document.evaluate() if it's available
    if (inDocument.evaluate) {
      return inDocument.evaluate(xpath, inDocument, this._namespaceResolver, 0, null).iterateNext();
    }

    // If not, fall back to slower JavaScript implementation
    var context = new ExprContext(inDocument);
    var xpathObj = xpathParse(xpath);
    var xpathResult = xpathObj.evaluate(context);
    if (xpathResult && xpathResult.value) {
      return xpathResult.value[0];
    }
    return null;
  };

/**
 * Finds a link element with text matching the expression supplied. Expressions must
 * begin with "link:".
 */
this.locateElementByLinkText = function (linkText, inDocument, inWindow) {
    
  var links = inDocument.getElementsByTagName('a');
       
  for (var i = 0; i < links.length; i++) {
    var element = links[i];
    if (PatternMatcher.matches(linkText, windmill.events.getText(element))) {
      return element;
    }
  }
  return null;
};
this.locateElementByLinkText.prefix = "link";
    
//Register all the ways to lookup an element in a list to access dynamically
this._registerAllLocatorFunctions();  

};

/**
 *  Factory for creating "Option Locators".
 *  An OptionLocator is an object for dealing with Select options (e.g. for
 *  finding a specified option, or asserting that the selected option of 
 *  Select element matches some condition.
 *  The type of locator returned by the factory depends on the locator string:
 *     label=<exp>  (OptionLocatorByLabel)
 *     value=<exp>  (OptionLocatorByValue)
 *     index=<exp>  (OptionLocatorByIndex)
 *     id=<exp>     (OptionLocatorById)
 *     <exp> (default is OptionLocatorByLabel).
 */
function OptionLocatorFactory () {
}

OptionLocatorFactory.prototype.fromLocatorString = function (locatorString) {
  var locatorType = 'label';
  var locatorValue = locatorString;
  // If there is a locator prefix, use the specified strategy
  var result = locatorString.match(/^([a-zA-Z]+)=(.*)/);
  if (result) {
    locatorType = result[1];
    locatorValue = result[2];
  }
  if (this.optionLocators == undefined) {
    this.registerOptionLocators();
  }
  if (this.optionLocators[locatorType]) {
    return new this.optionLocators[locatorType](locatorValue);
  }

  windmill.ui.results.writeResult("Unrecognised locator type: '" + locatorType + "'");
};

/**
 * To allow for easy extension, all of the option locators are found by
 * searching for all methods of OptionLocatorFactory.prototype that start
 * with "OptionLocatorBy".
 * TODO: Consider using the term "Option Specifier" instead of "Option Locator".
 */
OptionLocatorFactory.prototype.registerOptionLocators = function () {
  this.optionLocators={};
  for (var functionName in this) {
    var result = /OptionLocatorBy([A-Z].+)$/.exec(functionName);
    if (result != null) {
      var locatorName = result[1].lcfirst();
      this.optionLocators[locatorName] = this[functionName];
    }
  }
};

/**
 *  OptionLocator for options identified by their labels.
 */
OptionLocatorFactory.prototype.OptionLocatorByLabel = function (label) {
  this.label = label;
  this.labelMatcher = new PatternMatcher(this.label);
  this.findOption = function(element) {
    for (var i = 0; i < element.options.length; i++) {
      if (this.labelMatcher.matches(element.options[i].text)) {
	      return element.options[i];
      }
    }
    windmill.ui.results.writeResult("Option with label '" + this.label + "' not found");
  };

  this.assertSelected = function (element) {
    var selectedLabel = element.options[element.selectedIndex].text;
    Assert.matches(this.label, selectedLabel)
  };
};

/**
 *  OptionLocator for options identified by their values.
 */
OptionLocatorFactory.prototype.OptionLocatorByValue = function (value) {
  this.value = value;
  this.valueMatcher = new PatternMatcher(this.value);
  this.findOption = function(element) {
    for (var i = 0; i < element.options.length; i++) {
      if (this.valueMatcher.matches(element.options[i].value)) {
	      return element.options[i];
      }
    }
       
    windmill.ui.results.writeResult("Option with value '" + this.value + "' not found");
  };

  this.assertSelected = function (element) {
    var selectedValue = element.options[element.selectedIndex].value;
    Assert.matches(this.value, selectedValue)
  };
};

/**
 *  OptionLocator for options identified by their index.
 */
OptionLocatorFactory.prototype.OptionLocatorByIndex = function (index) {
  this.index = Number(index);
  if (isNaN(this.index) || this.index < 0) {
   
    windmill.ui.results.writeResult("Illegal Index: " + index);
    
  }
  this.findOption = function (element) {
    if (element.options.length <= this.index) {        
      windmill.ui.results.writeResult("Index out of range.  Only " + element.options.length + " options available");
    }
    return element.options[this.index];
  };

  this.assertSelected = function (element) {
    Assert.equals(this.index, element.selectedIndex);
  };
};

/**
 *  OptionLocator for options identified by their id.
 */
OptionLocatorFactory.prototype.OptionLocatorById = function (id) {
  this.id = id;
  this.idMatcher = new PatternMatcher(this.id);
  this.findOption = function(element) {
    for (var i = 0; i < element.options.length; i++) {
      if (this.idMatcher.matches(element.options[i].id)) {
	      return element.options[i];
      }
    }
    //windmill.windmill.ui.results.writeResult(.debug("Option with id '" + this.id + "' not found");
       
  };

  this.assertSelected = function (element) {
    var selectedId = element.options[element.selectedIndex].id;
    Assert.matches(this.id, selectedId)
  };
};

