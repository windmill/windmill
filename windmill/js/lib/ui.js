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
    var domExplorerBorder = null;
    //keeping track of the recorder state when a new page is loaded and wipes the document
    var recordState       = false;
    var recordSuiteNum    = 0;
    var selectedElement   = null;

    //Setter, incremeneting the recordSuiteNum
    this.incRecSuite = function(){
      recordSuiteNum ++;
    }
    //Toggle Pause Loop
    this.toggleLoopButtonText = function(){
      var loopButton = windmill.remote.$("loopButton");
      if (loopButton.value == "Loop Stopped"){
        loopButton.value = "Loop Running"; 
      }
      else{ loopButton.value = "Loop Stopped"; }    
    }
    
    //Allowing the stopOnFailure switch to be controlled from the UI
    this.toggleBreak = function(){
        var breakCheckBox = windmill.remote.$('toggleBreak');
        if (breakCheckBox.checked){
            windmill.stopOnFailure = true;
        }
        else{
            windmill.stopOnFailure = false;
        }
    }
    this.getContMethodsUI = function(){
       var str = '';
           for (var i in windmill.controller) { if (i.indexOf('_') == -1){ str += "," + i; } }
           for (var i in windmill.controller.extensions) {
               if (str) { str += ',' }
               str += 'extensions.'+i;
           }
           for (var i in windmill.controller.commands) {
               if (str) { str += ',' }
               str += 'commands.'+i;
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
    
    //Functions for writing status to the UI
    /***************************************/
    
    //Writing to the performance tab
    this.writePerformance = function(str){
      var resultsDiv = windmill.remote.$("tab3");
      resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
    }
    
    this.writeStatus = function(str){
      windmill.remote.$("runningStatus").innerHTML = str;
    }
    
    //Writing to the results tab
    this.writeResult = function(str){
        var resultsDiv = windmill.remote.$("tab4");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    //Functions for interacting with the remote
    /***************************************/

    this.scrollRecorderTextArea = function() {
         var obj=windmill.remote.$("ide");
         obj.scrollTop=obj.scrollHeight;
    }
    
    //Display the id in the remote
    this.setIdInRemote = function(e){
        //console.log  (e);
        if(e.target.id != ""){
            windmill.remote.$("domExp").innerHTML = "ID: "+ e.target.id;  
        }
        else{
            windmill.remote.$("domExp").innerHTML = "Name: "+ e.target.nodeName;  
        }
        this.domExplorerBorder = e.target.style.border;
        e.target.style.border = "1px solid yellow";
    }
 
    this.clearIDE = function(){
      input_box=windmill.remote.confirm("Are you sure you want to delete all the data in the IDE?");
      if (input_box==true) {
        fleegix.fx.fadeOut(windmill.remote.$('ide'));
        d = function(){ 
        windmill.remote.$('ide').innerHTML = '';
        windmill.ui.recordOff();
        fleegix.fx.fadeIn(windmill.remote.$('ide'));  
        }
       setTimeout("d()",800);
      }
     }
     
     this.methodChange = function(id){
         var selected  = windmill.remote.$(id+'method').selectedIndex;
         var methodObj = windmill.remote.$(id+'method');
         var method    = methodObj[selected].value;
         var newAction = this.buildAction(method,{'uuid':id});
         windmill.remote.$(id).innerHTML = newAction.innerHTML;
         
         //safari hack for resizing the suite div to accomodate the new action
         windmill.remote.$(id).style.height = '';
     }
     
     this.setRemoteElem = function(id){
       selectedElement = id;
     }
     
     this.addActionAbove = function(uuid){
      var newAction = this.buildAction(null, {});
      var parent = windmill.remote.$(uuid).parentNode;
      parent.insertBefore(newAction, windmill.remote.$(uuid));
      //IE hack
      windmill.remote.$(newAction.id).innerHTML = newAction.innerHTML;
      fleegix.fx.fadeIn(windmill.remote.$(newAction.id));
     }
     this.addActionBelow = function(uuid){
      var newAction = this.buildAction(null,{});      
      var parent = windmill.remote.$(uuid).parentNode;
      parent.insertBefore(newAction, windmill.remote.$(uuid).nextSibling);
      //IE Hack
      windmill.remote.$(newAction.id).innerHTML = newAction.innerHTML;
      fleegix.fx.fadeIn(windmill.remote.$(newAction.id));
     }
     this.deleteAction = function(uuid){
      input_box=windmill.remote.confirm("Are you sure you want to continue deleting?");
      if (input_box==true) {
        fleegix.fx.fadeOut(windmill.remote.$(uuid));
        d = function(){ 
        var pElement = windmill.remote.$(uuid).parentNode;
        pElement.removeChild(windmill.remote.$(uuid));
       }
       setTimeout("d()",800);
      }
     }
     
     this.addAction = function(action){
       var suite = this.getSuite();
       if (typeof(action) == 'undefined'){
         var action = this.buildAction(null,{})
       }
       //A hack to make it draw the UI correctly in IE
       suite.appendChild(action);
       windmill.remote.$(action.id).innerHTML = action.innerHTML; 
     }
        
     this.getSuite = function(){
       var suite = windmill.remote.$('recordingSuite'+recordSuiteNum);
       if (suite == null){
           var ide = windmill.remote.$('ide');
           suite = windmill.remote.document.createElement('div');
           suite.id = 'recordingSuite' + recordSuiteNum;
           suite.style.width = "99%";
           suite.style.background = "lightblue";
           suite.style.overflow = 'hidden';
           //suite.style.height='40px';
           suite.style.border = '1px solid black';
           suite.innerHTML = "<div style='width:100%'><table style='width:100%;font:12px arial;'><tr><td><strong>Suite </strong>"+suite.id+
           "</td><td><span align=\"right\" style='top:0px;float:right;'><a href=\"#\" onclick=\"windmill.ui.saveSuite(\'"+suite.id+
           "\')\">[save]</a>&nbsp<a href=\"#\" onclick=\"windmill.ui.deleteAction(\'"+suite.id+
           "\')\">[delete]</a>&nbsp<a href=\"#\" onclick=\"javascript:opener.windmill.xhr.toggleCollapse(\'"+suite.id+
           "\')\">[toggle]</a></span></td></tr></table></div>";
           windmill.remote.$('ide').appendChild(suite);
      }
      return suite;
     }

    
    //Send the suite to save to the backend and receive an url for the user to save
    this.saveSuite = function(id){
       var suite = windmill.remote.$(id);
       var testArray = [];

       if (suite.hasChildNodes()){
            for (var j = 1; j < suite.childNodes.length; j++){
                //console.log(suites[i].childNodes[j].id);
                
                var actionObj = {};
                actionObj.suite_name = suite.id;
                actionObj.version = "0.1";
                var si = windmill.remote.$(suite.childNodes[j].id+'method').selectedIndex;
                actionObj.method = windmill.remote.$(suite.childNodes[j].id+'method')[si].value;

                var paramsObj = {};
                paramsObj.uuid = suite.childNodes[j].id;
                
                if (windmill.registry.methods[actionObj.method].locator){
                  var si = windmill.remote.$(suite.childNodes[j].id+'locatorType').selectedIndex;
                  paramsObj[windmill.remote.$(suite.childNodes[j].id+'locatorType')[si].value] = windmill.remote.$(suite.childNodes[j].id+'locator').value;
                }
                if (windmill.registry.methods[actionObj.method].option){
                  var si = windmill.remote.$(suite.childNodes[j].id+'optionType').selectedIndex;
                  paramsObj[windmill.remote.$(suite.childNodes[j].id+'optionType')[si].value] = windmill.remote.$(suite.childNodes[j].id+'option').value;
                }
                actionObj.params = paramsObj;
                //var str = fleegix.json.serialize(actionObj);
                testArray.push(actionObj);
            }
            
         var respRun = function(str){
             response = eval('(' + str + ')');
             window.open(response.result,'Saved Test','width=400,height=600,toolbar=yes,location=no,directories=no,status=no,menubar=yes,scrollbars=yes,copyhistory=no,resizable=yes')
             return true;
         }
   
         //Get the language to save these suckers in
         var langSI = windmill.remote.$('suiteSaveFormat').selectedIndex;
         var lang = windmill.remote.$('suiteSaveFormat')[langSI].value;
         
         var json_object = new windmill.xhr.json_call('1.1', 'create_save_file');
         var params_obj = {};
         params_obj.transformer = lang;
         params_obj.suite_name  = id;
         params_obj.tests       = testArray;
         json_object.params     = params_obj;

         var json_string = fleegix.json.serialize(json_object)
         fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', json_string);
            
        }
        else {
            windmill.remote.alert('You need test actions to save!');
        }
    }
     //This function takes a method and it's params and returns a DOM
     //Element representing that action for the UI
     this.buildAction = function(method, params){
         //if we just want a blank action
         //default to type for now so everything gets displayed
         if (method == null){
            method = 'click';
            params.id = ' ';

         }

         //var action = this.constructAction(method,'','',windmill.registry.methods[method].option,parms[windmill.registry.methods[method].option]);
         var action = windmill.remote.document.createElement('div');
         if (typeof(params.uuid) == 'undefined'){
          var date = new Date();
          action.id = date.getTime();
         }
         else{ action.id = params.uuid; }
         action.style.position   = 'relative';
         action.style.border     = '1px dashed #aaa';
         action.style.background = 'lightyellow';
         action.style.width      = '100%';

         //action.style.height = '50px';
         
         //in the case that the method we are passsing in isn't in the registry, we can still display it
         //just without all the interactive UI elements
         if ((windmill.registry.methods[method] == null) || (method == 'complex')){
            var t = windmill.remote.document.createElement('table');
            t.border      = "0";
            t.cellspacing = "1";
            t.cellpadding = "0";
            t.style.font  = "10px arial";
            t.style.width = "100%";  
            //console.log(fleegix.json.serialize(params));
            var r = windmill.remote.document.createElement("tr");
            var c = windmill.remote.document.createElement("td"); 
            c.style.width = '95%';
            //c.innerHTML += '<input type="text" class="texta" size="35" id="'+action.id+'method" value="'+ method +'"/>';
            var i0 = windmill.remote.document.createElement("input");
            i0.type      = 'text';
            i0.id        = action.id+'method';
            i0.className = 'texta';
            i0.size      = '35';
            i0.value     = method;
            c.appendChild(i0);
            //This makes it look better in IE
            c.innerHTML += '<br>';
            //c.innerHTML += '<input type="text" class="texta" size="55" id="'+action.id+'params" value="'+ fleegix.json.serialize(params).replace( /"/g, '\'' ); +'"/>';
            var i = windmill.remote.document.createElement("input");
            i.type      = 'text';
            i.id        = action.id+'params';
            i.className = 'texta';
            i.size      = '55';

            i.value = fleegix.json.serialize(params);
            
            c.appendChild(i);
            r.appendChild(c);
            var c = windmill.remote.document.createElement("td"); 
            c.innerHTML += '<a onclick="this.addActionAbove(\''+action.id+
            '\')" href="#">Above</a><br><a onclick="this.addActionBelow(\''+action.id+
            '\')" href="#">Below</a></span>';
            r.appendChild(c);

            
            var c = windmill.remote.document.createElement("td"); 
            c.innerHTML += '<a alt="Start Playback" href="#"><img border=0 onclick="windmill.ui.sendPlayBack(\''+action.id+
            '\')" style="height:18px;width:18px;" src="ide/img/play.png"></a><a alt="Delete Action" href="#">'+
            '<img border=0 onclick="windmill.ui.deleteAction(\''+action.id+'\')" style="height:18px;width:18px;" '+
            'src="ide/img/trash.png"></a>';
            
            r.appendChild(c);
            t.appendChild(r);
            
            action.appendChild(t);
            return action;
         }
         
         //We need a table to format this
         var t = windmill.remote.document.createElement('table');
         t.border      = "0";
         t.cellspacing = "1";
         t.cellpadding = "0";
         t.style.font  = "10px arial";

         
         var r = windmill.remote.document.createElement("tr");
         var c = windmill.remote.document.createElement("td");         
         
         c.innerHTML += 'Method: ';
         r.appendChild(c);
         //Setup the method drop down
             var s = windmill.remote.document.createElement('select');
             s.className = 'smalloption';
             s.style.font = '13px arial';
             s.id = action.id + 'method';
             //Setup default method
             var o = windmill.remote.document.createElement('option');
                 o.value = method;
                 o.selected = 'selected';
                 o.innerHTML += method;
                 s.appendChild(o);
            
            //Setup methods option  
             for (var m in windmill.registry.methods){
             
                 var o = windmill.remote.document.createElement('option');
                 o.value = m;
                 o.innerHTML += m;
                 s.appendChild(o);
             }
            s.setAttribute("onchange","windmill.ui.methodChange('"+action.id+"');");

             var c = windmill.remote.document.createElement("td");
             c.colSpan = "3";
             c.appendChild(s);
             r.appendChild(c);
    
        var spn = windmill.remote.document.createElement('span');
        spn.style.position  = 'absolute';
        spn.style.left   = '95%';
        spn.style.zindex = '10';
        spn.style.font   = '10px arial';

        
        
        spn.innerHTML += '<a alt="Start Playback" href="#"><img border=0 onclick="windmill.ui.sendPlayBack(\''+action.id+
        '\')" style="height:18px;width:18px;" src="ide/img/play.png"></a><a alt="Delete Action" href="#">'+
        '<img border=0 onclick="windmill.ui.deleteAction(\''+action.id+'\')" style="height:18px;width:18px;" '+
        'src="ide/img/trash.png"></a>';
        
        var spn2 = windmill.remote.document.createElement('span');
        spn2.style.position = 'absolute';
        spn2.style.left   = '85%';
        spn2.style.bottom = '2px';
        spn2.style.zindex = '10';
        spn2.style.font   = '10px arial';
        spn2.innerHTML += '<a onclick="windmill.ui.addActionAbove(\''+action.id+
        '\')" href="#">Above</a><br><a onclick="windmill.ui.addActionBelow(\''+action.id+
        '\')" href="#">Below</a></span>';
        
        var c = windmill.remote.document.createElement("td"); 
        c.appendChild(spn);
        c.appendChild(spn2);
        r.appendChild(c);
        t.appendChild(r);

         //If this method needs a locator
         if ( windmill.registry.methods[method].locator){
             var r = windmill.remote.document.createElement("tr");
             r.id = action.id+'locatorRow';
             var c = windmill.remote.document.createElement("td"); 
             c.innerHTML += 'Locater: ';
             r.appendChild(c);
             
             var locator = null;
             
             if (params['id']){ locator    = 'id'; }
             if (params['jsid']){ locator  = 'jsid'; }
             if (params['name']){ locator  = 'name'; }
             if (params['link']){ locator  = 'link'; }
             if (params['xpath']){ locator = 'xpath'; }

           
            //Setup second select
             var s1 = windmill.remote.document.createElement('select');
             s1.className = 'smalloption';
             s1.id = action.id+'locatorType';
             
             var o1 = windmill.remote.document.createElement('option');
             o1.selected = 'selected';
             if (locator){ 
               o1.value = locator;
               o1.innerHTML += locator; 
             }
             s1.appendChild(o1);
             
             for(var i=0;i<windmill.registry.locator.length;i++){
               var o1 = windmill.remote.document.createElement('option');
               o1.value = windmill.registry.locator[i];
               o1.innerHTML += windmill.registry.locator[i];
               s1.appendChild(o1);
             }
             
             var c = windmill.remote.document.createElement("td"); 
             c.appendChild(s1);
             r.appendChild(c);

             //Add the text box
              var i0 = windmill.remote.document.createElement('input');
                 i0.name      = 'locValue';
                 i0.className = 'texta';
                 i0.size      = '35';
                 //Dont know why I have to do this.. but it wont work if its not setattrib
                 if (params[locator]){
                   i0.setAttribute('value',params[locator]);
                 }
                 i0.id        = action.id + 'locator';   
                 i0.setAttribute('onFocus', 'windmill.ui.setRemoteElem(\''+i0.id+'\')');

               var c = windmill.remote.document.createElement("td"); 
               c.appendChild(i0);
               r.appendChild(c);
               t.appendChild(r);
             }
            
            //If this method has a option
            if (windmill.registry.methods[method].option != false){
             var r = windmill.remote.document.createElement("tr");
             r.id = action.id+'optionRow';
             var c = windmill.remote.document.createElement("td");  
             c.innerHTML += 'Option: ';
             r.appendChild(c);
             
             //Setup third select
             var s2= windmill.remote.document.createElement('select');
             s2.className = 'smalloption';
             s2.id = action.id+'optionType';
             
             var o2 = windmill.remote.document.createElement('option');
             if (typeof(windmill.registry.methods[method].option) != 'undefined'){
               o2.value = windmill.registry.methods[method].option;
             }
             o2.selected = 'selected';
             o2.innerHTML += windmill.registry.methods[method].option;
             s2.appendChild(o2);
             
             for(var i=0;i<windmill.registry.option.length;i++){
               var o2 = windmill.remote.document.createElement('option');
               o2.value = windmill.registry.option[i];
               o2.innerHTML += windmill.registry.option[i];
               s2.appendChild(o2);
              }
              var c = windmill.remote.document.createElement("td");  
              c.appendChild(s2);
              r.appendChild(c);
              
             //Add the text box
             var i1 = windmill.remote.document.createElement('input');
                 i1.name      = 'optValue';
                 i1.className = 'texta';
                 i1.size      = '35';
                 if (typeof(params[windmill.registry.methods[method].option]) != 'undefined'){
                   i1.value     = params[windmill.registry.methods[method].option];
                 }
                 i1.id        = action.id + 'option';
                 i1.setAttribute('onFocus', 'windmill.ui.setRemoteElem(\''+i1.id+'\')');


             var c = windmill.remote.document.createElement("td");  
             c.appendChild(i1);
             r.appendChild(c);
             t.appendChild(r);
            }
            
           action.appendChild(t);
           //action.innerHTML = t.innerHTML;
           return action; 
     }
     
     //Recorder Functionality
     //*********************************/
          
     this.setRecState = function(){
       if (this.recordState == true){
         this.recordOn();
       }
     }
     //write json to the remote from the click events
     this.writeJsonClicks = function(e){
         if( this.recordState == false){ return; }
         
         var locator = '';
         var locValue = '';
         if (e.target.id != ""){
            locator = 'id';
            locValue = e.target.id;
         }
         else if (e.target.name != ""){
            locator = 'name';
            locValue = e.target.name;
         }
         else if (e.target.innerHTML.match('href') != 'null'){
            locator = 'link';
            locValue = e.target.innerHTML.replace(/(<([^>]+)>)/ig,"");
            locValue = locValue.replace("\n", "");
         }
         else{
             locator = 'Couldnt Detect';
             locValue = 'Couldnt Detect';
         } 
         if (locValue != ""){
            var params = {};
            params[locator] = locValue;
            
            if(e.type == 'dblclick'){
                this.addAction(this.buildAction('doubleClick', params));
            }
            else{
                 //console.log(e.target.parentNode);                 
                 if (windmill.remote.$("clickOn").checked == true){
                     this.addAction(this.buildAction('click', params));
                 }
                 else if ((e.target.onclick != null) || (locator == 'link') || (e.target.type == 'image')){
                    this.addAction(this.buildAction('click', params));
                }
          }
        }
         this.scrollRecorderTextArea();

     }
     
     //Writing json to the remote for the change events
     this.writeJsonChange = function(e){          
       
           if( this.recordState == false){ return; }
           var locator = '';
           var locValue = '';
           if (e.target.id != ""){
              locator = 'id';
              locValue = e.target.id;
           }
           else if (e.target.name != ""){
              locator = 'name';
              locValue = e.target.nodeName;
           }
           else{
            locator = 'Couldnt Detect';
            locValue = 'Couldnt Detect';
           }
          
          var params = {};
          params[locator] = locValue;

          if (e.target.type == 'textarea'){
              params['text'] = e.target.value;
              this.addAction(this.buildAction('type', params));

          }
          else if (e.target.type == 'text'){
              params['text'] = e.target.value;
              this.addAction(this.buildAction('type', params));
          }
          else if (e.target.type == 'password'){
              params['text'] = e.target.value;
              this.addAction(this.buildAction('type', params));
          }
          else if(e.target.type == 'select-one'){
              params['option'] = e.target.value;
              this.addAction(this.buildAction('select', params));   
          }
          else if(e.target.type == 'radio'){
              this.addAction(this.buildAction('radio', params));
          }
          else if(e.target.type == "checkbox"){
              this.addAction(this.buildAction('check', params));    
          }
          
          this.scrollRecorderTextArea();

      }
      
      //Turn on the recorder
     //Since the click event does things like firing twice when a double click goes also
     //and can be obnoxious im enabling it to be turned off and on with a toggle check box
     this.recordOn = function(){
        
         //Turn off the listeners so that we don't have multiple attached listeners for the same event
         this.recordOff();
         //keep track of the recorder state, for page refreshes
         this.recordState = true;
         this.getSuite();
         
         //IE's onChange support doesn't bubble so we have to manually
         //Attach a listener to every select and input in the app
         if (windmill.browser.isIE != false){
           var inp = windmill.testingApp.document.getElementsByTagName('input');
           for (var i = 0; i < inp.length; i++) { 
              fleegix.event.listen(inp[i], 'onchange', this, 'writeJsonChange');
           }
           var se = windmill.testingApp.document.getElementsByTagName('select');
           for (var i = 0; i < se.length; i++) { 
              fleegix.event.listen(se[i], 'onchange', this, 'writeJsonChange');
           }
         }
         
         fleegix.event.listen(windmill.testingApp.document, 'ondblclick', this, 'writeJsonClicks');
         fleegix.event.listen(windmill.testingApp.document, 'onchange', this, 'writeJsonChange');
         //fleegix.event.listen(windmill.testingApp.document, 'onblur', this, 'writeJsonChange');
         fleegix.event.listen(windmill.testingApp.document, 'onclick', this, 'writeJsonClicks');

         //We need to set these listeners on all iframes inside the testing app, per bug 32
         var iframeCount = windmill.testingApp.window.frames.length;
         var iframeArray = windmill.testingApp.window.frames;
         
         for (var i=0;i<iframeCount;i++)
         {
             try{
                 fleegix.event.listen(iframeArray[i], 'ondblclick', this, 'writeJsonClicks');
                 fleegix.event.listen(iframeArray[i], 'onchange', this, 'writeJsonChange');
                 fleegix.event.listen(iframeArray[i], 'onclick', this, 'writeJsonClicks');
                 //fleegix.event.listen(iframeArray[i], 'onblur', this, 'writeJsonChange');

            }
            catch(error){             
                this.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);     
            }
         }
     }
     
     this.recordOff = function(){
         this.recordState = false;
         
          //IE's onChange support doesn't bubble so we have to manually
         //Attach a listener to every select and input in the app
         if (windmill.browser.isIE != false){
           var inp = windmill.testingApp.document.getElementsByTagName('input');
           for (var i = 0; i < inp.length; i++) { 
              fleegix.event.unlisten(inp[i], 'onchange', this, 'writeJsonChange');
           }
           var se = windmill.testingApp.document.getElementsByTagName('select');
           for (var i = 0; i < se.length; i++) { 
              fleegix.event.unlisten(se[i], 'onchange', this, 'writeJsonChange');
           }
         }
         fleegix.event.unlisten(windmill.testingApp.document, 'ondblclick', this, 'writeJsonClicks');
         fleegix.event.unlisten(windmill.testingApp.document, 'onchange', this, 'writeJsonChange');
         fleegix.event.unlisten(windmill.testingApp.document, 'onclick', this, 'writeJsonClicks');
         //fleegix.event.unlisten(windmill.testingApp.document, 'onblur', this, 'writeJsonChange');

         //fleegix.event.unlisten(windmill.testingApp.document, 'onmousedown', this, 'writeJsonDragDown');
         //fleegix.event.unlisten(windmill.testingApp.document, 'onmouseup', this, 'writeJsonDragUp');
         
          //We need to disable these listeners on all iframes inside the testing app, per bug 32
         var iframeCount = windmill.testingApp.window.frames.length;
         var iframeArray = windmill.testingApp.window.frames;
         
         for (var i=0;i<iframeCount;i++)
         {
            try{
               fleegix.event.unlisten(iframeArray[i], 'ondblclick', this, 'writeJsonClicks');
               fleegix.event.unlisten(iframeArray[i], 'onchange', this, 'writeJsonChange');
               fleegix.event.unlisten(iframeArray[i], 'onclick', this, 'writeJsonClicks');
               //fleegix.event.unlisten(iframeArray[i], 'onblur', this, 'writeJsonClicks');
           }
           catch(error){ 
              this.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);          
          }
         }      
     }
    
    //Playback Functionality
    //*********************************
    
    //Send the tests to be played back
    this.sendPlayBack = function (uuid){
      
      var appending = false;
      if (typeof(uuid) == 'undefined'){ appending = true; }

      var testArray = [];
      var suites = windmill.remote.$('ide').childNodes;
      
        for (var i = 1; i < suites.length; i++){
          if (suites[i].hasChildNodes()){
              for (var j = 1; j < suites[i].childNodes.length; j++){
                  //if we hit the suite id, turn on appending
                  if (suites[i].childNodes[j].id == uuid){
                    appending = true;
                  }
                  //if the playback starts at a specific action, check if we hit that point
                  if (appending == true){
                    var actionObj = {};
                    actionObj.suite_name = suites[i].id;
                    actionObj.version = "0.1";
                
                    //If it wasn't a standard UI element, then I stuck the params in a div
                    if (windmill.remote.$(suites[i].childNodes[j].id+'params') != null){
                     actionObj.method = windmill.remote.$(suites[i].childNodes[j].id+'method').value;
                     actionObj.params = eval('('+windmill.remote.$(suites[i].childNodes[j].id+'params').value + ')'); 
                    }
                    //if its a standard UI element build the params
                    else {
                      var si = windmill.remote.$(suites[i].childNodes[j].id+'method').selectedIndex;
                      actionObj.method = windmill.remote.$(suites[i].childNodes[j].id+'method')[si].value;

                      var paramsObj = {};
                      paramsObj.uuid = suites[i].childNodes[j].id;
                
                      if (windmill.registry.methods[actionObj.method].locator){
                        var si = windmill.remote.$(suites[i].childNodes[j].id+'locatorType').selectedIndex;
                        paramsObj[windmill.remote.$(suites[i].childNodes[j].id+'locatorType')[si].value] = windmill.remote.$(suites[i].childNodes[j].id+'locator').value;
                      }
                      if (windmill.registry.methods[actionObj.method].option){
                        var si = windmill.remote.$(suites[i].childNodes[j].id+'optionType').selectedIndex;
                        paramsObj[windmill.remote.$(suites[i].childNodes[j].id+'optionType')[si].value] = windmill.remote.$(suites[i].childNodes[j].id+'option').value;
                      }
                
                      actionObj.params = paramsObj;
                     }
                  
                      windmill.remote.$(suites[i].childNodes[j].id).style.background = 'lightyellow';
                      //testArray.push(fleegix.json.serialize(actionObj));
                      testArray.push(actionObj);
                  }
                  
                   //if they don't want the play button for each action to cascade
                  //Just play that particular action, unless the big play button was hit
                  if ((windmill.remote.$('playCascade').checked == false) && (typeof(uuid) != 'undefined')){
                    appending = false;
                  }
              }
          }
        }
     alert(testArray.length);
     this.recordOff();
          
     //console.log(testArray);    
     var respRun = function(str){
         setTimeout('windmill.remote.$(\'playback\').src = \'ide/img/playback.png\'', 3000);
         return true;
     }
    
     var json_object = new windmill.xhr.json_call('1.1', 'restart_test_run');
     var params_obj = {};
     params_obj.tests = testArray;
     json_object.params = params_obj;
     var json_string = fleegix.json.serialize(json_object)
     
     doCall = function(){
       fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', json_string);
     }
     
     setTimeout('doCall()', 500);

  }
  
    //DOM Explorer Functions
    /***************************************/
    
    //Reset the border to what it was before the mouse over
    this.resetBorder = function(e){
        e.target.style.border = '';
        e.target.style.border = this.domExplorerBorder;
    }
    
    this.explorerClick = function(e){
      	windmill.remote.window.focus();
        if (selectedElement != null){
         windmill.remote.$(selectedElement).value =  windmill.remote.$("domExp").innerHTML.replace('ID: ','').replace('Name: ','');
        }
    }
    
    //Set the listeners for the dom explorer
    this.domExplorerOn = function(){
        //fleegix.event.listen(windmill.testingApp.document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseout', this, 'resetBorder');
        fleegix.event.listen(windmill.testingApp.document, 'onclick', this, 'explorerClick');
        
    }
    
    //Remove the listeners for the dom explorer
    this.domExplorerOff = function(){
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseover', this, 'setIdInRemote');
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseout', this, 'resetBorder');
         fleegix.event.unlisten(windmill.testingApp.document, 'onclick', this, 'explorerClick');
         
         //Reset the selected element
         selectedElement = null;

    }     

    
};