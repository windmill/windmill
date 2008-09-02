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

//json_call
var json_call = function(version, method, params) {
    this.version = version || null;
    this.method = method || null;
    this.params = params || [];
};

var busyOn = function(){
  $('actionDD').style.visibility = "hidden";
  $('loadRemote').style.display = "block";
  $('cover').style.display = "block";
}
var busyOff = function(){
  $('actionDD').style.visibility = "visible";
  $('loadRemote').style.display = "none";
  $('cover').style.display = "none";
}

var closeDialog = function(id) {
    $('actionDD').style.visibility = "visible";
    $(id).style.display = 'none';
    $('gray').style.visibility = 'hidden';
    $('ide').style.display = 'block';
};
var openDialog = function(id) {
    //Turn off explorers and recorder
    windmill.ui.recorder.recordOff();
    windmill.ui.domexplorer.domExplorerOff();
    windmill.ui.assertexplorer.assertExplorerOff();

    $(id).style.display = 'block';
    $('gray').style.visibility = 'visible';
    $('ide').style.display = 'none';
    $('actionDD').style.visibility = "hidden";
};

var openFirebug = function(){
  firebug.init();
  firebug.win.minimize();
  //if firebug has already been injected into the app
  if (!opener.firebug){
    var piScript = opener.document.createElement('script');
    piScript.src = "windmill-serv/js/lib/pi.js"
    var fbScript = opener.document.createElement('script');
    fbScript.src = "windmill-serv/js/lib/firebug-lite.js";
    opener.document.body.insertBefore(piScript, opener.document.body.childNodes[0]);
    opener.document.body.insertBefore(fbScript, opener.document.body.childNodes[0]);
    setTimeout('opener.firebug.init();opener.firebug.win.maximize()', 1000);
  }
  else{
    opener.firebug.init();
    opener.firebug.win.maximize();
  }
}

var resetDD = function(){
  $('actionDD').selectedIndex = 0;
}

var toggleRec = function() {
    if ($('record').src.indexOf("img/record.png") != -1) {
        windmill.ui.domexplorer.domExplorerOff();
        windmill.ui.assertexplorer.assertExplorerOff();
        windmill.ui.recorder.recordOn();
        opener.window.focus();
        $('record').src = 'img/stoprecord.png';
    }
    else {
        windmill.ui.recorder.recordOff();
        $('record').src = 'img/record.png';
    }

}
var togglePlay = function() {
    if ($('playback').src.indexOf("img/playback.png") != -1) {
        windmill.ui.results.writeStatus("Playing IDE Actions...");
        windmill.controller.continueLoop();
        windmill.ui.playback.sendPlayBack();
        $('playback').src = 'img/playbackstop.png';

    }
    else {
        windmill.ui.playback.running = false;
        $('playback').src = 'img/playback.png';
        windmill.xhr.clearQueue();
    }

}
var toggleLoop = function() {
    if ($('loopLink').innerHTML.indexOf('Pause') != -1) {
        $('loopLink').innerHTML = 'Resume Loop';
        windmill.controller.stopLoop();
    }
    else {
        $('loopLink').innerHTML = 'Pause Loop';
        windmill.controller.continueLoop();
    }

}

var toggleExplore = function() {
    if ($('explorer').src.indexOf("img/xon.png") != -1) {
        //Turn off the recorder to avoid confusion
        if (windmill.ui.recorder.recordState == true) { toggleRec(); }
        $('domExp').style.visibility = 'visible';
        $('domExp').innerHTML = '';
        windmill.ui.domexplorer.domExplorerOn();
        opener.window.focus();
        $('explorer').src = 'img/xoff.png';
    }
    else {
        $('domExp').style.visibility = 'hidden';
        windmill.ui.domexplorer.domExplorerOff();
        $('explorer').src = 'img/xon.png';
        $('domExp').innerHTML = '';
    }

}

var toggleAExplore = function() {
    if ($('assertx').src.indexOf("img/axon.png") != -1) {
        //Turn off the recorder to avoid confusion
        if (windmill.ui.recorder.recordState == true) { toggleRec(); }
        $('domExp').style.visibility = 'visible';
        $('domExp').innerHTML = '';
        windmill.ui.assertexplorer.assertExplorerOn();
        opener.window.focus();
        $('assertx').src = 'img/axoff.png';
    }
    else {
        $('domExp').style.visibility = 'hidden';
        windmill.ui.assertexplorer.assertExplorerOff();
        $('assertx').src = 'img/axon.png';
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

    var ide = $('ide');
    var a = ide.scrollTop;
    var b = ide.scrollHeight - ide.offsetHeight + 1;
    var c = a - b;

    //If this offset that I get from the above math is less than 4
    //Then they are back at the bottom and we turn auto scroll back on
    if (Math.abs(c) < 4) { $('autoScroll').checked = true; }
    //If not we keep auto scroll off
    else { $('autoScroll').checked = false; }
}

var doSubmit = function() {
    return false;
}


var $ = function(id) {
		  return document.getElementById(id);
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

windmill.helpers.replaceAll = function(text, oldText, newText) {
    while (text.indexOf(oldText) != -1) {
	text = text.replace(oldText, newText);
    }
    return text;
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
  var win = windmill.testWindow;
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
}
