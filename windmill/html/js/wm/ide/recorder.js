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

if (typeof windmill.ui == 'undefined') { windmill.ui = {}; }

//Recorder Functionality
//*********************************/
windmill.ui.recorder = new function() {
    this.recordState = false;
    var lastLocValue = null;
    var lastLocator = null;
    this.lastSWF = null;
    
    this.setRecState = function() {
      if (windmill.ui.recorder.recordState == true) {
        this.recordOn();
      }
    };
    
    this.analyzeNode = function(e){
       var locator = '';
        var locValue = '';
        try {
          if ($('useXpath').checked == false) {
              if (e.target.id != "") {
                  var element = elementslib.Element.ID(e.target.id);
                  if (element == e.target){
                    locator = 'id';
                    locValue = e.target.id;
                  }
              }
              else if ((typeof(e.target.name) != "undefined") && (e.target.name != "")) {
                  var element = elementslib.Element.NAME(e.target.name);
                  if (element == e.target){
                    locator = 'name';
                    locValue = e.target.name;
                  }
              }
              else if ((typeof(e.target.value) != "undefined") && (e.target.value != "")) {
                  var element = elementslib.Element.VALUE(e.target.value);
                  if (element == e.target){
                    locator = 'value';
                    locValue = e.target.value;
                  }
              }
              else if ((e.target.tagName.toUpperCase() == "A") || (e.target.parentNode.tagName.toUpperCase() == "A")) {
                  var element = elementslib.Element.LINK(removeHTMLTags(e.target.innerHTML));
                  if (element == e.target){
                    locator = 'link';
                    locValue = removeHTMLTags(e.target.innerHTML);
                  }
              }
              if (locator == ''){
                  var stringXpath = getXSPath(e.target);
                  var element = elementslib.Element.XPATH(stringXpath);
                  
                  if (element == e.target){
                    locator = 'xpath';
                    locValue = stringXpath;
                  }
                  else{
                    locator = 'xpath';
                    locValue = "Error - Could not find a reliable locator for this node.";    
                  }
              }
          }
          else {
            var stringXpath = getXSPath(e.target);
            var element = elementslib.Element.XPATH(stringXpath);
            if (element == e.target){
              locator = 'xpath';
              locValue = stringXpath;
            }
            else{
              locator = 'xpath';
              locValue = 'Error - Could not find a reliable locator for this node.';      
            }
          }
        }
        catch(err){ windmill.err(err); }
        
        return {"desc":locator, "val": locValue};
    };
    
    //write json to the remote from the click events
    this.writeJsonClicks = function(e) {
        if (windmill.ui.recorder.recordState == false) { return; }

        var loc =  windmill.ui.recorder.analyzeNode(e);
        var locator = loc.desc;
        var locValue = loc.val;
        
        //to keep from generating multiple actions for the same click
        if ((lastLocValue == locValue) && (lastLocator == locator) && (e.type != 'dblclick')){ return; }
        lastLocValue = locValue;
        lastLocator = locator;
        
        //allowing the user to click the same link again after 1 second
        //should emulate expected behavior
        windmill.ui.recorder.resetLoc = function(){
          windmill.ui.recorder.lastLocValue = null;
          windmill.ui.recorder.lastLocator = null;
        };
        setTimeout('windmill.ui.recorder.resetLoc()', 1000);

        
        if (locValue != "") {
            var params = {};
            params[locator] = locValue;

            if (e.type == 'dblclick') {
                windmill.ui.remote.addAction(windmill.ui.remote.buildAction('doubleClick', params));
            }
            else if (e.target.type == "checkbox"){
              windmill.ui.remote.addAction(windmill.ui.remote.buildAction('check', params));
            }
            else {
                
                //if sensative click is on, pick up every click that gets to the window listener
                if ($("clickOn").checked == true) {
                    //If the previous action is waits for page load
                    //we know that they don't want to access this click
                    //until the element is on the page and ready
                    //so we add a waits.forElement for the element they are clicking
                    //I find myself doing this manually constantly
                    var suiteActions = windmill.ui.remote.getSuite().childNodes;
                    var lastNode = suiteActions[suiteActions.length-1];
                    var method = null;
                    try{ method = $(lastNode.id+'method').value;}
                    catch(err){ windmill.err(err); }
                    if (method == "waits.forPageLoad"){
                      var newParams = {timeout:8000};
                      newParams[locator] = locValue;
                      var wfe = windmill.ui.remote.buildAction("waits.forElement", newParams);
                      windmill.ui.remote.addAction(wfe);
                    }
                    //Add the click action
                    windmill.ui.remote.addAction(windmill.ui.remote.buildAction('click', params));
                }
                //if the sensative click is off, you can click all over but we only pick up things we know are clickable
                else if ((e.target.onclick != null) || (locator == 'link') || (e.target.tagName.toUpperCase() == 'IMG')) {
                    windmill.ui.remote.addAction(windmill.ui.remote.buildAction('click', params));
                }
            }
        }
        //scroll the actions in the ide to the bottom for user convenience
        windmill.ui.remote.scrollRecorderTextArea();
    };

    //Writing json to the remote for the change events
    this.writeJsonChange = function(e) {
        if (windmill.ui.recorder.recordState == false) {
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
    };

    //Turn on the recorder
    //Since the click event does things like firing twice when a double click goes also
    //and can be obnoxious im enabling it to be turned off and on with a toggle check box
    this.recordOn = function() {    	
        //Turn off the listeners so that we don't have multiple attached listeners for the same event
        this.recordOff();
        //keep track of the recorder state, for page refreshes
        windmill.ui.recorder.recordState = true;
        $('record').innerHTML = 'Stop Recorder';

        windmill.ui.remote.getSuite();
        try { this.recRecursiveBind(windmill.testWin()); }
        catch(error) {
            windmill.err('You must not have set your URL correctly when launching Windmill, we are getting cross domain exceptions.');
            $('record').innerHTML = 'Start Recorder';
            this.recordState = false;
        }
    };

    this.recordOff = function() {      
        windmill.ui.recorder.recordState = false;
        $('record').innerHTML = 'Start Recorder';

        try {
            this.recRecursiveUnBind(windmill.testWin());
        } catch(error) {
          windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
        }

    };
    
    this.enableFlashRecorder = function(win){
      //turn on flex explorer if it's available
      var embeds = win.document.getElementsByTagName("embed");
      var objects = win.document.getElementsByTagName("object");

      //only add the explorer call back method if we have some flex on the page
      if ((embeds.length > 0) || (objects.length > 0)){
        win.fp_recorderAction = function(obj){
          var method = "flex."+obj.method;
          var params = obj.params || {};
          params["swf.chain"] = obj.chain;
                  
          var loc = windmill.ui.recorder.analyzeNode({target:windmill.ui.recorder.lastSWF});
          params[loc.desc] = loc.val;          
          
          windmill.ui.remote.addAction(windmill.ui.remote.buildAction(method, params));
          return true;
        };
      }
      
      //star the explorers on the page
      for (var i=0;i<embeds.length;i++){
        try {
          embeds[i].fp_recorderStart();
        } catch(err){ windmill.err(err); };
      }
      for (var i=0;i<objects.length;i++){
        try {
          objects[i].fp_recorderStart();
        } catch(err){ windmill.err(err); }
      }
    };

    this.disableFlashRecorder = function(win){
      //turn on flex explorer if it's available
      var embeds = win.document.getElementsByTagName("embed");
      var objects = win.document.getElementsByTagName("object");

      //only add the explorer call back method if we have some flex on the page

      //start the explorers on the page
      for (var i=0;i<embeds.length;i++){
        try {
          embeds[i].fp_recorderStop();
        } catch(err){ windmill.err(err); }
      }
      for (var i=0;i<objects.length;i++){
        try {
          objects[i].fp_recorderStop();
        } catch(err){ windmill.err(err); }
      }
    };
    
    this.recorderMouseOver = function(e){
      if (e.target.tagName.toLowerCase() == "object"){
        this.lastSWF = e.target;
        return;
      }
      if (e.target.tagName.toLowerCase() == "embed"){
        this.lastSWF = e.target;
        return;
      }
    };
    
    this.recorderMouseOut = function(e){
      if (e.target.tagName.toLowerCase() == "object"){
        this.lastSWF = e.target;
        return;
      }
      if (e.target.tagName.toLowerCase() == "embed"){
        this.lastSWF = e.target;
        return;
      }
    };
    
    //Recursively bind to all the iframes and frames within
    this.recRecursiveBind = function(frame) {
        //Make sure we haven't already bound anything to this frame yet
        this.recRecursiveUnBind(frame);
      
        //IE's onChange support doesn't bubble so we have to manually
        //Attach a listener to every select and input in the app
        if (windmill.browser.isIE) {
            var inp = frame.document.getElementsByTagName('input');
            for (var i = 0; i < inp.length; i++) {
                jQuery(inp[i]).bind("change", this.writeJsonChange);
            }
            var se = frame.document.getElementsByTagName('select');
            for (var i = 0; i < se.length; i++) {
                jQuery(se[i]).bind("change", this.writeJsonChange);
            }
        }
        else{
            //turns out there are cases where people are canceling click on purpose
            //so I am manually going to attach click listeners to all links
            var links = frame.document.getElementsByTagName('a');
            for (var i = 0; i < links.length; i++) {
                jQuery(links[i]).bind("click", this.writeJsonClicks);
                for (var z=0; z < links[i].childNodes.length; z++){
                  jQuery(links[i].childNodes[z]).bind("click", this.writeJsonClicks);
                }
            }
        }

        jQuery(frame.document).bind("dblclick", this.writeJsonClicks);
        jQuery(frame.document).bind("change", this.writeJsonChange);
        jQuery(frame.document).bind("click", this.writeJsonClicks);
        fleegix.event.listen(frame.document, 'onmouseover', this, 'recorderMouseOver');
        fleegix.event.listen(frame.document, 'onmouseout', this, 'recorderMouseOut');
        
        this.enableFlashRecorder(frame);
        

        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++) {
            try {
                jQuery(iframeArray[i].document).bind("dblclick", this.writeJsonClicks);
                jQuery(iframeArray[i].document).bind("change", this.writeJsonChange);
                jQuery(iframeArray[i].document).bind("click", this.writeJsonClicks);
                fleegix.event.listen(iframeArray[i].document, 'onmouseover', this, 'recorderMouseOver');
                fleegix.event.listen(iframeArray[i].document, 'onmouseout', this, 'recorderMouseOut');
                      
                this.recRecursiveBind(iframeArray[i]);
                this.enableFlashRecorder(iframeArray[i]);
                
            } catch(error){
              windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
            }
        }
    };

    //Recursively bind to all the iframes and frames within
    this.recRecursiveUnBind = function(frame) {
      
      var links = frame.document.getElementsByTagName('a');
       for (var i = 0; i < links.length; i++) {
            jQuery(links[i]).unbind("click", this.writeJsonClicks);
           for (var z=0; z < links[i].childNodes.length; z++){
             jQuery(links[i].childNodes[z]).unbind("click", this.writeJsonClicks);
           }
       }
        //IE's onChange support doesn't bubble so we have to manually
        //Attach a listener to every select and input in the app
        if (windmill.browser.isIE) {
            var inp = frame.document.getElementsByTagName('input');
            for (var i = 0; i < inp.length; i++) {
                jQuery(inp[i]).unbind("change", this.writeJsonChange);
            }
            var se = frame.document.getElementsByTagName('select');
            for (var i = 0; i < se.length; i++) {
              jQuery(se[i]).unbind("change", this.writeJsonChange);
            }
        }

        jQuery(frame.document).unbind("dblclick", this.writeJsonClicks);
        jQuery(frame.document).unbind("change", this.writeJsonChange);
        jQuery(frame.document).unbind("click", this.writeJsonClicks);
        fleegix.event.unlisten(frame.document, 'onmouseover', this, 'recorderMouseOver');
        fleegix.event.unlisten(frame.document, 'onmouseout', this, 'recorderMouseOut');
        
        this.disableFlashRecorder(frame);
        
        var iframeCount = frame.window.frames.length;
        var iframeArray = frame.window.frames;

        for (var i = 0; i < iframeCount; i++) {
            try {
                jQuery(iframeArray[i].document).unbind("dblclick", this.writeJsonClicks);
                jQuery(iframeArray[i].document).unbind("change", this.writeJsonChange);
                jQuery(iframeArray[i].document).unbind("click", this.writeJsonClicks);
                fleegix.event.unlisten(iframeArray[i].document, 'onmouseover', this, 'recorderMouseOver');
                fleegix.event.unlisten(iframeArray[i].document, 'onmouseout', this, 'recorderMouseOut');
                
                this.recRecursiveUnBind(iframeArray[i]);
                this.disableFlashRecorder(iframeArray[i]);
                
            } catch(error){
              windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
            }
        }
    };
};