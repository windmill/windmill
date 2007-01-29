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
 Mozilla specific functionality abstracted to mozController.js
 Safari specific functionality abstracted to safController.js
 IE specific functionality abstracted to ieController.js

 The reason for this is that the start page only includes the one corresponding
 to the current browser, this means that the functionality in the Controller
 object is only for the current browser, and there is only one copy of the code being
 loaded into the browser for performance.
 */
 
function Controller() {
    
    this.optionLocatorFactory = new OptionLocatorFactory();

    this.defer = function(){
        Windmill.UI.write_result('Deferring..')
    }

    this.continue_loop = function(){
        Windmill.XHR.loop_state = 1;
        Windmill.XHR.start_json_loop();
    }
    
    this.open = function(param_object) {
        webappframe = document.getElementById('webapp');
        webappframe.src = param_object.url;
        
        //Turn off loop until the onload for the iframe restarts it
        Windmill.XHR.loop_state = 0;
        return true;
    }
    
    //Helper Functions for dealing with the window
    this.getDocument = function() {
        return this.getCurrentWindow().frames[1].document;
    }

    this.getCurrentWindow = function() {
        //return this.browserbot.getCurrentWindow();
        return parent;
    }

    this.getTitle = function() {
        var t = this.getDocument().title;
        if (typeof(t) == "string") {
            t = t.trim();
        }
        return t;
    }
    
    //Translates from the way we are passing objects to functions to the lookups
    this.lookup_dispatch = function(param_object){
       
        var element = null;
        //If a link was passed, lookup as link
        if(typeof param_object.link != "undefined") {
            element = this.findElement("link=" + param_object.link)
        }
        
        //if xpath was passed, lookup as xpath
        if(typeof param_object.xpath != "undefined") {
            element = this.findElement("xpath=" + param_object.xpath)
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
    }
    
    //-----Windmill UI Functions-----
   
   //Type Function
   this.type = function(param_object){
   
   var element = this.lookup_dispatch(param_object);
   if (!element){
       return false;
   }
         //Get the focus on to the item to be typed in, or selected
         triggerEvent(element, 'focus', false);
         triggerEvent(element, 'select', true);
         
         //Make sure text fits in the textbox
         var maxLengthAttr = element.getAttribute("maxLength");
         var actualValue = param_object.text;

         /*
         if (maxLengthAttr != null) {
             var maxLength = parseInt(maxLengthAttr);
             if (stringValue.length > maxLength) {
                 //truncate it to fit
                 actualValue = stringValue.substr(0, maxLength);
             }
         }
         */
         
         //Set the value
         element.value = actualValue;
         
         
         // DGF this used to be skipped in chrome URLs, but no longer.  Is xpcnativewrappers to blame?
         //Another wierd chrome thing?
         triggerEvent(element, 'change', true);
         
         return true;
   }
       
    //Wait function
    this.wait = function(param_object){
        done = function(){
            return true;
        }
        setTimeout("done()", param_object.seconds);
        
        return true;
    }   
    
    //Initial stab at selector functionality, taken from selenium-browserbot.js
    /*
    * Select the specified option and trigger the relevant events of the element.
    */
    this.select = function(param_object) {
        var element = this.lookup_dispatch(param_object.selectLocator);
        
        if (!element){
               return false;
         }
           
        /*if (!("options" in element)) {
               //throw new SeleniumError("Specified element is not a Select (has no options)");
               
         }*/
        
        var locator = this.optionLocatorFactory.fromLocatorString('label=' + param_object.optionLocator);
        
        var optionToSelect = locator.findOption(element);
        
        triggerEvent(element, 'focus', false);
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
            triggerEvent(element, 'change', true);
        }
        
        return true;
    }

   
    
    //A big part of the following is adapted from the selenium project browserbot
    //Registers all the ways to do a lookup
    this._registerAllLocatorFunctions = function() {
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
        }

        /**
         * Find a locator based on a prefix.
         */
        this.findElementBy = function(locatorType, locator, inDocument, inWindow) {
            var locatorFunction = this.locationStrategies[locatorType];
            if (! locatorFunction) {
                Windmill.Log.debug("Unrecognised locator type: '" + locatorType + "'");
            }
            
            return locatorFunction.call(this, locator, inDocument, inWindow);
        };

        /**
         * The implicit locator, that is used when no prefix is supplied.
         */
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
    this.findElement = function(locator) {
        var locatorType = 'implicit';
        var locatorString = locator;
        
        // If there is a locator prefix, use the specified strategy
        var result = locator.match(/^([A-Za-z]+)=(.+)/);
        if (result) {
            locatorType = result[1].toLowerCase();
            locatorString = result[2];
        }
        
          var element = this.findElementBy(locatorType, locatorString, this.getDocument(), parent.frames[1]);
            if (element != null) {
                return element;
            }
            
        for (var i = 0; i < parent.frames.length; i++) {
            element = this.findElementBy(locatorType, locatorString, parent.frames[i].document, parent.frames[i]);
            if (element != null) {
                return element;
            }
        }

        // Element was not found by any locator function.
        Windmill.Log.debug("Element " + locator + " not found");
    };


    /**
     * Find the element with id - can't rely on getElementById, coz it returns by name as well in IE..
     */
    this.locateElementById = function(identifier, inDocument, inWindow) {
        
        var element = inDocument.getElementById(identifier);
        if (element && element.id === identifier) {
            return element;
        }
        else {
            return null;
        }
    };

    /**
     * Find an element by name, refined by (optional) element-filter
     * expressions.
     */
    this.locateElementByName = function(locator, document, inWindow) {
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

    /**
     * Finds an element using by evaluating the specified string.
     */
    this.locateElementByDomTraversal = function(domTraversal, document, window) {

        var browserbot = this.browserbot;
        var element = null;
        try {
            element = eval(domTraversal);
        } catch (e) {
            Windmill.Log.debug("dom Traversal, element not found.");
        }

        if (!element) {
            return null;
        }

        return element;
    };
    this.locateElementByDomTraversal.prefix = "dom";

    /**
     * Finds an element identified by the xpath expression. Expressions _must_
     * begin with "//".
     */
    this.locateElementByXPath = function(xpath, inDocument, inWindow) {

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

    this._findElementByTagNameAndAttributeValue = function(
            inDocument, tagName, attributeName, attributeValue
            ) {
        if (Windmill.Browser.isIE && attributeName == "class") {
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

    this._findElementByTagNameAndText = function(
            inDocument, tagName, text
            ) {
        var elements = inDocument.getElementsByTagName(tagName);
        for (var i = 0; i < elements.length; i++) {
            if (getText(elements[i]) == text) {
                return elements[i];
            }
        }
        return null;
    };

    this._namespaceResolver = function(prefix) {
        if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
            return 'http://www.w3.org/1999/xhtml';
        } else if (prefix == 'mathml') {
            return 'http://www.w3.org/1998/Math/MathML';
        } else {
            throw new Error("Unknown namespace: " + prefix + ".");
        }
    }

    this._findElementUsingFullXPath = function(xpath, inDocument, inWindow) {
        // HUGE hack - remove namespace from xpath for IE
        if (Windmill.Browser.isIE) {
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
    this.locateElementByLinkText = function(linkText, inDocument, inWindow) {
    
        var links = inDocument.getElementsByTagName('a');
        
        for (var i = 0; i < links.length; i++) {
            var element = links[i];
            if (PatternMatcher.matches(linkText, getText(element))) {
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
function OptionLocatorFactory() {
}

OptionLocatorFactory.prototype.fromLocatorString = function(locatorString) {
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
    throw new SeleniumError("Unkown option locator type: " + locatorType);
};

/**
 * To allow for easy extension, all of the option locators are found by
 * searching for all methods of OptionLocatorFactory.prototype that start
 * with "OptionLocatorBy".
 * TODO: Consider using the term "Option Specifier" instead of "Option Locator".
 */
OptionLocatorFactory.prototype.registerOptionLocators = function() {
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
OptionLocatorFactory.prototype.OptionLocatorByLabel = function(label) {
    this.label = label;
    this.labelMatcher = new PatternMatcher(this.label);
    this.findOption = function(element) {
        for (var i = 0; i < element.options.length; i++) {
            if (this.labelMatcher.matches(element.options[i].text)) {
                return element.options[i];
            }
        }
        throw new SeleniumError("Option with label '" + this.label + "' not found");
    };

    this.assertSelected = function(element) {
        var selectedLabel = element.options[element.selectedIndex].text;
        Assert.matches(this.label, selectedLabel)
    };
};

/**
 *  OptionLocator for options identified by their values.
 */
OptionLocatorFactory.prototype.OptionLocatorByValue = function(value) {
    this.value = value;
    this.valueMatcher = new PatternMatcher(this.value);
    this.findOption = function(element) {
        for (var i = 0; i < element.options.length; i++) {
            if (this.valueMatcher.matches(element.options[i].value)) {
                return element.options[i];
            }
        }
        throw new SeleniumError("Option with value '" + this.value + "' not found");
    };

    this.assertSelected = function(element) {
        var selectedValue = element.options[element.selectedIndex].value;
        Assert.matches(this.value, selectedValue)
    };
};

/**
 *  OptionLocator for options identified by their index.
 */
OptionLocatorFactory.prototype.OptionLocatorByIndex = function(index) {
    this.index = Number(index);
    if (isNaN(this.index) || this.index < 0) {
        throw new SeleniumError("Illegal Index: " + index);
    }

    this.findOption = function(element) {
        if (element.options.length <= this.index) {
            throw new SeleniumError("Index out of range.  Only " + element.options.length + " options available");
        }
        return element.options[this.index];
    };

    this.assertSelected = function(element) {
    	Assert.equals(this.index, element.selectedIndex);
    };
};

/**
 *  OptionLocator for options identified by their id.
 */
OptionLocatorFactory.prototype.OptionLocatorById = function(id) {
    this.id = id;
    this.idMatcher = new PatternMatcher(this.id);
    this.findOption = function(element) {
        for (var i = 0; i < element.options.length; i++) {
            if (this.idMatcher.matches(element.options[i].id)) {
                return element.options[i];
            }
        }
        throw new SeleniumError("Option with id '" + this.id + "' not found");
    };

    this.assertSelected = function(element) {
        var selectedId = element.options[element.selectedIndex].id;
        Assert.matches(this.id, selectedId)
    };
};

