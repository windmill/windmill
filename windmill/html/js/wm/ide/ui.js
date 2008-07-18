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

//Functionality that works for every browser
//Mozilla specific functionality abstracted to mozcontroller.js
//Safari specific functionality abstracted to safcontroller.js
//IE specific functionality abstracted to iecontroller.js
//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.

windmill.ui = new function() {
    var _this = this;
    //Needed to keep track of the old border for the dom explorer
    //keeping track of the recorder state when a new page is loaded and wipes the document
    this.recordSuiteNum = 0;

    //Setter, incremeneting the recordSuiteNum
    this.incRecSuite = function() {
        this.recordSuiteNum++;
    }

    this.toggleCollapse = function(id) {
        if ($(id).style.height == '18px') {
            $(id).style.height = '';
        }
        else {
            $(id).style.height = '18px';
        }
    };

    //Allowing the stopOnFailure switch to be controlled from the UI
    this.toggleBreak = function() {
        var breakCheckBox = $('toggleBreak');
        if (breakCheckBox.checked) {
            windmill.stopOnFailure = true;
        }
        else {
            windmill.stopOnFailure = false;
        }
    }
    this.getContMethodsUI = function() {
        var str = '';
        for (var i in windmill.controller) {
            if (i.indexOf('_') == -1) {
                str += "," + i;
            }
        }
        for (var i in windmill.controller.extensions) {
            if (str) {
                str += ','
            }
            str += 'extensions.' + i;
        }
        for (var i in windmill.controller.commands) {
            if (str) {
                str += ','
            }
            str += 'commands.' + i;
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
        return ca;
    }
};

//Playback Functionality
//*********************************
windmill.ui.playback = new function() {

  //Keep track of the status of the playback
  this.running = false;
  this.resetPlayBack = function() {
    if (($('runningStatus').innerHTML.indexOf('Waiting for tests...') != -1) && 
      ($('playback').src.indexOf("img/playbackstop.png") != -1) && windmill.ui.playback.running) {
        
      $('playback').src = 'img/playback.png';
      windmill.ui.playback.running = false;
    }
  };
  
  this.setPlaying = function() {
    $('playback').src = 'img/playbackstop.png';
    windmill.ui.playback.running = true;
  };

  //Send the tests to be played back
  this.sendPlayBack = function(uuid, suiteOnly) {
      //Turn off explorers and recorder
      windmill.ui.recorder.recordOff();
      windmill.ui.domexplorer.domExplorerOff();
      windmill.ui.assertexplorer.assertExplorerOff();

      var appending = false;
      var testArray = [];

      //if they just passed a suite
      if (!uuid || uuid == null) { appending = true; }
      //if we don't pass an action to start at just play them all
      //if (!uuid && !suiteOnly) { appending = true; }
      
      //if we want to play them all in a provided suite
      if (!uuid && suiteOnly) {
        appending = true;
        var suites = new Array();
        suites.push('\n   ');
        suites.push($(suiteOnly));
        $(suiteOnly).style.border = "1px solid black";
      }

      //else play every suite in the IDE
      else { var suites = $('ideForm').childNodes; }

      //default the nodeType to 1 (firefox)
      var s = 1;
      //In IE we start our iteration at 0, else 1 for the first suite
      try {
        if (suites[0].nodeType == 1) { var s = 0; }
      }catch(err){ return;}

      //Iterate through the entire IDE starting playback
      for (var i = s; i < suites.length; i++) {
          if (suites[i].hasChildNodes()) {
              for (var j = 1; j < suites[i].childNodes.length; j++) {
                  //if we hit the suite id, turn on appending
                  if (suites[i].childNodes[j].id == uuid) {
                      appending = true;
                  }
                  //if the playback starts at a specific action, check if we hit that point
                  if (appending == true) {
                      var actionObj = {};
                      actionObj.suite_name = suites[i].id;
                      actionObj.version = "0.1";

                      //If it wasn't a standard UI element
                      if ($(suites[i].childNodes[j].id + 'params') != null) {
                          actionObj.method = $(suites[i].childNodes[j].id + 'method').value;
                          actionObj.params = eval('(' + $(suites[i].childNodes[j].id + 'params').value + ')');

                      }
                      //if its a standard UI element build the params
                      else {
                          var si = $(suites[i].childNodes[j].id + 'method').selectedIndex;
                          actionObj.method = $(suites[i].childNodes[j].id + 'method')[si].value;

                          var paramsObj = {};
                          paramsObj.uuid = suites[i].childNodes[j].id;

                          if (windmill.registry.methods[actionObj.method].locator) {
                              var si = $(suites[i].childNodes[j].id + 'locatorType').selectedIndex;
                              paramsObj[$(suites[i].childNodes[j].id + 'locatorType')[si].value] = $(suites[i].childNodes[j].id + 'locator').value;

                          }
                          if (windmill.registry.methods[actionObj.method].option) {
                              var si = $(suites[i].childNodes[j].id + 'optionType').selectedIndex;
                              paramsObj[$(suites[i].childNodes[j].id + 'optionType')[si].value] = $(suites[i].childNodes[j].id + 'option').value;
                          }

                          actionObj.params = paramsObj;
                      }

                      $(suites[i].childNodes[j].id).style.background = 'lightyellow';
                      testArray.push(actionObj);
                  }

                  //if they don't want the play button for each action to cascade
                  //Just play that particular action, unless the big play button was hit
                  if (($('playCascade').checked == false) && (uuid != undefined) && (uuid != null)) {
                      appending = false;
                  }
              }
          }
      }

      windmill.ui.recorder.recordOff();

      var respRun = function(str) {
          //setTimeout('$(\'playback\').src = \'img/playback.png\'', 3000);
          windmill.ui.playback.running = true;

          //If one of the action playback buttons is clicked
          //and the action playback cascading is enabled
          //we need the user to be able to stop the playback while it's
          //cascading, so I check if thats the state and set change the image accordingly
          if ($('playCascade').checked) {
              $('playback').src = "img/playbackstop.png";

          }
          return true;

      }

      var json_object = new json_call('1.1', 'restart_test_run');
      var params_obj = {};
      params_obj.tests = testArray;
      json_object.params = params_obj;
      var json_string = fleegix.json.serialize(json_object)

      doCall = function() {
          var z = fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', json_string);

      }

      setTimeout('doCall()', 100);

  }

};

//Recorder Functionality
//*********************************/
windmill.ui.recorder = new function() {
    var recordState = false;
    var lastLocValue = null;
    var lastLocator = null;
    
    this.setRecState = function() {
        if (this.recordState == true) {
            this.recordOn();
        }
    }
    //write json to the remote from the click events
    this.writeJsonClicks = function(e) {
        if (this.recordState == false) { return; }
        
        var locator = '';
        var locValue = '';

        if ($('useXpath').checked == false) {
            if (e.target.id != "") {
                locator = 'id';
                locValue = e.target.id;
            }
            else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")) {
                locator = 'name';
                locValue = e.target.name;
            }
            else if (e.target.tagName.toUpperCase() == "A") {
                locator = 'link';
                locValue = e.target.innerHTML.replace(/(<([^>]+)>)/ig, "");
                //locValue = locValue.replace(/^s*(.*?)s*$/, "$1");
                locValue = locValue.replace(/^[\s(&nbsp;)]+/g,'').replace(/[\s(&nbsp;)]+$/g,'');
            }
            else {
                var stringXpath = getXSPath(e.target);
                locator = 'xpath';
                locValue = stringXpath;
            }
        }
        else {
            var stringXpath = getXSPath(e.target);
            locator = 'xpath';
            locValue = stringXpath;
        }
        
        //to keep from generating multiple actions for the same click
        if ((this.lastLocValue == locValue) && (this.lastLocator == locator) && (e.type != 'dblclick')){ return; }
        this.lastLocValue = locValue;
        this.lastLocator = locator;
        
        //allowing the user to click the same link again after 1 second
        //should emulate expected behavior
        windmill.ui.recorder.resetLoc = function(){
          windmill.ui.recorder.lastLocValue = null;
          windmill.ui.recorder.lastLocator = null;
        }
        setTimeout('windmill.ui.recorder.resetLoc()', 1000);
        
        if (locValue != "") {
            var params = {};
            params[locator] = locValue;

            if (e.type == 'dblclick') {
                windmill.ui.remote.addAction(windmill.ui.remote.buildAction('doubleClick', params));
            }
            else {
                if ($("clickOn").checked == true) {
                    windmill.ui.remote.addAction(windmill.ui.remote.buildAction('click', params));
                }
                else if ((e.target.onclick != null) || (locator == 'link') || (e.target.tagName.toUpperCase() == 'IMG')) {
                    windmill.ui.remote.addAction(windmill.ui.remote.buildAction('click', params));
                }
            }
        }
        windmill.ui.remote.scrollRecorderTextArea();

    }

    //Writing json to the remote for the change events
    this.writeJsonChange = function(e) {
        if (this.recordState == false) {
            return;
        }
        var locator = '';
        var locValue = '';

        if ($('useXpath').checked == false) {
            if (e.target.id != "") {
                locator = 'id';
                locValue = e.target.id;
            }
            else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")) {
                locator = 'name';
                locValue = e.target.name;
            }
            else {
                var stringXpath = getXSPath(e.target);
                locator = 'xpath';
                locValue = stringXpath;
            }
        }
        else {
            var stringXpath = getXSPath(e.target);
            locator = 'xpath';
            locValue = stringXpath;
        }

        var params = {};
        params[locator] = locValue;

        if (e.target.type == 'textarea') {
            params['text'] = e.target.value;
            windmill.ui.remote.addAction(windmill.ui.remote.buildAction('type', params));


        }
        else if (e.target.type == 'text') {
            params['text'] = e.target.value;
            windmill.ui.remote.addAction(windmill.ui.remote.buildAction('type', params));

        }
        else if (e.target.type == 'password') {
            params['text'] = e.target.value;
            windmill.ui.remote.addAction(windmill.ui.remote.buildAction('type', params));

        }
        else if (e.target.type == 'select-one') {
            //we do playback based on the text, not the value
            //params['option'] = e.target.value;
            params['option'] = e.target.options[e.target.selectedIndex].text;
            windmill.ui.remote.addAction(windmill.ui.remote.buildAction('select', params));

        }
        else if (e.target.type == 'radio') {
            windmill.ui.remote.addAction(windmill.ui.remote.buildAction('radio', params));
        }
        //The check function is only around now for reverse compatibilty, click does the
        //correct thing now in all browsers after the update to safari
        /* else if(e.target.type == "checkbox"){
      windmill.ui.remote.addAction(windmill.ui.remote.buildAction('check', params));    
    }
  */
        windmill.ui.remote.scrollRecorderTextArea();
    }

    //Turn on the recorder
    //Since the click event does things like firing twice when a double click goes also
    //and can be obnoxious im enabling it to be turned off and on with a toggle check box
    this.recordOn = function() {
        //Turn off the listeners so that we don't have multiple attached listeners for the same event
        this.recordOff();
        //keep track of the recorder state, for page refreshes
        this.recordState = true;
        $('record').src = 'img/stoprecord.png';

        //if when loading the listener didn't get attached
        //we attach it if they are recording because we need to know
        //when the new page is loading so we can re-attach
        fleegix.event.unlisten(windmill.testWindow, 'onunload', windmill, 'unloaded');
        fleegix.event.listen(windmill.testWindow, 'onunload', windmill, 'unloaded');
	
        windmill.ui.remote.getSuite();
        try { this.recRecursiveBind(windmill.testWindow); }
        catch(error) {
            windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
            $('record').src = 'img/record.png';
            this.recordState = false;
        }
    }

    this.recordOff = function() {
        this.recordState = false;
        $('record').src = 'img/record.png';

        try {
            this.recRecursiveUnBind(windmill.testWindow);
        }
        catch(error) {
            windmill.ui.results.writeResult('You must not have set your URL correctly when launching Windmill,' + 
            'we are getting cross domain exceptions.' + error);

        }

    }

    //Recursively bind to all the iframes and frames within
    this.recRecursiveBind = function(frame) {
        //Make sure we haven't already bound anything to this frame yet
        this.recRecursiveUnBind(frame);
      
        //IE's onChange support doesn't bubble so we have to manually
        //Attach a listener to every select and input in the app
        if (windmill.browser.isIE) {
            var inp = frame.document.getElementsByTagName('input');
            for (var i = 0; i < inp.length; i++) {
                fleegix.event.listen(inp[i], 'onchange', this, 'writeJsonChange');

            }
            var se = frame.document.getElementsByTagName('select');
            for (var i = 0; i < se.length; i++) {
                fleegix.event.listen(se[i], 'onchange', this, 'writeJsonChange');
            }
        }
        else{
            //turns out there are cases where people are canceling click on purpose
            //so I am manually going to attach click listeners to all links
            var links = frame.document.getElementsByTagName('a');
            for (var i = 0; i < links.length; i++) {
                fleegix.event.listen(links[i], 'onclick', this, 'writeJsonClicks');
                for (var z=0; z < links[i].childNodes.length; z++){
                  fleegix.event.listen(links[i].childNodes[z], 'onclick', this, 'writeJsonClicks');
                }
            }
        }

        fleegix.event.listen(frame, 'onunload', windmill, 'unloaded');
        fleegix.event.listen(frame.document, 'ondblclick', this, 'writeJsonClicks');
        fleegix.event.listen(frame.document, 'onchange', this, 'writeJsonChange');
        fleegix.event.listen(frame.document, 'onclick', this, 'writeJsonClicks');

        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
                fleegix.event.listen(iframeArray[i], 'onunload', windmill, 'unloaded');
                fleegix.event.listen(iframeArray[i].document, 'ondblclick', this, 'writeJsonClicks');
                fleegix.event.listen(iframeArray[i].document, 'onchange', this, 'writeJsonChange');
                fleegix.event.listen(iframeArray[i].document, 'onclick', this, 'writeJsonClicks');

                this.recRecursiveBind(iframeArray[i]);

            }
            catch(error) {
                windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                'Binding to all others.' + error);

            }

        }

    }

    //Recursively bind to all the iframes and frames within
    this.recRecursiveUnBind = function(frame) {
      
      var links = frame.document.getElementsByTagName('a');
       for (var i = 0; i < links.length; i++) {
           fleegix.event.unlisten(links[i], 'onclick', this, 'writeJsonClicks');
           for (var z=0; z < links[i].childNodes.length; z++){
             fleegix.event.unlisten(links[i].childNodes[z], 'onclick', this, 'writeJsonClicks');
           }
       }
        //IE's onChange support doesn't bubble so we have to manually
        //Attach a listener to every select and input in the app
        if (windmill.browser.isIE) {
            var inp = frame.document.getElementsByTagName('input');
            for (var i = 0; i < inp.length; i++) {
                fleegix.event.unlisten(inp[i], 'onchange', this, 'writeJsonChange');
            }
            var se = frame.document.getElementsByTagName('select');
            for (var i = 0; i < se.length; i++) {
                fleegix.event.unlisten(se[i], 'onchange', this, 'writeJsonChange');
            }
        }
        fleegix.event.unlisten(frame, 'onunload', windmill, 'unloaded');
        fleegix.event.unlisten(frame.document, 'ondblclick', this, 'writeJsonClicks');
        fleegix.event.unlisten(frame.document, 'onchange', this, 'writeJsonChange');
        fleegix.event.unlisten(frame.document, 'onclick', this, 'writeJsonClicks');

        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++)
        {
            try {
                fleegix.event.unlisten(iframeArray[i], 'onunload', windmill, 'unloaded');
                fleegix.event.unlisten(iframeArray[i].document, 'ondblclick', this, 'writeJsonClicks');
                fleegix.event.unlisten(iframeArray[i].document, 'onchange', this, 'writeJsonChange');
                fleegix.event.unlisten(iframeArray[i].document, 'onclick', this, 'writeJsonClicks');

                this.recRecursiveUnBind(iframeArray[i]);

            }
            catch(error) {
                windmill.ui.results.writeResult('There was a problem binding to one of your iframes, is it cross domain?' + 
                'Binding to all others.' + error);

            }

        }

    }

};