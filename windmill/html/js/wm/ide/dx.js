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
windmill.ui.domexplorer = new function() {
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
    if ($(windmill.ui.remote.selectedElement) == null){
      windmill.ui.remote.selectedElement = null;
    }
    if (windmill.ui.remote.selectedElement != null) {
      $("domExp").style.display = 'none';
    }
    if (windmill.ui.remote.selectedElementOption != null) {
      $("domExp").style.display = 'none';
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
      if (windmill.ui.domexplorer.currElem){
          //sometimes IE doesn't like this
          try{
            windmill.ui.domexplorer.currElem.style[windmill.ui.hilightProp] = "";
          }
          catch(err){}
      }
      
      e.target.style[windmill.ui.hilightProp] = windmill.ui.borderHilight;
      windmill.ui.domexplorer.currElem = e.target;
      
      this.explorerUpdate(e);
  };

  this.explorerUpdate = function(e) {
    e.cancelBubble = true;
    if (windmill.browser.isIE == false) {
        e.stopPropagation();
        e.preventDefault();
    }
    if (windmill.ui.remote.selectedElementOption != null && e.altKey == false) {
        var id = windmill.ui.remote.selectedElementOption.replace('option', '');
        //Incase if that node has been removed somehow
        try {
          var a = $("domExp").innerHTML.split(': ');
          //If the element is a link, get rid of the all the garbage
          if (a[0] == 'link') {
              a[1] = a[1].replace(/(<([^>]+)>)/ig, "");
              a[1] = a[1].replace(/\n/g, "");
          }
          $(id + 'optionType').value = 'opt'+a[0].toLowerCase();
          $(id + 'option').value = a[1];
          $(id + 'option').focus();
        }
        catch(error) {
          windmill.err('Error in dom explorer');
        }
    }
    
    if (windmill.ui.remote.selectedElement != null) {
        var id = windmill.ui.remote.selectedElement.replace('locator', '');
        
        //Incase if that node has been removed somehow
        try {
          var a = $("domExp").innerHTML.split(': ');
          //If the element is a link, get rid of the all the garbage
          if (a[0] == 'link') {
              a[1] = a[1].replace(/(<([^>]+)>)/ig, "");
              a[1] = a[1].replace(/\n/g, "");
          }
          $(id + 'locatorType').value = a[0].toLowerCase();
          $(id + 'locator').value = a[1];
          $(id + 'locator').focus();
        }
        catch(error) {
          windmill.err('Error in dom explorer');
        }
    }
    
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
    
    var optId = windmill.ui.remote.selectedElementOption;
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
      if ($("domExp").style.display == 'none'){
        windmill.ui.domexplorer.domExplorerOff();
      } else {
        windmill.ui.domexplorer.dxRecursiveUnBind(windmill.testWin());
      }
      window.focus();
    }
  };
  
  //Set the listeners for the dom explorer
  this.domExplorerOn = function() {
    
    //Display the mouse coords in the IDE
    fleegix.event.listen(windmill.testWin().document.body, 'onmousemove', windmill.ui.domexplorer, 'showMouseCoords');
    
    
    this.exploreState = true;
    try {
      $('explorer').src = 'img/xoff.png';
      $('domExp').style.display = 'block';
      $('domExp').innerHTML = '';
      this.dxRecursiveBind(windmill.testWin());
    }
    catch(error) {
      windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      $('explorer').src = 'img/xon.png';
      this.exploreState = false;
    }
  };

  //Remove the listeners for the dom explorer
  this.domExplorerOff = function() {
    //Mouse coords display off
    fleegix.event.unlisten(windmill.testWin().document.body, 'onmousemove', windmill.ui.domexplorer, 'showMouseCoords');
    $('mouseExp').innerHTML = "";
    this.exploreState = false;

    try {
      //Reset the selected element
      windmill.ui.remote.selectedElement = null;
      windmill.ui.remote.selectedElementOption = null;
      
      $('explorer').src = 'img/xon.png';
      $('domExp').style.display = 'none';
      $('domExp').innerHTML = '';
      this.dxRecursiveUnBind(windmill.testWin());
    }
    catch(error) {
      windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      $('explorer').src = 'img/xon.png';
      this.exploreState = false;
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

    var iframeCount = frame.window.frames.length;
    var iframeArray = frame.window.frames;

    for (var i = 0; i < iframeCount; i++){
      try {
        fleegix.event.listen(iframeArray[i].document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.listen(iframeArray[i].document, 'onmouseout', this, 'resetBorder');
        fleegix.event.listen(iframeArray[i].document, exitEvent, this, 'explorerClick');
        this.dxRecursiveBind(iframeArray[i]);
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
      }
      catch(error) {
        windmill.err('Binding to windows and iframes, '+error +'.. binding all others.');
      }
    }
  };

};