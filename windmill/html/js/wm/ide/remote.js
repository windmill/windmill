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
    this.selectedElement = null;
    this.selectedElementOption = null;

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
        catch(err) { }
        var newAction = this.buildAction(method, {
            'uuid': id
        });
        $(id).innerHTML = newAction.innerHTML;
        //only try to replace them if this particular action had a locator to begin with
        try {
          if (typeof(oldLocator) != 'undefined') {
            $(id + "locator").value = oldLocator;
            $(id + "locatorType").value = oldLocatorType;
          }
        }
        catch(err) {}

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

    this.setRemoteElem = function(id) {
      this.selectedElementOption = null;
      this.selectedElement = id;
    };
    this.setRemoteElemOption = function(id) {
      this.selectedElement = null;
      this.selectedElementOption = id;
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
    }

    this.addActionAbove = function(uuid) {
        var newAction = this.buildAction(null, {});
        var parent = $(uuid).parentNode;
        parent.insertBefore(newAction, $(uuid));
        //IE hack
        if (windmill.browser.isIE) {
          $(newAction.id).innerHTML = newAction.innerHTML;
        }
        else {
          $(newAction.id + "locator").focus();
        }
        this.addCSSBG();
        fleegix.fx.fadeIn($(newAction.id));
    };

    this.addActionBelow = function(uuid, action) {
        if (!action){ var action = this.buildAction(null, {}); }
        var parent = $(uuid).parentNode;
        parent.insertBefore(action, $(uuid).nextSibling);
        //IE Hack
        if (windmill.browser.isIE) { $(action.id).innerHTML = action.innerHTML; }
        else {
          var loc = $(action.id + "locator");
          if (loc){ loc.focus(); }
        }
        this.addCSSBG();
        fleegix.fx.fadeIn($(action.id));
    };

    this.deleteAction = function(uuid) {
        //input_box=confirm("Are you sure you want to continue deleting?");
        //if (input_box==true) {
        fleegix.fx.fadeOut($(uuid));
        d = function() {
            var pElement = $(uuid).parentNode;
            pElement.removeChild($(uuid));

            //So that we don't leave the selected element
            //variable turned on when there are no actions in the IDE
            if (pElement.id == 'ideForm') {
                windmill.ui.remote.selectedElement = null;

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
            catch(err){}
        }
        this.addCSSBG();
        return action.id;

    };

    this.actionFromJSON = function(){
      var json = prompt("Enter JSON String", '{"params": {"xpath": "/html/body"}, "method": "click"}');
      if (json != null){
        try { 
          var actionObj = eval('('+json+')');
          var action = windmill.ui.remote.buildAction(actionObj.method, actionObj.params);
          windmill.ui.remote.addAction(action);
        }
        catch(err){alert('Please enter valid JSON');}
      }
    }
    
    //Update all the required DOM to rename the suite
    this.updateSuite = function(suiteName){
      var newSN = prompt("New Suite Name?","");
      if ((!newSN) || (newSN == "")){
        return;
      }
      //make sure it's a legit suite name
      newSN = newSN.replace(" ", "_");
      var oldSuite = $(suiteName);  
      oldSuite.id = newSN;
      
      //change all of the old suite names
      var re = new RegExp(suiteName, "g");
      jQuery(oldSuite).html(oldSuite.innerHTML.replace(re, newSN));
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
            
            suite.innerHTML = "<table id='"+suiteName+"Header'"+
            "class='suiteHeader'><tr><td style=\"font-size:13px;\"><strong style='cursor:all-scroll'>Suite </strong><span class='suiteTitleDiv' title='"+suiteName+
            "' id='"+suiteName+"Title' onclick=\"windmill.ui.remote.updateSuite(\'"+
            suiteName+"\');\">" + suiteName + 
            "</span></td><td VALIGN='top'><span id='"+suiteName+"Links' align=\"right\" style='top:0px;float:right;'>"+
            "<a class='ui-state-default ui-corner-all suiteButton' href=\"#\" onclick=\"windmill.ui.playback.sendPlayBack(null,\'" + suiteName + 
            "\')\">play</a>&nbsp<a class='ui-state-default ui-corner-all suiteButton' href=\"#\" onclick=\"windmill.ui.remote.saveSuite(\'" + suiteName + 
            "\')\">save</a>&nbsp<a class='ui-state-default ui-corner-all suiteButton' href=\"#\" onclick=\"windmill.ui.remote.deleteAction(\'" + suiteName + 
            "\')\">delete</a>&nbsp<a class='ui-state-default ui-corner-all suiteButton' href=\"#\" onclick=\"javascript:windmill.ui.toggleCollapse(\'" + suiteName + 
            "\')\">toggle</a>&nbsp<a class='ui-state-default ui-corner-all suiteButton' href=\"#\" onclick=\"windmill.ui.currentSuite=\'"+suiteName+
            "\'\">select</a></span>&nbsp;&nbsp;</td></tr></table>";

            //Append the new suite to the IDE
            $('ideForm').appendChild(suite);
            
            //Make the suites and actions draggable
            jQuery(suite).sortable({items: "div", axis: "y", cancel: '.suiteTitleDiv,input,select,option,img'});
            jQuery($('ideForm')).sortable({items:".suite", axis: "y", cancel: '.action,.suiteTitleDiv,input,select,option,a,img'});
 
            //minimize the last suite
            try {
              var h = $(suite.id).previousSibling.style.height;
              //If the last suite is expanded, collapse it
              if (h != '22px') { 
                windmill.ui.toggleCollapse($(suite.id).previousSibling.id); 
              }
            } catch(err) { }
        }
        return suite;

    };


    //Send the suite to save to the backend and receive an url for the user to save
    this.saveSuite = function(id) {
        var suite = $(id);
        var testArray = [];

        if (suite.hasChildNodes()) {
            for (var j = 1; j < suite.childNodes.length; j++) {
                //console.log(suites[i].childNodes[j].id);
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

                    if (windmill.registry.methods[actionObj.method].locator) {
                        var si = $(suite.childNodes[j].id + 'locatorType').selectedIndex;
                        paramsObj[$(suite.childNodes[j].id + 'locatorType')[si].value] = $(suite.childNodes[j].id + 'locator').value;

                    }
                    if (windmill.registry.methods[actionObj.method].option) {
                        var si = $(suite.childNodes[j].id + 'optionType').selectedIndex;
                   /*     if (actionObj.method.split(".")[0] == 'waits') {
                            paramsObj[$(suite.childNodes[j].id + 'optionType')[si].value] = parseInt($(suite.childNodes[j].id + 'option').value);

                        }
                        else {*/
                            paramsObj[$(suite.childNodes[j].id + 'optionType')[si].value] = $(suite.childNodes[j].id + 'option').value;

                        //}

                    }
                    actionObj.params = paramsObj;

                }

                //var str = fleegix.json.serialize(actionObj);
                testArray.push(actionObj);
            }

            var respRun = function(str) {
                //alert(str);
                response = eval('(' + str + ')');
                //window.open(response.result,'Saved Test','width=400,height=600')
                //window.open(response.result);
                window.open(response.result, null, "height=500,width=600,status=no,toolbar=no,menubar=no,location=no,resizable=yes");
                return true;
            }

            //Get the language to save these suckers in
            var langSI = $('suiteSaveFormat').selectedIndex;
            var lang = $('suiteSaveFormat')[langSI].value;

            var jsonObject = new jsonCall('1.1', 'create_save_file');
            var params_obj = {};
            params_obj.transformer = lang;
            params_obj.suite_name = id;
            params_obj.tests = testArray;
            jsonObject.params = params_obj;

            if (windmill.browser.isOpera){
              var jsonString = fleegix.json.serialize(jsonObject)
            }
            else {
              var jsonString = JSON.stringify(jsonObject);
            }
            fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', jsonString);

        }
        else {
            alert('You need test actions to save!');
        }
    };

    this.buildActionButtons = function(id){
      var htmlStr = '<a alt="Start Playback" href="#">\
      <img onclick="windmill.ui.playback.sendPlayBack(\'' + id + 
      '\')" src="img/play.png"></a>&nbsp;<a alt="Delete Action" href="#">' + 
      '<img onclick="windmill.ui.remote.deleteAction(\'' + id + '\')"  ' + 
      'src="img/trash.png"></a>&nbsp;<a onclick="windmill.ui.remote.addActionAbove(\'' + id + 
      '\')" href="#"><img src="img/addup.png"></a>&nbsp;<a onclick="windmill.ui.remote.addActionBelow(\'' + id + 
      '\')" href="#"><img src="img/adddown.png"></a>';
      return htmlStr;
    }

    //This function takes a method and it's params and returns a DOM
    //Element representing that action for the UI
    this.buildAction = function(method, params) {
        //if we just want a blank action
        //default to type for now so everything gets displayed
        if (method == null) {
            method = 'click';
            params.id = '';
        }
        //If no params were passed
        if (typeof(params) == 'undefined') {
            var params = {};
        }

        //var action = this.constructAction(method,'','',windmill.registry.methods[method].option,parms[windmill.registry.methods[method].option]);
        var action = document.createElement('div');
        action.className = "ui-state-highlight ui-corner-all action";
        if (!windmill.browser.isIE){
          action.style.border = "1px solid lightgray";
        }
        else {
          action.style.border = "1px solid #aaa";
        }
        
        //if the user turns on the option to run actions by hitting enter
        var catchEnter = function(e){
          if (e.keyCode == 13){
            var aid = e.target.id.replace("locator","");
            aid = aid.replace("option", "");
            windmill.ui.playback.sendPlayBack(aid);
          }
        }
        fleegix.event.listen(action, 'onkeypress', catchEnter);
        
        if (typeof(params.uuid) == 'undefined') {
            var date = new Date();
            action.id = date.getTime();
        }
        else { action.id = params.uuid; }
        
        //in the case that the method we are passsing in isn't in the registry, we can still display it
        //just without all the interactive UI elements
        if ((windmill.registry.methods[method] == null) || (method == 'complex')) {
            var t = document.createElement('table');
            t.border = "0";
            t.cellspacing = "1";
            t.cellpadding = "0";
            t.style.font = "10px arial";
            t.style.width = "100%";
            //console.log(fleegix.json.serialize(params));
            var r = document.createElement("tr");
            var c = document.createElement("td");
            c.style.width = '95%';
            //c.innerHTML += '<input type="text" class="texta" size="35" id="'+action.id+'method" value="'+ method +'"/>';
            var i0 = document.createElement("input");
            i0.type = 'text';
            i0.id = action.id + 'method';
            i0.className = 'texta';
            //i0.size = '40';
            //i0.style.width = "100%";
            i0.setAttribute('value', method);
            c.appendChild(i0);

            c.innerHTML = this.buildActionButtons(action.id);

            r.appendChild(c);

            //This makes it look better in IE
            c.innerHTML += '<br>';
            var i = document.createElement('input');
            i.type = 'text';
            i.id = action.id + 'params';
            i.className = 'texta';

            if (windmill.browser.isIE) { i.setAttribute('value', fleegix.json.serialize(params)); }
            else { i.value = fleegix.json.serialize(params); }
            
            c.appendChild(i);
            r.appendChild(c);
            t.appendChild(r);

            action.appendChild(t);
            return action;
        }

        //We need a table to format this
        var t = document.createElement('table');
        t.border = "0";
        t.cellspacing = "1";
        t.cellpadding = "0";
        t.width = '100%';
        t.style.fontSize = "10px";


        var r = document.createElement("tr");
        r.style.fontWeight = "bold";
        var c = document.createElement("td");
        c.innerHTML += 'Method: ';
        r.appendChild(c);
        //Setup the method drop down
        var s = document.createElement('select');
        s.className = 'smalloption';
        s.style.font = '13px arial';
        s.id = action.id + 'method';
        //Setup default method
        var o = document.createElement('option');
        o.value = method;
        o.selected = 'selected';
        o.innerHTML += method;
        s.appendChild(o);

        //Setup methods option  
        for (var m in windmill.registry.methods) {
            var o = document.createElement('option');
            o.value = m;
            o.innerHTML += m;
            var mObj = windmill.registry.methods[m];
            
            if (mObj.section != undefined){ o.disabled = true; }
            s.appendChild(o);
        }
        s.setAttribute("onchange", "windmill.ui.remote.methodChange('" + action.id + "');");
        
        var c = document.createElement("td");
        c.appendChild(s);
        r.appendChild(c);
        
        var c = document.createElement("td");
        c.style.textAlign = "center";
        c.innerHTML = this.buildActionButtons(action.id);

        r.appendChild(c);
        t.appendChild(r);

        //If this method needs a locator
        if (windmill.registry.methods[method].locator) {
            if (windmill.browser.isIE) {
                c.innerHTML += '<br>';
            }
            var r = document.createElement("tr");
            r.id = action.id + 'locatorRow';
            var c = document.createElement("td");
            c.style.fontWeight = "bold";
            c.innerHTML += 'Locater: ';
            r.appendChild(c);

            var locator = null;
            
            //Get the locator from all available
            for (var loc = 0; loc < windmill.registry.locator.length; loc++){
              if (params[windmill.registry.locator[loc]]){
                locator = windmill.registry.locator[loc];
              }
            }
            
            //Setup second select
            var s1 = document.createElement('select');
            s1.className = 'smalloption';
            s1.id = action.id + 'locatorType';

            var o1 = document.createElement('option');
            o1.selected = 'selected';
            if (locator) {
                o1.value = locator;
                o1.innerHTML += locator;
                s1.appendChild(o1);
            }

            for (var i = 0; i < windmill.registry.locator.length; i++) {
                var o1 = document.createElement('option');
                o1.value = windmill.registry.locator[i];
                o1.innerHTML += windmill.registry.locator[i];
                s1.appendChild(o1);

            }

            var c = document.createElement("td");
            c.colSpan = '3';
            c.appendChild(s1);
            c.innerHTML += '&nbsp';

            //Add the text box
            var i0 = document.createElement('input');
            i0.name = 'locValue';
            i0.className = 'texta';
            i0.width = '105';
            //Dont know why I have to do this.. but it wont work if its not setattrib
            if (params[locator]) { i0.setAttribute('value', params[locator]); }
            i0.id = action.id + 'locator';
            //in firefox there was a bug moving the focus to the element we clicked, not sure why
            //but this seems to fix it. 
            if (!windmill.browser.isIE6x) {
                i0.setAttribute('onFocus', 'windmill.ui.remote.setRemoteElem(\'' + i0.id + '\')');
                //i0.setAttribute('onClick', '$(\'' + i0.id + '\').focus();');
            }
        
            c.appendChild(i0);
            r.appendChild(c);
            t.appendChild(r);
        }
        //if its an action that takes no params at all set a min height
        else { t.style.height = '40px'; }
        
        //If this method has a option
        if (windmill.registry.methods[method].option != false) {
            var r = document.createElement("tr");
            r.id = action.id + 'optionRow';
            var c = document.createElement("td");
            c.style.fontWeight = "bold";
            
            if (windmill.browser.isIE) {
                c.innerHTML += '<br>Option: ';
            }
            else { c.innerHTML += 'Option: '; }
            r.appendChild(c);

            //Setup third select
            var s2 = document.createElement('select');
            s2.className = 'smalloption';
            s2.id = action.id + 'optionType';
            
            if (windmill.registry.methods[method].optionIsLocator){
              //for (loc in windmill.registry.locator){
              for (var loc = 0; loc < windmill.registry.locator.length;loc++){
                newOpt = document.createElement('option');
                newOpt.value = 'opt'+windmill.registry.locator[loc];
                newOpt.innerHTML =  windmill.registry.locator[loc];
                if (params[newOpt.value]){
                  newOpt.selected = 'selected';
                  windmill.ui.remote.optionValue = params[newOpt.value];
                }
                s2.appendChild(newOpt);
              }
            }
            //if the options are a comma delimited list, build the drop down
            else if (windmill.registry.methods[method].option.indexOf(',') != -1){
              var optArr = windmill.registry.methods[method].option.split(',');
              //for (opt in optArr){
              for (var opt = 0; opt < optArr.length; opt++){
                var newOpt = document.createElement('option');
                if (params[optArr[opt]]){
                  newOpt.selected = true;
                }
                newOpt.value = optArr[opt];
                newOpt.innerHTML = optArr[opt];
                s2.appendChild(newOpt);
              }
            }
            else{
              var o2 = document.createElement('option');
              if (typeof(windmill.registry.methods[method].option) != 'undefined') {
                  o2.value = windmill.registry.methods[method].option;
              }
              o2.selected = 'selected';
              o2.innerHTML += windmill.registry.methods[method].option;
              s2.appendChild(o2);
            }
            //add the blank option
            /*var o2 = document.createElement('option');
            o2.value = '';
            o2.innerHTML += '';
            s2.appendChild(o2);*/

            //This will give you a list of all the possible options
            //Keeping this here unless I find a reason to put it back/use it	
            /*for(var i=0;i<windmill.registry.option.length;i++){
      	var o2 = document.createElement('option');
      	o2.value = windmill.registry.option[i];
      	o2.innerHTML += windmill.registry.option[i];
      	s2.appendChild(o2);
      }*/
            var c = document.createElement("td");
            c.colSpan = '3';
            c.appendChild(s2);
            r.appendChild(c);

            //Add the text box for the option
            var i1 = document.createElement('input');
            i1.name = 'optValue';
            i1.className = 'texta';
            //i1.size = '40';
            //i1.style.width = "100%";
            
            //if the action had a special flag, dragDropElemToElem
            if (windmill.ui.remote.optionValue != undefined){
              i1.setAttribute("value", windmill.ui.remote.optionValue);
              delete windmill.ui.remote.optionValue;
            }
            //for the commad delimited list of options case
            try{ //this was breaking when option is a bool instead of a string
              if (windmill.registry.methods[method].option.indexOf(',') != -1) {
                  var opts = windmill.registry.methods[method].option.split(',');
                  for (i = 0; i < opts.length; i++){
                    if (params[opts[i]]){
                      i1.setAttribute("value", params[opts[i]]);
                    }
                  }
              }
            }
            catch(err){}
            //for the single option case
            if (typeof(params[windmill.registry.methods[method].option]) != 'undefined') {
                i1.setAttribute("value", params[windmill.registry.methods[method].option]);
            }
            
            //give the value input an id
            i1.id = action.id + 'option';
            if (!windmill.browser.isIE6x) {
                i1.setAttribute('onFocus', 'windmill.ui.remote.setRemoteElemOption(\'' + i1.id + '\')');
                //i1.setAttribute('onClick', '$(\'' + i1.id + '\').focus();');                
            }
            c.appendChild(i1);
            r.appendChild(c);
            t.appendChild(r);
        }
        
        //stick the action in the IDE
        action.appendChild(t);
        if (windmill.browser.isIE) {
            action.innerHTML = t.innerHTML;
        }
        return action;

    }

};