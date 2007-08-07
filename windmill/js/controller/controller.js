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

/*
 * Copyright 2004 ThoughtWorks, Inc
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
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
    
    this.extensions              = {};
    this.commands             = {};
    this.optionLocatorFactory = new OptionLocatorFactory();

    
        /*******************************
        /* Helper functions, non user facing
        /* Note: the getControllerMethods command above returns a list of all the user facing functions to the user
        /* And the ones that start with an underscore are ignored in that list
        /* So if you are adding functionality for internal use and doesnt map from json please start with _
        /*******************************/
        this._getDocument = function () { return windmill.testingApp.document; }
        this._getCurrentWindow = function() { return parent; }
        this._getTitle = function() {
            var t = this._getDocument().title;
            if (typeof(t) == "string") {
                t = t.trim();
            }
            return t;
        }
    
        //Translates from the way we are passing objects to functions to the lookups
        this._lookupDispatch = function (param_object){

            var element = null;
            //If a link was passed, lookup as link
            if(typeof param_object.link != "undefined") {
                element = this.findElement("link=" + param_object.link)
            }
        
            //if xpath was passed, lookup as xpath
            if(typeof param_object.xpath != "undefined") {                
                element = this.findElement("xpath=" + param_object.xpath);
            }
        
            //if id was passed, do as such
            if(typeof param_object.id != "undefined") {
                element = this.findElement("id=" + param_object.id)
            }
        
            //if jsid was passed
            if(typeof param_object.jsid != "undefined") {
                var jsid;
                eval ("jsid=" + param_object.jsid + ";");
                element = this.findElement("id=" + jsid);
            }
        
            //if name was passed
            if(typeof param_object.name != "undefined") {
                element = this.findElement("name=" + param_object.name)
            }        
            

            return element;
        };
    
        //Function to handle the random keyword scenario
        this._handleVariable = function (actualValue){
             
             var variables = actualValue.match(/{\$[^}]*}/g);
             console.log(variables);
             
             for (var i = 0; i < variables.length; i++){
                var variable = variables[i];
                if (windmill.varRegistry.hasKey(variable)){
                   actualValue = actualValue.replace(variable, windmill.varRegistry.getByKey(variable));
                }
                //if it doesn't exist and contains the string random we create it (username or pass etc)
                else if (variable.indexOf('random') != -1){
                 actualValue = actualValue.replace(variable, windmill.varRegistry.addItemCreateValue(variable));
                }
              }
        
          return actualValue;
         }
    
    /************************************
    /* User facing windmill functionality
    /************************************/
    this.defer = function (){
        //We may want to somehow display that the loop is being deferred but right now it was too messy in output.
        //windmill.ui.results.writeResult('Deferring..')
        //If we are getting defers, no tests are running.. and the playback button should be available
        //windmill.remote.$('playback').src = 'ide/img/playback.png';
        //console.log(windmill.remote.$('playback'));
    };
    
    //After a page is done loading, continue the loop
    this.continueLoop = function (){
        windmill.xhr.loopState = 1;
        windmill.xhr.startJsonLoop();
    };
    
    //open an url in the webapp iframe
    this.open = function (param_object) {
        
        
        webappframe = document.getElementById('webapp');
        //url = this._handleRandom(param_object.url);
        
        webappframe.src = param_object.url;
        
        //Turn off loop until the onload for the iframe restarts it
        windmill.xhr.loopState = 0;
        return true;
    };
    
    
    //Currently only does one level below the provided div
    //To make it more thorough it needs recursion to be implemented later
    this.assertText = function (param_object) { 
        
        var n = this._lookupDispatch(param_object);
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
    this.assertNode = function (param_object) { 
   
     var element = this._lookupDispatch(param_object);
     if (!element){
      return false;
     }
      return true;
   };   
 
    //Assert that a specified node exists
    this.assertProperty = function (param_object) { 
   
     var element = this._lookupDispatch(param_object);
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
  
   //Type Function
   this.type = function (param_object){
   
   var element = this._lookupDispatch(param_object);
   if (!element){
       return false;
   }
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
         
         //actualValue = this._handleRandom(actualValue);
         
         //Set the value
         element.value = actualValue;
         
         // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
         //Another wierd chrome thing?
         windmill.events.triggerEvent(element, 'change', true);
         
         return true;
   };
       
    //Wait function
    this.wait = function (param_object){
        windmill.xhr.togglePauseJsonLoop();

        done = function(){
            windmill.xhr.togglePauseJsonLoop();
            return true;
        }
        var t = setTimeout("done()", param_object.milliseconds);
        //alert(t);
    };
    
    //Initial stab at selector functionality, taken from selenium-browserbot.js
    /*
    * Select the specified option and trigger the relevant events of the element.
    */
    this.select = function (param_object) {
        var element = this._lookupDispatch(param_object);
        
        if (!element){
               return false;
         }
           
        /*if (!("options" in element)) {
               //throw new WindmillError("Specified element is not a Select (has no options)");
               
         }*/
        
        var locator = this.optionLocatorFactory.fromLocatorString('label=' + param_object.option);
        
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
        
            var webApp = parent.frames['webapp'];
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
           var webApp = parent.frames['webapp'];
           windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.source[0], p.source[1]);
           windmill.events.triggerMouseEvent(webApp.document.body, 'mousedown', true);
           windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, p.destination[0], p.destination[1]);
           windmill.events.triggerMouseEvent(webApp.document.body, 'mouseup', true);
           windmill.events.triggerMouseEvent(webApp.document.body, 'click', true);

           return true;
       };
   
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
    
    //After the app reloads you have to re overwrite the alert function for the TestingApp
    this.reWriteAlert = function(param_object){
      windmill.testingApp.window.alert = function(s){
          windmill.ui.results.writeResult("<br>Alert: <b><font color=\"#fff32c\">" + s + "</font>.</b>");     
      };

        return true;
    };
    
    /*******************************************************************************************************
    /* Commands namespace functions, mostly system specific for the server to inderact with the client
    /******************************************************************************************************/
      
       //This function allows the user to specify a string of JS and execute it
       this.commands.execJS = function(param_object){
          
          //Lets send the result now to the server
          var json_object = new windmill.xhr.json_call('1.1', 'command_result');
          var params_obj = {};
          
          try {
            params_obj.result = eval(param_object.code); 
           
          }
          catch(error){
            params_obj.result = error;
          }
          
          params_obj.status = true;
          params_obj.uuid = param_object.uuid;
          //params_obj.result = r;
          json_object.params = params_obj;
          var json_string = fleegix.json.serialize(json_object)
    
          var resp = function(str){
            return true;
          }
          
          result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
          resp(result);
          
          return false;
        
       }
    
       //Give the backend a list of available controller methods
       this.commands.getControllerMethods = function (param_object){
           var str = '';
           for (var i in windmill.controller) { if (i.indexOf('_') == -1){ str += "," + i; } }
           for (var i in windmill.controller.extensions) {
               if (str) { str += ',' }
               str += 'extensions.'+i;
           }
           for (var i in windmill.controller.commands) {
               if (str) { str += ',' }
               str += 'commands.'+i;
           }
          
          //Clean up
          var ca = new Array();
          ca = str.split(",");
          ca = ca.reverse();
          ca.pop();
          ca.pop();
          ca.pop();
          ca.pop();
          ca = ca.sort();

          //Send to the server
          var json_object = new windmill.xhr.json_call('1.1', 'command_result');
          var params_obj = {};
          params_obj.status = true;
          params_obj.uuid = param_object.uuid;
          params_obj.result = ca;
          json_object.params = params_obj;
          var json_string = fleegix.json.serialize(json_object)
    
          var resp = function(str){
            return true;
          }
          
          result = fleegix.xhr.doPost('/windmill-jsonrpc/', json_string);
          resp(result);
          
          return false;
       };
        
        //Keeping the suites running 
        this.commands.setOptions = function (param_object){
        
            if(typeof param_object.stopOnFailure != "undefined") {
                windmill.stopOnFailure = param_object.stopOnFailure;
            }
            if(typeof param_object.showRemote != "undefined") {
                windmill.showRemote = param_object.showRemote;
            }
            if(typeof param_object.runTests != "undefined") {
                windmill.runTests = param_object.runTests;
            }
        
            return true;
        };
        
    /********************************************************************************
    /* DOM location functionality, all used for various types of lookups in the DOM
    /*********************************************************************************/
    
    //A big part of the following is adapted from the selenium project browserbot
    
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
            console.log('Error')

        }
        if (elements.length <= index) {
            //throw new WindmillError("Index out of range: " + index);
            console.log('Error')
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
    
    //All Element Lookup functionality, based on selenium browserbot code
    this.findElement = function (locator) {
        var locatorType = 'implicit';
        var locatorString = locator;
        
        // If there is a locator prefix, use the specified strategy
        var result = locator.match(/^([A-Za-z]+)=(.+)/);
        if (result) {
            locatorType = result[1].toLowerCase();
            locatorString = result[2];
        }
        
          var element = this.findElementBy(locatorType, locatorString, this._getDocument(), parent.frames[1]);
            if (element != null) {
                return element;
            }
            
        for (var i = 0; i < parent.frames.length; i++) {
            element = this.findElementBy(locatorType, locatorString, parent.frames[i].document, parent.frames[i]);
            if (element != null) {
                return element;
            }
        };

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

