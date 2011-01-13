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

var windmill = new function() {
	//More namespacing
	this.helpers = {};

	//The timeout for page loading, if the onload is never called
	//how long do we wait before we start firing tests again
	this.timeout = 10000;

	//How long xhr waits in seconds before calling the timout function
	this.xhrTimeout = 180;

	this.serviceDelay = 0;
	this.serviceDelayRunning = 0;
	this.serviceDelayDefer = 0;

	this.safeWaits = true;

	//Enable windmill popup support
	this.popups = true;
	//Overwrite alerts functionality
	this.alerts = true;
	//storage array for alert strings
	this.alertStore = [];

	//overwrite the confirms
	this.confirms = true;
	//what to answer by default
	this.confirmAnswer = true;
	//storage array for confirm strings
	this.confirmStore = [];

	//overwrite the confirms
	this.prompts = true;
	//what to answer by default
	this.promptAnswer = "Windmill is great!";
	//storage array for confirm strings
	this.promptStore = [];

	//Whether or not the IDE is in a waiting state
	//Is set to true when we run into any waits.*
	this.waiting = false;
	this.chatty = true;

	//The timeout ID of whatever is keeping
	//us from continuing the tests runs, if it reaches
	//windmill.timeout we stop the timeout and continue on
	this.loadTimeoutId = 0;

	//We need to allow users to store data locally
	//So we are using the fleegix hash data structure
	this.varRegistry = new fleegix.hash.Hash();

	//The app your testing
	this.testWindow = opener;
	this.initialHost = '';

	this.openWindow;
	this.popup = null;

	this.locationObj = null;
	//Keep track of windows the page opened with pointers
	this.windowReg = [];

	//This is so that if you are doing multiple frame testing
	//And you have to change testingApp to point at various frames
	//You can still keep track of the base window
	this.baseTestWindow = opener;
	this.remoteLoaded = false;
	this.remote = parent.window;
	this.browser = null;

	this.scriptAppendOnly = false;

	//results storage if IDE isn't ready
	this.errorArr = [];
	this.out = function(s) {
		if (typeof(windmill.results) == "undefined") {
			windmill.errorArr.push(s);
		} else {
			windmill.ui.results.writeResult(s);
		}
	};

	//Directly write errors to the errorArr
	this.err = function(s) {
		windmill.errorArr.push(s);
	};

	//we need to defined a function that returns the test window
	//because in IE if the document.domain has been altered
	//the only way to access the document is via opener
	//this way the popup support is only broken in this IE case
	this.testWin = function() {

		//if we were pointing at a popup
		if (windmill.popup != null) {
			if (windmill.popup.document != null) {
				windmill.testWindow = windmill.popup;
				return windmill.testWindow;
			}
		}

		//grab the next window in line
		for (var i = 0; i < windmill.windowReg.length; i++) {
			try {
				var wDoc = windmill.windowReg[i].document;
				//found another window
				if (wDoc != null) {
					windmill.testWindow = windmill.windowReg[i];
				}
				return windmill.testWindow;
			} catch(err) {}
		}

		try {
			var doc = windmill.testWindow.document;
			if (doc == null) {
				throw "err";
			}
			return windmill.testWindow;
		} catch(err) {
			windmill.err('Either the popup window was destroyed, or you are in IE with a changed document.domain.');
			windmill.err('Defaulting to the opener as target window...');
			try {
				var d = opener.document;
				windmill.testWindow = opener;
				return opener;
			} catch(err) {
				windmill.testWindow = windmill.baseTestWindow;
				return windmill.baseTestWindow;
			}
		}
	};

	this.init = function(b) {
		this.browser = b;
	};

	this.setupMenu = function() {
		var dispatchDD = function(e) {
			var sel = e.target.id;
			switch (sel) {
			case 'addSuite':
				jQuery('#tabs').tabs("select", 0);
				windmill.ui.incRecSuite();
				windmill.ui.remote.getSuite(null, true);
				break;
			case 'addAction':
				jQuery('#tabs').tabs("select", 0);
				windmill.ui.remote.addAction();
				break;
			case 'clearIDE':
				jQuery('#tabs').tabs("select", 0);
				windmill.ui.remote.clearIDE();
				break;
			default:
				resetDD();
				break;
			}
			resetDD();
		};

		fleegix.event.listen($('actionDD'), 'onclick', dispatchDD);
	};

	this.setEnv = function() {
		jQuery("#loadMessage").html("Setting document.domain environment...");
		incProgressBar();

		var arr = window.location.hostname.split('.');
		if (arr.length > 2) {
			arr.shift();
			windmill.docDomain = arr.join('.');
		} else {
			windmill.docDomain = window.location.hostname;
		}

		try {
			var v = windmill.testWin().document.domain;
		} catch(err) {
			try {
				document.domain = windmill.docDomain;
			} catch(err) {
				if (arr.length > 2) {
					arr.shift();
					document.domain = arr.join('.');
				} else {
					document.domain = windmill.docDomain;
				}
			}
			try {
				var v = windmill.testWin().document.domain;
			} catch(err) {
				if (arr.length > 2) {
					arr.shift();
					document.domain = arr.join('.');
				} else {
					windmill.err('Our failover logic cant sync up with your apps document.domain.');
				}
			}
		}
		try {
			windmill.testWin().windmill = windmill;
			windmill.initialHost = windmill.testWin().location.href;
		} catch(err) {}

		try {
			var wdwTitle = windmill.testWin().document.title;
		} catch(err) {
			if (window.location.href.indexOf('www.') == -1) {
				alert('This application loads and immediately redirects to the www. version of itself, trying to correct the domain.');
				window.location.href = 'http://www.' + window.location.hostname + "/windmill-serv/remote.html";
			}
		}
	};

	this.start = function() {
		jQuery("#loadMessage").html("Setting URL and Building Asserts..");
		incProgressBar();

		//this should be getting called by start.html
		//windmill.service.setStartURL();
		windmill.service.buildNotAsserts();
		jQuery("#loadMessage").html("Building UI..");
		incProgressBar();

		this.setupMenu();
		//this.setEnv();
		this.remoteLoaded = true;

		jQuery("#loadMessage").html("Starting Windmill Communication Loop...");
		incProgressBar();

		windmill.continueLoop();
		busyOff();
	};

	this.attachUnload = function(w) {
		if (!windmill.browser.isIE) {
			fleegix.event.unlisten(windmill.testWin(), 'onbeforeunload', windmill, 'unloaded');
			fleegix.event.listen(windmill.testWin(), 'onbeforeunload', windmill, 'unloaded');
		} 
		else {
		  //Safely attach onbeforeunloads for IE, was a major bug
		  //spurred permission denied errors
			w.detachEvent("onunload", windmill.unloaded);
			w.attachEvent("onunload", windmill.unloaded);
		}
	};

	//When the page is unloaded turn off the loop until it loads the new one
	this.unloaded = function() {
		try {
			windmill.pauseLoop();

			// if we're currently running JS tests, we need to know the
			// test window has gone bye-bye, and we need to wait to
			// re-inject the test code when it comes back
			var jsTest = windmill.jsTest;
			var waitForIt = jsTest.setTestCodeState(jsTest.testCodeStates.CANNOT_LOAD);

			//if we are recording, we just detected a new page load, but only add one.
			//Opera and IE appear to be calling unload multiple times
			if (windmill.ui.recorder.recordState) {
				busyOn();
				var suiteActions = windmill.ui.remote.getSuite().childNodes;
				var lastNode = suiteActions[suiteActions.length - 1];
				var method = null;
				try {
					method = $(lastNode.id + 'method').value;
				} catch(err) {}
				if (method != "waits.forPageLoad") {
					var wfpl = windmill.ui.remote.buildAction("waits.forPageLoad", {
						timeout: 20000
					});
					windmill.ui.remote.addAction(wfpl);
				}
			}
		} catch(err) {}

		checkPage = function() {
			windmill.controller.waits.forPageLoad({});
		}
		setTimeout('checkPage()', 1000);
	};

	//try binding unload stuff to each of the windows and iframes
	this.rUnLoadBind = function(w) {
		if (w != windmill.testWin()) {
			windmill.attachUnload(w);
			w.windmill = windmill;
		}

		var fc = w.frames.length;
		var fa = w.frames;

		for (var i = 0; i < fc; i++) {
			try {
				this.rUnLoadBind(fa[i]);
			} catch(error) {}
		}
	};

	this.overWrite = function() {
		//Overwrite alerts to keep the browser from getting stuck
		//on by default      
		if (windmill.alerts) {
			//Sometimes we can't access it yet
			try {
				windmill.testWin().oldAlert = windmill.testWin().alert;
			} catch(err) {
				windmill.err(err);
			}
			windmill.controller.reWriteAlert();
		}
		//re-write the confirm dialogs
		if (windmill.confirms) {
			//Sometimes we can't access it yet
			try {
				windmill.testWin().oldConfirm = windmill.testWin().confirm;
			} catch(err) {
				windmill.err(err);
			}
			windmill.controller.reWriteConfirm();
		}
		//re-write the confirm dialogs
		if (windmill.prompts) {
			//Sometimes we can't access it yet
			try {
				windmill.testWin().oldPrompt = windmill.testWin().prompt;
			} catch(err) {
				windmill.err(err);
			}
			windmill.controller.reWritePrompt();
		}
		//if popup support is enabled
		if (windmill.popups) {
			try {
				windmill.controller.reWritePopups();
			} catch(err) {
				windmill.err(err);
			}
		}
	};

	//On load setup all the listener stuff
	//Set the listener on the testingApp on unload
	this.loaded = function() {

		//When the waits happen I set a timeout
		//to ensure that if it takes longer than the
		//windmill default timeout to load
		//we start running tests.. failover incase something
		//breaks, but we don't want this same code to get
		//called twice, so I clear it here
		if (windmill.loadTimeoutId != 0) {
			clearTimeout(windmill.loadTimeoutId);
		}

		//If the doc domain has changed
		//and we can't get to it, try updating it
		try {
			var v = windmill.testWin().document.domain;
		} catch(err) {
			windmill.err(err);
		}

		//We need to define the windmill object in the
		//test window to allow the JS test framework
		//to access different functionality
		try {
			windmill.attachUnload(windmill.testWin());
			windmill.testWin().windmill = windmill;
		} catch(err) {
			try {
				setTimeout('windmill.loaded()', 500);
				return;
			} catch(err) {
				windmill.err("Loaded method was unable to bind listeners, <br>Error: " + err);
			}
		}
		windmill.rUnLoadBind(windmill.testWin());

		//Reset the explorer and recorder to what
		//they were before the new page load
		windmill.ui.dx.setExploreState();
		windmill.ui.recorder.setRecState();
		busyOff();
		// if we're currently running JS tests, we need to know the
		// test window reloaded so we can re-inject all the test code
		// into test window scope
		var jsTest = windmill.jsTest;
		var waitForIt = jsTest.setTestCodeState(jsTest.testCodeStates.NOT_LOADED);

		if (windmill.waiting == false) {
			windmill.overWrite();
			windmill.continueLoop();
		}
	};

	//After a page is done loading, continue the loop
	this.continueLoop = function() {
		cont = function() {
			//If the doc domain has changed
			//and we can't get to it, try updating it
			try {
				var v = windmill.testWin().document.domain;
			} catch(err) {
				document.domain = windmill.docDomain;
			}

			$('loopLink').innerHTML = 'Pause Service Loop';
			if (windmill.xhr.loopState == false) {
				windmill.xhr.loopState = true;
				windmill.xhr.getNext();
			}
		}
		//Just making sure the page is fully loaded
		setTimeout("cont()", 1);
		//Resume JS tests
		windmill.jsTest.resumeTests();
	};

	this.pauseLoop = function() {
		windmill.xhr.loopState = false;
		//Pause JS tests
		windmill.jsTest.pauseTests();
	};

	//windmill Options to be set
	this.stopOnFailure = false;
	this.runTests = true;
	this.rwAlert = false;
};

//Set the browser
windmill.init(browser);
//Setup a convenience variable
var _w = windmill.testWin();
fleegix.xhr.defaultTimeoutSeconds = windmill.xhrTimeout;
fleegix.event.compatibilityMode = true;
