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

//If the user went directly to remote.html
if (!opener) {
    document.location = '/windmill-serv/start.html';
}

//jsonCall
var jsonCall = function(version, method, params) {
    this.version = version || null;
    this.method = method || null;
    this.params = params || [];
};


//Translates from the way we are passing objects to functions to the lookups
var lookupNode = function (paramObject, scroll){
  
  var s = null;
  var element = null;
  
  //If a link was passed, lookup as link
  if(typeof paramObject.link != "undefined") {
    s = 'Looking up link '+ paramObject.link;
    element = elementslib.Element.LINK(paramObject.link);
  }
  //if xpath was passed, lookup as xpath
  else if(typeof paramObject.xpath != "undefined") {
    s = 'Looking up xpath '+ paramObject.xpath;        
    element = elementslib.Element.XPATH(paramObject.xpath);
  }
  //if id was passed, do as such
  else if(typeof paramObject.id != "undefined") {
    s = 'Looking up id '+ paramObject.id;
    element = elementslib.Element.ID(paramObject.id);
  }
  //if jsid was passed
  else if(typeof paramObject.jsid != "undefined") {
    //Here if the user hasn't specified the test window scope
    //we use the default and prepend it, else we eval whatever js they passed
    var jsid = windmill.testWin().eval(paramObject.jsid);
    //eval("jsid=" + paramObject.jsid + ";");
    s = 'Looking up jsid '+ jsid;
    element = elementslib.Element.ID(jsid);
  }
  //if name was passed
  else if(typeof paramObject.name != "undefined") {
    s = 'Looking up name '+ paramObject.name;
    element = elementslib.Element.NAME(paramObject.name);
  }
  //if value was passed
  else if(typeof paramObject.value != "undefined") {
    s = 'Looking up value '+ paramObject.value;
    element = elementslib.Element.VALUE(paramObject.value);
  }
  //if classname was passed
  else if(typeof paramObject.classname != "undefined") {
    s = 'Looking up classname '+ paramObject.classname;
    element = elementslib.Element.CLASSNAME(paramObject.classname);
  }
  //if tagname was passed
  else if(typeof paramObject.tagname != "undefined") {
    s = 'Looking up tagname '+ paramObject.tagname;
    element = elementslib.Element.TAGNAME(paramObject.tagname);
  }
  //if label was passed
  else if(typeof paramObject.label != "undefined") {
    s = 'Looking up label '+ paramObject.label;
    element = elementslib.Element.LABEL(paramObject.label);
  }
  //if jquery was passed
  else if(typeof paramObject.jquery != "undefined") {
    s = 'Looking up jquery selector '+ paramObject.jquery;
    paramObject.jquery = windmill.helpers.replaceAll(paramObject.jquery, ").", ")<*>");
    var jQ = jQuery(windmill.testWin().document);
    var chain= paramObject.jquery.split('<*>');
    
    paramObject.jquery = windmill.helpers.replaceAll(paramObject.jquery, "<*>", ".");
    var start = eval('jQ.find'+chain[0]);
    var theRest = paramObject.jquery.replace(chain[0],'');
    element = eval('start'+theRest);
  }
  else if(typeof paramObject.jqueryframe != "undefined" && typeof paramObject.frameid != "undefined") {
    s = 'Looking up jqueryframe selector '+paramObject.jqueryframe;
    paramObject.jqueryframe = windmill.helpers.replaceAll(paramObject.jqueryframe, ").", ")<*>");
    var jQ = jQuery(windmill.testWin().document.getElementById(paramObject.frameid).contentWindow.document)
    var chain= paramObject.jqueryframe.split('<*>');
    paramObject.jqueryframe = windmill.helpers.replaceAll(paramObject.jqueryframe, "<*>", ".");
    var start = eval('jQ.find'+chain[0]);
    var theRest = paramObject.jqueryframe.replace(chain[0],'');
    element = eval('start'+theRest);
  }
  else if(typeof paramObject.string != "undefined"){
  	s = "Looking up nodes containing text "+ paramObject.string;
    var nodes = jQuery(windmill.testWin().document.body).find("*:contains('"+paramObject.string+"')");
		element = nodes[nodes.length - 1];
	}
  else if(typeof paramObject.rteID != "undefined"){
    s = 'Looking up rte selector '+ paramObject.rte;
    element = lookupNode({id:paramObject.rteID}).contentWindow.document.body; 
  }
  else {
    return false;
  }
  //scroll so that the element is in view
  if (element) { 
    //if the element you accessed is a flex object
    //the scroll into view will actually fail and 
    //throw a crazy DOM exception
    if (scroll != false){
      try {
        element.scrollIntoView(); 
      } catch(err){}
    }
    return element;
  }
  else { throw s + ", failed."; }
};

var arrayToJSPath = function(arr){
  var s = arr.toString();
  var path = windmill.helpers.replaceAll(s, ",", ".");
  return path;
};

var stringToFunc = function (objPathString) {
  var arr = objPathString.split('.');
  var win = windmill.controller;
  var baseObj;
  var parseObjPath = function (name) {
    baseObj = !name ? win : baseObj[name];
    if (!baseObj) {
      var errMsg = 'Method "' + objPathString + '" does not exist.';
      // The syntax-error possibility is only for browsers with
      // a broken eval (IE, Safari 2) -- the script-append hack
      // blindly sets the text of the script without checking syntax
      throw new Error(errMsg);
    }
    return arr.length ? parseObjPath(arr.shift()) : baseObj;
  };
  // call parseObjPath recursively to append each
  // property/key onto the window obj from the array
  // 'foo.bar.baz' => arr = ['foo', 'bar', 'baz']
  // baseObj = window['foo'] =>
  // baseObj = window['foo']['bar'] =>
  // baseObj = window['foo']['bar']['baz']
  return parseObjPath();
};

//visually display a node on the page
var show = function(obj){
  //if we receive a node, use that
  //if we get a locator, use that
  if (obj.nodeType){ elem = obj; }
  else { var elem = lookupNode(obj); }
  
  //use outline in FF, and border in IE
  var prop = windmill.ui.hilightProp;
  
  //reset the outline/border when done
  var reset = function(e){
    elem.style[windmill.ui.hilightProp] = "";
  }
  
  //blink the node
  if (elem){
    elem.style[windmill.ui.hilightProp] = "4px solid orange";
    jQuery(elem).fadeOut(700).fadeIn(700).fadeOut(700).fadeIn(1000, reset);    
  }
};

//Function to handle the random keyword scenario
var handleVariable = function (val){
  var ret = val;
  var matches = val.match(/{\$[^}]*}/g);
  if (matches) {
    for (var i = 0; i < matches.length; i++){
      var m = matches[i];
      if (windmill.varRegistry.hasKey(m)){
        ret = windmill.helpers.replaceAll(ret, m, removeHTMLTags(windmill.varRegistry.getByKey(m)));
      }
      //if it doesn't exist and contains the string random we create it (username or pass etc)
      else if (m.indexOf('random') != -1){
        ret = ret.replace(m, windmill.varRegistry.addItemCreateValue(m));
      }
    }
  }
  return ret;
};

var sendCommandResult = function(status, uuid, result){
  //Send to the server
	var jsonObject = new jsonCall('1.1', 'command_result');
	var params_obj = {"status":status, "uuid":uuid, "result":result};
	jsonObject.params = params_obj;
	var jsonString = JSON.stringify(jsonObject)

	var resp = function(str){ return true; }
    
	result = fleegix.xhr.doPost('/windmill-jsonrpc/', jsonString);
	resp(result);
}

var busyOn = function(){
  //Centering the message on the screen
  var load = document.getElementById('statusMessage');
  load.style.position = 'absolute';
  load.style.display = 'block';
  load.style.left = "";
  load.style.top = "";
  fleegix.dom.center(load);
  var left = load.style.left.replace("px", "");
  var top = load.style.top.replace("px", "");
  var leftInt = left - 60;
  var topInt = top - 40;
  load.style.left = leftInt+"px";
  load.style.top = topInt+"px";

  //Show it
  //$('actionDD').style.visibility = "hidden";
  $('cover').style.display = "block";
}
var busyOff = function(){

  jQuery("#loadMessage").html("Please wait...");
  //$('actionDD').style.visibility = "visible";
  $('cover').style.display = "none";
}

// var closeDialog = function(id) {
//     $('actionDD').style.visibility = "visible";
//     $(id).style.display = 'none';
//     $('gray').style.visibility = 'hidden';
//     $('ide').style.display = 'block';
// };

var updateSpeed = function(){
  windmill.serviceDelay = $('execSpeed').value;
};

var openSettings = function() {
    //Turn off explorers and recorder
    windmill.ui.recorder.recordOff();
    windmill.ui.dx.domExplorerOff();
    windmill.ui.assertexplorer.assertExplorerOff();
    $('execSpeed').value = windmill.serviceDelay;
    //$(id).style.display = 'block';
    jQuery("#dialog").dialog('open');
    // $('ide').style.display = 'none';
    // $('actionDD').style.visibility = "hidden";
};

var openFirebug = function(){
  firebug.init();
  firebug.win.minimize();
  
  //For some reason if you don't do this in IE
  //you can't see the firebug window in the IDE
  if (windmill.browser.isIE){
    $('tabs').style.height = "90%";
  }
  
  try {
    //if firebug has already been injected into the app
    if (!windmill.testWin().firebug){
    	var fbCSS = windmill.testWin().document.createElement('link');
    	fbCSS.rel = "stylesheet";
    	fbCSS.type = "text/css";
    	fbCSS.href = "/windmill-serv/css/firebug-lite.css";
    	windmill.testWin().document.body.insertBefore(fbCSS, windmill.testWin().document.body.childNodes[0]);
  	
      var piScript = windmill.testWin().document.createElement('script');
      piScript.src = "/windmill-serv/js/lib/firebug/pi.js"
      var fbScript = windmill.testWin().document.createElement('script');
      fbScript.src = "/windmill-serv/js/lib/firebug/firebug-lite.js";
      windmill.testWin().document.body.insertBefore(piScript, windmill.testWin().document.body.childNodes[0]);
      windmill.testWin().document.body.insertBefore(fbScript, windmill.testWin().document.body.childNodes[0]);
      setTimeout('try { windmill.testWin().firebug.init();windmill.testWin().firebug.win.maximize(); } catch(err){} ', 1000);
    }
    else{
      windmill.testWin().firebug.init();
      windmill.testWin().firebug.win.maximize();
    }
  } catch(err){ windmill.err("Could not add firebug lite to the test app, as it wasn't available, try again."); }
}

var resetDD = function(){
  $('actionDD').selectedIndex = 0;
}

var toggleRec = function() {
    if ($('record').innerHTML.indexOf("Start") != -1) {
        windmill.ui.dx.domExplorerOff();
        windmill.ui.assertexplorer.assertExplorerOff();
        windmill.ui.recorder.recordOn();
        windmill.testWin().focus();
        $('record').innerHTML = 'Stop Recorder';
    }
    else {
        windmill.ui.recorder.recordOff();
        $('record').innerHTML = 'Start Recorder';
    }

}
var togglePlay = function() {
    if ($('playback').innerHTML.indexOf("Start") != -1) {
        windmill.stat("Playing IDE Actions...");
        windmill.continueLoop();
        windmill.ui.playback.sendPlayBack();
        $('playback').innerHTML = 'Stop Play All';
    }
    else {
        windmill.ui.playback.running = false;
        $('playback').innerHTML = 'Start Play All';
        windmill.xhr.clearQueue();
    }

}
var toggleLoop = function() {
    if ($('loopLink').innerHTML.indexOf('Pause') != -1) {
        $('loopLink').innerHTML = 'Resume Service Loop';
        windmill.pauseLoop();
    }
    else {
        $('loopLink').innerHTML = 'Pause Service Loop';
        windmill.continueLoop();
    }

}

var toggleExplore = function() {
    if ($('explorer').innerHTML.indexOf("Start") != -1) {
        //Turn off the recorder to avoid confusion
        if (windmill.ui.recorder.recordState == true) { toggleRec(); }
        $('domExp').style.visibility = 'visible';
        $('domExp').innerHTML = '';
        windmill.ui.dx.domExplorerOn();
        windmill.testWin().focus();
        $('explorer').innerHTML = 'Stop DOM Explorer';
    }
    else {
        $('domExp').style.visibility = 'hidden';
        windmill.ui.dx.domExplorerOff();
        $('explorer').innerHTML = 'Start DOM Explorer';
        $('domExp').innerHTML = '';
    }

}

var toggleAExplore = function() {
    if ($('assertx').innerHTML.indexOf("Start") != -1) {
        //Turn off the recorder to avoid confusion
        if (windmill.ui.recorder.recordState == true) { toggleRec(); }
        $('domExp').style.visibility = 'visible';
        $('domExp').innerHTML = '';
        windmill.ui.assertexplorer.assertExplorerOn();
        windmill.testWin().focus();
        $('assertx').innerHTML = 'Stop Assert Explorer';
    }
    else {
        $('domExp').style.visibility = 'hidden';
        windmill.ui.assertexplorer.assertExplorerOff();
        $('assertx').innerHTML = 'Start Assert Explorer';
        $('domExp').innerHTML = '';
    }

}

//Scrolling rules when using the IDE
//This is a pretty insane hack, description inline
var scroll = function() {
    //When someone scrolls we are assuming they no longer want it to jump to the bottom
    //So here I am turning the auto scrolling off
    //However if they scroll back to the bottom, we want to turn auto scroll on
    $('autoScroll').checked = false;

    var ide = $('ideForm');
    var a = ide.scrollTop;
    var b = ide.scrollHeight - ide.offsetHeight + 1;
    var c = a - b;

    //If this offset that I get from the above math is less than 4
    //Then they are back at the bottom and we turn auto scroll back on
    if (Math.abs(c) < 4) { $('autoScroll').checked = true; }
    //If not we keep auto scroll off
    else { $('autoScroll').checked = false; }
};

var doSubmit = function() {
    return false;
};

var dumpOutput = function(){
  for (var i = 0; i < windmill.errorArr.length; i++){
    windmill.out(windmill.errorArr[i]);
  }
  jQuery("#dialog").dialog('close');
  jQuery('#tabs').tabs("select", 1);
};

var $ = function(id) {
	return document.getElementById(id);
};

var copyObj = function(obj){
   var n = new Object;
   for (i in obj){
      n[i] = obj[i];
    }
  return n;
};

var PatternMatcher = function(pattern) {
    this.selectStrategy(pattern);
};
PatternMatcher.prototype = {

    selectStrategy: function(pattern) {
        this.pattern = pattern;
        var strategyName = 'glob';
        // by default
        if (/^([a-z-]+):(.*)/.test(pattern)) {
            var possibleNewStrategyName = RegExp.$1;
            var possibleNewPattern = RegExp.$2;
            if (PatternMatcher.strategies[possibleNewStrategyName]) {
                strategyName = possibleNewStrategyName;
                pattern = possibleNewPattern;
            }
        }
        var matchStrategy = PatternMatcher.strategies[strategyName];
        if (!matchStrategy) {
            throw new WindmillError("cannot find PatternMatcher.strategies." + strategyName);
        }
        this.strategy = matchStrategy;
        this.matcher = new matchStrategy(pattern);
    },

    matches: function(actual) {
        return this.matcher.matches(actual + '');
        // Note: appending an empty string avoids a Konqueror bug
    }

};

String.prototype.trim = function() {
    var result = this.replace(/^\s+/g, "");
    // strip leading
    return result.replace(/\s+$/g, "");
    // strip trailing
};
String.prototype.lcfirst = function() {
    return this.charAt(0).toLowerCase() + this.substr(1);
};
String.prototype.ucfirst = function() {
    return this.charAt(0).toUpperCase() + this.substr(1);
};
String.prototype.startsWith = function(str) {
    return this.indexOf(str) == 0;
};

/**
 * Convert all newlines to \m
 */
windmill.helpers.normalizeNewlines = function(text)
{
    return text.replace(/\r\n|\r/g, "\n");
}

/**
 * Replace multiple sequential spaces with a single space, and then convert &nbsp; to space.
 */
windmill.helpers.normalizeSpaces = function(text)
{
    // IE has already done this conversion, so doing it again will remove multiple nbsp
    if (browser.isIE)
    {
        return text;
    }

    // Replace multiple spaces with a single space
    // TODO - this shouldn't occur inside PRE elements
    text = text.replace(/\ +/g, " ");

    // Replace &nbsp; with a space
    var nbspPattern = new RegExp(String.fromCharCode(160), "g");
    if (browser.isSafari) {
	return windmill.helpers.replaceAll(text, String.fromCharCode(160), " ");
    } else {
	return text.replace(nbspPattern, " ");
    }
}

// windmill.helpers.replaceAll = function(text, oldText, newText) {
//     while (text.indexOf(oldText) != -1) {
//      text = text.replace(oldText, newText);
//     }
//     return text;
// }

windmill.helpers.replaceAll = function (OldString, FindString, ReplaceString) {
  var SearchIndex = 0;
  var NewString = ""; 
  while (OldString.indexOf(FindString,SearchIndex) != -1)    {
    NewString += OldString.substring(SearchIndex,OldString.indexOf(FindString,SearchIndex));
    NewString += ReplaceString;
    SearchIndex = (OldString.indexOf(FindString,SearchIndex) + FindString.length);         
  }
  NewString += OldString.substring(SearchIndex,OldString.length);
  return NewString;
}

/**
 * A "static" convenience method for easy matching
 */
PatternMatcher.matches = function(pattern, actual) {
    return new PatternMatcher(pattern).matches(actual);
};

PatternMatcher.strategies = {

/**
 * Exact matching, e.g. "exact:***"
 */
    exact: function(expected) {
        this.expected = expected;
        this.matches = function(actual) {
            return actual == this.expected;
        };
    },

/**
 * Match by regular expression, e.g. "regexp:^[0-9]+$"
 */
    regexp: function(regexpString) {
        this.regexp = new RegExp(regexpString);
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },

    regex: function(regexpString) {
        this.regexp = new RegExp(regexpString);
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },

/**
 * "globContains" (aka "wildmat") patterns, e.g. "glob:one,two,*",
 * but don't require a perfect match; instead succeed if actual
 * contains something that matches globString.
 * Making this distinction is motivated by a bug in IE6 which
 * leads to the browser hanging if we implement *TextPresent tests
 * by just matching against a regular expression beginning and
 * ending with ".*".  The globcontains strategy allows us to satisfy
 * the functional needs of the *TextPresent ops more efficiently
 * and so avoid running into this IE6 freeze.
 */
    globContains: function(globString) {
        this.regexp = new RegExp(PatternMatcher.regexpFromGlobContains(globString));
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },


/**
 * "glob" (aka "wildmat") patterns, e.g. "glob:one,two,*"
 */
    glob: function(globString) {
        this.regexp = new RegExp(PatternMatcher.regexpFromGlob(globString));
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    }

};

PatternMatcher.convertGlobMetaCharsToRegexpMetaChars = function(glob) {
    var re = glob;
    re = re.replace(/([.^$+(){}\[\]\\|])/g, "\\$1");
    re = re.replace(/\?/g, "(.|[\r\n])");
    re = re.replace(/\*/g, "(.|[\r\n])*");
    return re;
};

PatternMatcher.regexpFromGlobContains = function(globContains) {
    return PatternMatcher.convertGlobMetaCharsToRegexpMetaChars(globContains);
};

PatternMatcher.regexpFromGlob = function(glob) {
    return "^" + PatternMatcher.convertGlobMetaCharsToRegexpMetaChars(glob) + "$";
};

var Assert = {

    fail: function(message) {
        throw new AssertionFailedError(message);
    },

/*
* Assert.equals(comment?, expected, actual)
*/
    equals: function() {
        var args = new AssertionArguments(arguments);
        if (args.expected === args.actual) {
            return;
        }
        Assert.fail(args.comment +
                    "Expected '" + args.expected +
                    "' but was '" + args.actual + "'");
    },

/*
* Assert.matches(comment?, pattern, actual)
*/
    matches: function() {
        var args = new AssertionArguments(arguments);
        if (PatternMatcher.matches(args.expected, args.actual)) {
            return;
        }
        Assert.fail(args.comment +
                    "Actual value '" + args.actual +
                    "' did not match '" + args.expected + "'");
    },

/*
* Assert.notMtches(comment?, pattern, actual)
*/
    notMatches: function() {
        var args = new AssertionArguments(arguments);
        if (!PatternMatcher.matches(args.expected, args.actual)) {
            return;
        }
        Assert.fail(args.comment +
                    "Actual value '" + args.actual +
                    "' did match '" + args.expected + "'");
    }

};

// Preprocess the arguments to allow for an optional comment.
function AssertionArguments(args) {
    if (args.length == 2) {
        this.comment = "";
        this.expected = args[0];
        this.actual = args[1];
    } else {
        this.comment = args[0] + "; ";
        this.expected = args[1];
        this.actual = args[2];
    }
}

function AssertionFailedError(message) {
    this.isAssertionFailedError = true;
    //this.isWindmillError = true;
    this.message = message;
    this.failureMessage = message;
}

//JSUtils
var parseString = function(str, s){
  var arr = str.split('.');
  var win = windmill.testWin();
  if (s){ win = s;}
      
  var parseRecurse = function (n) {
    p = !n ? win : p[n];
    return arr.length ? parseRecurse(arr.shift()) : p;
  };
  return parseRecurse();
};

function removeHTMLTags(str){
 	 	str = str.replace(/&(lt|gt);/g, function (strMatch, p1){
 		 	return (p1 == "lt")? "<" : ">";
 		});
 		var strTagStrippedText = str.replace(/<\/?[^>]+(>|$)/g, "");
 		strTagStrippedText = strTagStrippedText.replace(/&nbsp;/g,"");
	return strTagStrippedText;
};

var getParentWindow = function(node){
  var ownerDoc = node.ownerDocument;
  var win = null;
  if (ownerDoc.defaultView){
    win = ownerDoc.defaultView;
  }
  else {
    win = ownerDoc.parentWindow;
  }
  if (win == null){
    win = windmill.testWin();
  }
  
  return win;
};
