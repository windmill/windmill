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

//DOM Explorer Functions
windmill.ui.dx = new function() {
  var exploreState = false;
  
  this.setExploreState = function() {
    if (this.exploreState == true) { this.domExplorerOn(); }
  }
  //Reset the border to what it was before the mouse over
  this.resetBorder = function(e) { 
    e.target.style[windmill.ui.hilightProp] = '';
  }
  
  //Display the id in the remote
  this.setIdInRemote = function(e) {
    if ($(windmill.ui.remote.selectedInputID) == null){
      windmill.ui.remote.selectedInputID = null;
    }
    
    //if absolute xpath is not wanted try our best to get a better locater
    if ($('useXpath').checked == false) {
        $("domExp").innerHTML = "";
        
        if (e.target.id != "") {
          var element = elementslib.Element.ID(e.target.id);
          if (element == e.target){
            $("domExp").innerHTML = "ID: " + e.target.id;
          }
        }
        else if ((e.target.name != "") && (typeof(e.target.name) != "undefined")) {
          var element = elementslib.Element.NAME(e.target.name);
          if (element == e.target){
            $("domExp").innerHTML = "Name: " + e.target.name;
          }
        }
        else if ((e.target.nodeName.toUpperCase() == "A") || (e.target.parentNode.nodeName.toUpperCase() == "A")) {
          //Validation
          var element = elementslib.Element.LINK(removeHTMLTags(e.target.innerHTML));
          if (element == e.target){
            $("domExp").innerHTML = "Link: " + removeHTMLTags(e.target.innerHTML);
          }
        }
        else if ((e.target.value != "") && (typeof(e.target.value) != "undefined")) {
          var element = elementslib.Element.VALUE(e.target.value);
          if (element == e.target){
            $("domExp").innerHTML = "Value: " + e.target.value;
          }
        }
        //if not just use the xpath
        if ($("domExp").innerHTML == ""){
          var stringXpath = getXSPath(e.target);
          //test to make sure it actually works
          var element = elementslib.Element.XPATH(stringXpath);
          
          if (element == e.target){
            $("domExp").innerHTML = 'XPath: ' + stringXpath;
          }
          else{
            $("domExp").innerHTML = "XPath: Error - Could not find a reliable locator for this node.";
          }
        }
      }
      else {
         var stringXpath = getXSPath(e.target);
         var element = elementslib.Element.XPATH(stringXpath);
         if (element == e.target){
            $("domExp").innerHTML = 'XPath: ' + stringXpath;
          }
          else{
            $("domExp").innerHTML = "XPath: Error - Could not find a reliable locator for this node.";
          }
      }
      
      //trying to keep old borders from getting left all over the page
      if (windmill.ui.dx.currElem){
        //sometimes IE doesn't like this
        try {
          windmill.ui.dx.currElem.style[windmill.ui.hilightProp] = "";
        } catch(err){}
      }
      
      e.target.style[windmill.ui.hilightProp] = windmill.ui.borderHilight;
      windmill.ui.dx.currElem = e.target;
      
      this.explorerUpdate(e);
  };
  
  this.parseDOMExp = function(){
    var a = $("domExp").innerHTML.split(': ');
    //If the element is a link, get rid of the all the garbage
    if (a[0] == 'link') {
      a[1] = a[1].replace(/(<([^>]+)>)/ig, "");
      a[1] = a[1].replace(/\n/g, "");
    }
    return a;
  };
  
  this.updateAction = function(){
    var a = this.parseDOMExp();
    a[0] = a[0].toLowerCase();

    if (windmill.ui.remote.selectedInputID) {
      var id = windmill.ui.remote.selectedInputID;
      var input = $(id);
      
      //Sometimes there isnt a drop down, just a span
      try {
        var dd = $(id+"Type");
        if (dd.value.indexOf('opt') != -1){
          dd.value = "opt"+a[0];
        }
        else {
          dd.value = a[0];
        }
      }
      catch(err){ windmill.err(err); }
      
      input.value = a[1];
      input.focus();
    }
  };
  
  this.explorerUpdate = function(e) {
    e.cancelBubble = true;
    if (windmill.browser.isIE == false) {
      try {
        e.stopPropagation();
        e.preventDefault();
      } catch(err){}
    }
    
    this.updateAction();
  };
  
  this.showMouseCoords = function(e){
    $('mouseExp').innerHTML = '('+e.clientX + ',' + e.clientY+')';
  }
  
  this.explorerClick = function(e) {
    e.cancelBubble = true;
    if (windmill.browser.isIE == false) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    var optId = windmill.ui.remote.selectedInputID;
    //if an option section is selected and the altKey is down append the mouse coords
    if ((optId != null) && (e.altKey)){
      if ($(optId).value == ""){
        $(optId).value += '('+e.clientX+','+e.clientY+'),';
      }
      else{
        $(optId).value += '('+e.clientX+','+e.clientY+')';
      }
    }
    else {
      var toggleButton = jQuery(":button").filter(":contains(Pause)")[0];
      windmill.events.triggerMouseEvent(toggleButton, 'click', true);
      
      this.domExplorerOff();
      window.focus();
      this.resetBorder(e);
    }
  };
  
  //Set the listeners for the dom explorer
  this.domExplorerOn = function() {
    
    jQuery("#domInspector").dialog('open');
    
    //Display the mouse coords in the IDE
    fleegix.event.listen(windmill.testWin().document.body, 'onmousemove', windmill.ui.dx, 'showMouseCoords');
    
    this.exploreState = true;
    try {
      $('explorer').innerHTML = 'Stop DOM Explorer';
      $('domExp').innerHTML = '';
      this.dxRecursiveBind(windmill.testWin());
    }
    catch(error) {
      windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      $('explorer').innerHTML = 'Start DOM Explorer';
      this.exploreState = false;
    }
  };

  //Remove the listeners for the dom explorer
  this.domExplorerOff = function() {
    window.focus();
    
    try {
      var toggleButton = jQuery(":button").filter(":contains(Pause)")[0];
    
      if (toggleButton.innerHTML == "Pause"){
        windmill.events.triggerMouseEvent(toggleButton, 'click', true);
      }
    } catch(err){}
    
    //Mouse coords display off
    fleegix.event.unlisten(windmill.testWin().document.body, 'onmousemove', windmill.ui.dx, 'showMouseCoords');
    this.exploreState = false;

    try {
      //Reset the selected element
      windmill.ui.remote.selectedInputID = null;
      
      $('explorer').innerHTML = 'Start DOM Explorer';
      this.dxRecursiveUnBind(windmill.testWin());
    }
    catch(error) {
      windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      $('explorer').innerHTML = 'Start DOM Explorer';
      this.exploreState = false;
    }
  };
  
  this.enableFlashExplorer = function(win){
    //turn on flex explorer if it's available
    var embeds = win.document.getElementsByTagName("embed");
    var objects = win.document.getElementsByTagName("object");
    
    //only add the explorer call back method if we have some flex on the page
    if ((embeds.length > 0) || (objects.length > 0)){
      win.fp_explorerSelect = function(obj){
        $("domExp").innerHTML = "chain: "+obj;
        return true;
      };
      win.fp_explorerStopped = function(obj){
        windmill.ui.dx.domExplorerOff();
        return true;
      }
    }
    
    //star the explorers on the page
    for (var i=0;i<embeds.length;i++){
      try {
        embeds[i].fp_explorerStart();
      } catch(err){};
    }
    for (var i=0;i<objects.length;i++){
      try {
        objects[i].fp_explorerStart();
      } catch(err){}
    }
  };
  
  this.disableFlashExplorer = function(win){
    //turn on flex explorer if it's available
    var embeds = win.document.getElementsByTagName("embed");
    var objects = win.document.getElementsByTagName("object");
    
    //only add the explorer call back method if we have some flex on the page
    
    //start the explorers on the page
    for (var i=0;i<embeds.length;i++){
      try {
        embeds[i].fp_explorerStop();
      } catch(err){}
    }
    for (var i=0;i<objects.length;i++){
      try {
        objects[i].fp_explorerStart();
      } catch(err){}
    }
  };
  
  //Recursively bind to all the iframes and frames within
  this.dxRecursiveBind = function(frame) {
    var exitEvent = "onclick";
    if (!$('domInspectorExit').checked){
      exitEvent = "ondblclick";
    }
    
    this.dxRecursiveUnBind(frame);
    
    fleegix.event.listen(frame.document, 'onmouseover', this, 'setIdInRemote');
    fleegix.event.listen(frame.document, 'onmouseout', this, 'resetBorder');
    fleegix.event.listen(frame.document, exitEvent, this, 'explorerClick');
    
    this.enableFlashExplorer(frame);
    
    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;

    for (var i = 0; i < iframeCount; i++){
      try {
        fleegix.event.listen(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.listen(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
        fleegix.event.listen(iframeArray[i].document, exitEvent, this, 'explorerClick');
        this.dxRecursiveBind(iframeArray[i]);
        this.enableFlashExplorer(iframeArray[i]);
      }
      catch(error) {
        windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      }
    }
  };

  this.dxRecursiveUnBind = function(frame) {
    var exitEvent = "onclick";
    if (!$('domInspectorExit').checked){
      exitEvent = "ondblclick";
    }
    
    this.disableFlashExplorer(frame);
    
    fleegix.event.unlisten(frame.document, 'onmouseover', this, 'setIdInRemote');
    fleegix.event.unlisten(frame.document, 'onmouseout', this, 'resetBorder');
    fleegix.event.unlisten(frame.document, exitEvent, this, 'explorerClick');

    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;

    for (var i = 0; i < iframeCount; i++){
      try {
        fleegix.event.unlisten(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.unlisten(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
        fleegix.event.unlisten(iframeArray[i].document, exitEvent, this, 'explorerClick');
        this.dxRecursiveUnBind(iframeArray[i]);
        this.disableFlashExplorer(iframeArray[i]);
      }
      catch(error) {
        windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      }
    }
  };

};
