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

//Functions for interacting with the remote
/***************************************/
windmill.ui.remote = new function() {
    this.selectedInputID = null;

    this.scrollRecorderTextArea = function() {
        var obj = $("ideForm");
        obj.scrollTop = obj.scrollHeight;
    };

    this.clearIDE = function() {
        input_box = confirm("Are you sure you want to delete all the data in the IDE?");
        if (input_box == true) {
            fleegix.fx.fadeOut($('ideForm'));
            d = function() {
                $('ideForm').innerHTML = '';
                windmill.ui.recorder.recordOff();
                fleegix.fx.fadeIn($('ideForm'));

            };
            setTimeout("d()", 800);
        }
    };

    this.methodChange = function(id) {
        var selected = $(id + 'method').selectedIndex;
        var methodObj = $(id + 'method');
        var method = methodObj[selected].value;
        if (method.indexOf('--') != -1){
          $(id + 'method').selectedIndex = 0;
          return;
        }
        //Preserve the value that was in there
        try {
          var oldLocator = $(id + "locator").value;
          var oldLocatorType = $(id + "locatorType").value;
        }
        catch(err) { windmill.err(err); }
        var newAction = this.buildAction(method, {
            'uuid': id
        });
        
        //Ugly hack caused by bug in jquery
        if (windmill.browser.isIE){
          $(id).innerHTML = newAction.innerHTML;
        }
        else {
          jQuery($(id)).replaceWith(newAction);
        }
        //only try to replace them if this particular action had a locator to begin with
        try {
          if (typeof(oldLocator) != 'undefined') {
            $(id + "locator").value = oldLocator;
            $(id + "locatorType").value = oldLocatorType;
          }
        }
        catch(err) { windmill.err(err); }

        //safari hack for resizing the suite div to accomodate the new action
        $(id).style.height = '';
        
        //if the action was an open, automatically insert a waits.forPageLoad
        //but only if the next action isn't already forPageLoad
        var nextAction = $(id).nextSibling;
        var nextMethod = null;
        if (nextAction){
          nextMethod = $(nextAction.id+"method").value;
        } 
        if (method == "open" && nextMethod != "waits.forPageLoad"){
          this.addActionBelow(id,this.buildAction("waits.forPageLoad", {timeout:8000}));
          $(id+"option").focus();
        }
    };

    this.setInputID = function(id) {
      this.selectedInputID = null;
      this.selectedInputID = id;
    };
    //This is because the google chrome rendering engine sucks
    //and makes drop down boxes with background images black
    this.addCSSBG = function(){
      var is_chrome = /chrome/.test( navigator.userAgent.toLowerCase() );
      if (!is_chrome){
       var smallopts = jQuery(".smalloption") ;
       for (i=0; i < smallopts.length; i++){
         smallopts[i].style.background = 'transparent url("/windmill-serv/img/text_elem_gradient.gif")';
       }
      }
    };

    this.addActionAbove = function(uuid) {
        var newAction = this.buildAction(null, {});
        jQuery($(uuid)).before(jQuery(newAction));
        $(newAction.id + "locator").focus();
        fleegix.fx.fadeIn($(newAction.id));
    };

    this.addActionBelow = function(uuid, action) {
        if (!action){ var action = this.buildAction(null, {}); }
        jQuery($(uuid)).after(action);
        var loc = $(action.id + "locator");
        if (loc){ loc.focus(); }
        fleegix.fx.fadeIn($(action.id));
    };

    this.deleteAction = function(uuid) {
        fleegix.fx.fadeOut($(uuid));
        d = function() {
          var pElement = $(uuid).parentNode;
          //pElement.removeChild($(uuid));
          jQuery($(uuid)).remove();
          //So that we don't leave the selected element
          //variable turned on when there are no actions in the IDE
          if (pElement.id == 'ideForm') {
            windmill.ui.remote.selectedInputID = null;
          }
        };
        setTimeout("d()", 800);
    };

    this.addAction = function(action) {
        var suite = this.getSuite();
        suite.style.height = '';
        if (typeof(action) == 'undefined') {
          var action = this.buildAction(null, {});
        }
        //A hack to make it draw the UI correctly in IE
        suite.appendChild(action);
        if (windmill.browser.isIE) {
          $(action.id).innerHTML = action.innerHTML;
        }
        else {
          try { $(action.id + "locator").focus(); }
          catch(err){ windmill.err(err); }
        }
        //this.addCSSBG();
        return action.id;

    };
    
    //Update all the required DOM to rename the suite
    this.updateSuite = function(suiteName){
      var newSN = prompt("New Suite Name?",suiteName);
      if ((!newSN) || (newSN == "")){
        return;
      }
      //make sure it's a legit suite name
      newSN = newSN.replace(" ", "_");
      var oldSuite = $(suiteName);  
      oldSuite.id = newSN;
      
      //change all of the old suite names
      var re = new RegExp(suiteName, "g");
      var header = jQuery("#"+oldSuite.id+" > .suiteHeader"); 
      //jQuery(oldSuite).html(oldSuite.innerHTML.replace(re, newSN));
      jQuery(header).html(header.html().replace(re, newSN));
      
      windmill.ui.currentSuite = newSN;
    };
    
    this.getSuite = function(suiteName, newFlag) {
        if (typeof(newFlag) == "undefined"){
          var newFlag = false;
        }
        //If what we really want is a new suite, the newFlag was passed
        if (newFlag){
          var suiteName = 'recordingSuite' + windmill.ui.recordSuiteNum;
          windmill.ui.currentSuite = null;
        }
        //if not
        else {
          //if there is a current suite selected
          if (windmill.ui.currentSuite){
            var suiteName = windmill.ui.currentSuite;
          }
          //default to a new one
          else {
            var suiteName = 'recordingSuite' + windmill.ui.recordSuiteNum;
          }
        }
          
        var suite = $(suiteName);
        if (suite == null) {
            var ide = $('ideForm');
            suite = document.createElement('div');
            suite.className = "suite";
            suite.id = suiteName;
            
            var templ = new fleegix.ejs.Template({ node: $('suiteHeaderTemplate') });
            //display some of the name
            var suiteNameCrop = suiteName;
            if (suiteNameCrop.length > 18){
              suiteNameCrop = suiteName.substr(0, 18) + "..."
            }
            var suiteHead = templ.process({ data: { suiteName: suiteName, suiteNameCrop: suiteNameCrop} });
            jQuery(suite).html(suiteHead);
            
            //Append the new suite to the IDE
            $('ideForm').appendChild(suite);
            
            //Make the suites and actions draggable
            jQuery(suite).sortable({items: ".action", axis: "y"});
            jQuery($('ideForm')).sortable({items:".suite", axis: "y", cancel: '.action,.suiteTitleDiv,input,select,option,a,img'});
 
            //minimize the last suite
            try {
              var h = $(suite.id).previousSibling.style.height;
              //If the last suite is expanded, collapse it
              if (h != '22px') { 
                windmill.ui.toggleCollapse($(suite.id).previousSibling.id); 
              }
            } catch(err) { windmill.err(err);  }
        }
        return suite;
    };

    //Send the suite to save to the backend and receive an url for the user to save
    this.saveSuite = function(id) {
        var suite = $(id);
        var testArray = [];

        if (suite.hasChildNodes()){
            for (var j = 1; j < suite.childNodes.length; j++) {
                var actionObj = {};
                actionObj.suite_name = suite.id;
                actionObj.version = "0.1";

                if ($(suite.childNodes[j].id + 'params') != null) {
                  actionObj.method = $(suite.childNodes[j].id + 'method').value;
                  actionObj.params = eval('(' + $(suite.childNodes[j].id + 'params').value + ')');
                }
                else {
                  var si = $(suite.childNodes[j].id + 'method').selectedIndex;
                  actionObj.method = $(suite.childNodes[j].id + 'method')[si].value;
                  var paramsObj = {};
                  paramsObj.uuid = suite.childNodes[j].id;

									//For correctly saving out flex actions
                  if (windmill.registry.methods[actionObj.method].swf) {
                    var si = $(suite.childNodes[j].id + 'swfType').selectedIndex;
                    paramsObj['swf_'+$(suite.childNodes[j].id + 'swfType')[si].value] = $(suite.childNodes[j].id + 'swf').value;
                  }

                  //If the action has a locator
									if (windmill.registry.methods[actionObj.method].locator) {
                    var si = $(suite.childNodes[j].id + 'locatorType').selectedIndex;
                    paramsObj[$(suite.childNodes[j].id + 'locatorType')[si].value] = $(suite.childNodes[j].id + 'locator').value;
                  }

									//If the action has an option
                  if (windmill.registry.methods[actionObj.method].option) {
                    var optNode = $(suite.childNodes[j].id + 'optionType');
                    //if we have a select vs a span (1 option)
                    if (optNode.tagName.toLowerCase() == "select"){
                      var si = $(suite.childNodes[j].id + 'optionType').selectedIndex;
                      paramsObj[$(suite.childNodes[j].id + 'optionType')[si].value] = $(suite.childNodes[j].id + 'option').value;
                    }
                    else {
                      paramsObj[$(suite.childNodes[j].id + 'optionType').innerHTML] = $(suite.childNodes[j].id + 'option').value; 
                    }
                  }
                  actionObj.params = paramsObj;
                }
                testArray.push(actionObj);
            }

            var respRun = function(response){
              window.open(response.result, null, "height=500,width=600,status=no,toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=1");
              return true;
            };

            //Get the language to save these suckers in
            var langSI = $('suiteSaveFormat').selectedIndex;
            var lang = $('suiteSaveFormat')[langSI].value;

            var jsonObject = new jsonCall('1.1', 'create_save_file');
            var params_obj = {};
            params_obj.transformer = lang;
            params_obj.suite_name = id;
            params_obj.tests = testArray;
            jsonObject.params = params_obj;

            var jsonString = JSON.stringify(jsonObject);
            //fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', jsonString);
            jQuery.post('/windmill-jsonrpc/', jsonString, respRun);
        }
        else {
          alert('You need test actions to save!');
        }
    };
    
    this.getMethods = function(state){
      var reg = windmill.registry;
      
      var select = jQuery("<select>");
      select.addClass("smalloption");
      select.attr("id", state.action.id + "method");
      
      //Setup default method
      var option = jQuery("<option>");
      option.attr("value", state.method);
      option.attr("selected", "selected");
      option.html(option.html() + state.method);
      select.append(option);

      //Setup methods option  
      for (var m in reg.methods) {
        var option = jQuery("<option>");
        option.attr("value", m);
        option.html(option.html() + m);
        var mObj = reg.methods[m];

        if (mObj.section != undefined){ option.attr("disabled", true); }
        select.append(option);
      }
      
      select.change(function() {
        windmill.ui.remote.methodChange(state.action.id);
      });
      select.attr("title", "Controller method to execute.");
      
      if ($('showToolTips').checked){
        select.tooltip({showURL: false});
      }
      return select[0];
    };
    
    this.getOptions = function(state){
      var reg = windmill.registry;
      
      var select = jQuery("<select>");
      select.addClass("smalloption");
      select.attr("id", state.action.id + "optionType");
          
      if (reg.methods[state.method].optionIsLocator){
        for (var loc = 0; loc < reg.locator.length;loc++){
          newOpt = jQuery('<option>');
          newOpt.attr("value", "opt"+reg.locator[loc]);
          newOpt.html(reg.locator[loc]);
          if (state.params[newOpt.value]){
            newOpt.attr("selected", "selected");
            windmill.ui.remote.optionValue = state.params[newOpt.value];
          }
          select.append(newOpt);
        }
      }
      //if the options are a comma delimited list, build the drop down
      else if (reg.methods[state.method].option){
        var optArr = reg.methods[state.method].option.split(',');
        //if there is only one option available
        if (optArr.length == 1){
          var spanNode = jQuery("<span>").html(optArr[0]);
          spanNode.addClass("textSpan");
          spanNode.attr("id", state.action.id + "optionType");
          return spanNode[0];
        }
        for (var opt = 0; opt < optArr.length; opt++){
          var newOpt = jQuery('<option>');
          if (state.params[optArr[opt]]){
            newOpt.attr("selected", true);
          }
          newOpt.attr("value", optArr[opt]);
          newOpt.html(optArr[opt]);
          select.append(newOpt);
        }
      }
      else {
        if (reg.methods[state.method].option == false){
          return false;
        }
        var option = jQuery('<option>');
        if (typeof(reg.methods[state.method].option) != 'undefined') {
          option.attr("value", reg.methods[state.method].option);
        }
        option.attr("selected", "selected");
        option.html(option.html() + reg.methods[state.method].option);
        select.append(option);
      }
      
      select.attr("title", "Optional parameters.");
      if ($('showToolTips').checked){
        select.tooltip({showURL: false});
      }
      return select[0];
    };
    
    this.getLocatorType = function(params){
      var reg = windmill.registry;
      var locator = null;
      //Get the locator from all available
      for (var loc = 0; loc < reg.locator.length; loc++){
       if (params[reg.locator[loc]]){
         locator = reg.locator[loc];
         return locator;
       }
      }
      return locator;
    };
    
    this.getLocators = function(state){
      var _this = windmill.ui.remote;
      var reg = windmill.registry;
      
      if (!reg.methods[state.method].locator){
        return false;
      }
      
      var locator = _this.getLocatorType(state.params);

      //Setup second select
      var select = jQuery("<select>");
      select.addClass("smalloption");
      select.attr("id", state.action.id + "locatorType");

      var option = jQuery("<option>");
      option.attr("selected", "selected");
      
      if (locator) {
         option.attr("value", locator);
         option.html(option.html() + locator);
         select.append(option);
      }

      for (var i = 0; i < reg.locator.length; i++) {
         var option = jQuery("<option>");
         option.attr("value", reg.locator[i]);
         option.html(option.html() + reg.locator[i]);
         select.append(option);
      }
      select.attr("title", "Locator used to lookup node.");
      if ($('showToolTips').checked){
        select.tooltip({showURL: false});
      }
      return select[0];
    };
    
    this.getLocatorInput = function(state){
      var reg = windmill.registry;
      var _this = windmill.ui.remote;
      var locator = _this.getLocatorType(state.params);
      
      //Add the text box
      var input = jQuery("<input>");
      input.attr("name", "locValue");
      input.addClass("texta");
      
      //Dont know why I have to do this.. but it wont work if its not setattrib
      if (state.params[locator]) { 
        input.attr("value", state.params[locator]);
      }
      input.attr("id", state.action.id + "locator");
      //in firefox there was a bug moving the focus to the element we clicked, not sure why
      //but this seems to fix it. 
      if (!windmill.browser.isIE6x) {
        input.focus(function() {
          windmill.ui.remote.setInputID(input.attr("id"));
        });
      } 
      return input[0];
    };
    
    this.getOptionInput = function(state){
      var reg = windmill.registry;
      
      var input = jQuery("<input>");
      input.attr("name", "optValue");
      input.addClass("texta");
            
      //if the action had a special flag, dragDropElemToElem
      if (windmill.ui.remote.optionValue != undefined){
        input.attr("value", windmill.ui.remote.optionValue);
        delete windmill.ui.remote.optionValue;
      }
      //for the commad delimited list of options case
      try{ //this was breaking when option is a bool instead of a string
        if (reg.methods[state.method].option.indexOf(',') != -1) {
          var opts = reg.methods[state.method].option.split(',');
            for (i=0; i<opts.length; i++){
            if (state.params[opts[i]]){
              input.attr("value", state.params[opts[i]]);
            }
          }
        }
      }
      catch(err){ windmill.err(err); }
      //for the single option case
      if (typeof(state.params[reg.methods[state.method].option]) != "undefined") {
        input.attr("value", state.params[reg.methods[state.method].option]);
      }

      //give the value input an id
      input.attr("id", state.action.id + "option");
      if (!windmill.browser.isIE6x) {
        input.focus(function(){
          windmill.ui.remote.setInputID(input.attr("id"));
        });
      }

      return input[0];
    };
    
    this.getBaseAction = function(method, params){
      var action = jQuery("<div>");
      action.addClass("ui-corner-all action");
      action.css("background", "#FBF9EE");
      
      if (typeof(params) == "undefined") {
        var params = {};
      }

      if (typeof(params.uuid) == "undefined") {
        var date = new Date();
        action.attr("id", date.getTime());
      }
      else { action.attr("id", params.uuid); }
      
      //if the user turns on the option to run actions by hitting enter
      var catchEnter = function(e){
       if (e.keyCode == 13){
         var aid = e.target.id.replace("locator","");
         aid = aid.replace("option", "");
         windmill.ui.playback.sendPlayBack(aid);
       }
      };
      action.keypress(catchEnter);
      
      action.css("border", "1px solid white");
      return action[0];
    };
    
    this.getSWF = function(state){
      var _this = windmill.ui.remote;
      var swfCont = jQuery("<div>");
      var swfLoc = jQuery(_this.getLocators(state));
      swfLoc.attr("id", state.action.id +"swfType");
      
      var input = jQuery("<input>");
      input.attr("id", state.action.id + "swf");
      input.addClass("texta");
      
      if (state.params["swf.chain"]){
        input.attr("value", state.params["swf.chain"]);
        swfLoc.attr("value", "chain");
      }
      
      if (!windmill.browser.isIE6x) {
        input.focus(function() {
          windmill.ui.remote.setInputID(input.attr("id"));
        });
      }
      
      swfCont.append(swfLoc);
      swfCont.append(input);

      return swfCont[0];
    };
    
    //This function takes a method and it's params and returns a DOM
    //Element representing that action for the UI
    this.buildAction = function(method, params) {
        var _this = windmill.ui.remote;
        var reg = windmill.registry;
        
        //if we just want a blank action
        //default to type for now so everything gets displayed
        if (method == null) {
            method = 'click';
            params.id = '';
        }
        var action = _this.getBaseAction(method, params);

        //would really like to get rid of the complex method
        if (reg.methods[method] == null) {
          jQuery(action).html(method + JSON.stringify(params));
          return action;
        }
        
        //Build the buttons
        var templ = new fleegix.ejs.Template({ node: $('actionButtonsTemplate') });
        var buttons = templ.process({ data: { id: action.id } });
        var buttonNode = $elem('span', {className:'buttons'});
        jQuery(buttonNode).html(buttons);
        
        var state = {method: method, params: params, action: action};
        
        //Get all the form elements for actions
        var methods = _this.getMethods(state);
        var locators = _this.getLocators(state);
        var options = _this.getOptions(state);
        var locatorInput = _this.getLocatorInput(state);
        var optionInput = _this.getOptionInput(state);
        
        //add methods and buttons
        jQuery(action).append(jQuery(methods));
        jQuery(action).append(jQuery(buttonNode));
        
        //if this action has locators, add them in a container
        if (locators){
          var locCont = jQuery("<div>");
          locCont.append(jQuery(locators))
          locCont.append(jQuery(locatorInput));
          jQuery(action).append(jQuery(locCont));
        }
        
        //if we have a flex action swf is true
        //build the swf UI
        if (reg.methods[method].swf){          
         var swfCont = _this.getSWF(state);
         jQuery(action).append(jQuery(swfCont));
        }
        
        //if this action has options, add them in a container
        if (options){
          var optCont = jQuery("<div>");
          optCont.append(options);
          
          //if its a string not a drop down: only one option
          if (options.tagName.toLowerCase() != "select"){
            jQuery(optCont).append(jQuery("<span>").html(': ').addClass("textSpan"));
          }
          jQuery(optCont).append(jQuery(optionInput));
          jQuery(action).append(optCont);
        }        
        return action;
    };
};