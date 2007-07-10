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
    //this.self = this;
    //Needed to keep track of the old border for the dom explorer
    var domExplorerBorder  = null;
    //keeping track of the recorder state when a new page is loaded and wipes the document
    var recordState = false;
    this.recordSuiteNum = 0;
    
    this.donothing = function(){
	    return;
	}
    
    //Toggle Pause
    this.toggleLoopButtonText = function(){
        var loopButton = windmill.remote.$("loopButton");
        if (loopButton.value == "Loop Stopped"){
            loopButton.value = "Loop Running";
            
        }
        else{
            loopButton.value = "Loop Stopped";
        }
           
    }
    
    //Writing to the performance tab
    this.writePerformance = function(str){
        var resultsDiv = windmill.remote.$("tab3");
        resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
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
    
    //Display the id in the remote
    this.setIdInRemote = function(e){
        //console.log  (e);
        if(e.target.id != ""){
            windmill.remote.$("domExp").innerHTML = "ID: "+ e.target.id;  
        }
        else{
            windmill.remote.$("domExp").innerHTML = "Name: "+ e.target.nodeName;  
        }
        windmill.ui.domExplorerBorder = e.target.style.border;
        e.target.style.border = "1px solid yellow";
    }
    
    //Reset the border to what it was before the mouse over
    this.resetBorder = function(e){
        e.target.style.border = '';
        e.target.style.border = windmill.ui.domExplorerBorder;
    }
    
    //Set the listeners for the dom explorer
    this.domExplorerOn = function(){
        //fleegix.event.listen(windmill.testingApp.document, 'onmouseover', windmill.ui, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseover', windmill.ui, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseout', windmill.ui, 'resetBorder');
        
    }
    
    //Remove the listeners for the dom explorer
    this.domExplorerOff = function(){
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseover', windmill.ui, 'setIdInRemote');
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseout', windmill.ui, 'resetBorder');
    }
     
       this.scrollRecorderTextArea = function() {
         var obj=windmill.remote.$("ide");
         obj.scrollTop=obj.scrollHeight;
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
     
     this.methodChange = function(id){
         var selected = windmill.remote.$(id+'method').selectedIndex;
         var methodObj = windmill.remote.$(id+'method');
         var method = methodObj[selected].value;
         var newAction = windmill.ui.buildAction(method,{'uuid':id});
         windmill.remote.$(id).innerHTML = newAction.innerHTML;
     }
     
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
         action.style.position = 'relative';
         action.style.border = '1px dashed #aaa';
         action.style.background = 'lightyellow';
         action.style.width = '100%';
         //action.style.height = '50px';
         
         //We need a table to format this
         var t = document.createElement('table');
         t.border = "0";
         t.cellspacing = "1";
         t.cellpadding = "0";
         t.style.font = "10px arial";
         
         var r = document.createElement("tr");
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
             for (var m in windmill.registry.methods){
             
                 var o = document.createElement('option');
                 o.value = m;
                 o.innerHTML += m;
                 s.appendChild(o);
             }
            s.setAttribute("onchange","windmill.ui.methodChange('"+action.id+"');");

             var c = document.createElement("td");
             c.colSpan = "3";
             c.appendChild(s);
             r.appendChild(c);
    
        var spn = document.createElement('span');
        spn.style.position = 'absolute';
        spn.style.left = '95%';
        spn.style.zindex = '10';
        spn.style.font = '10px arial';
        
        
        spn.innerHTML += '<a alt="Start Playback" href="#"><img border=0 onclick="windmill.ui.sendPlayBack(\''+action.id+
        '\')" style="height:18px;width:18px;" src="ide/img/play.png"></a><a alt="Delete Action" href="#"><img border=0 onclick="windmill.ui.deleteAction(\''+action.id+
        '\')" style="height:18px;width:18px;" src="ide/img/trash.png"></a>';
        
        var spn2 = document.createElement('span');
        spn2.style.position = 'absolute';
        spn2.style.left = '85%';
        spn2.style.bottom = '2px';
        spn2.style.zindex = '10';
        spn2.style.font = '10px arial';
        spn2.innerHTML += '<a onclick="windmill.ui.addActionAbove(\''+action.id+'\')" href="#">Above</a><br><a onclick="windmill.ui.addActionBelow(\''+action.id+
        '\')" href="#">Below</a></span>';
        
        var c = document.createElement("td"); 
        c.appendChild(spn);
        c.appendChild(spn2);
        r.appendChild(c);
        t.appendChild(r);

         //If this method needs a locator
         if ( windmill.registry.methods[method].locator){
             var r = document.createElement("tr");
             r.id = action.id+'locatorRow';
             var c = document.createElement("td"); 
             c.innerHTML += 'Locater: ';
             r.appendChild(c);
             
             var locator = null;
             
             if (params['id']){ locator = 'id'; }
             if (params['jsid']){ locator = 'jsid'; }
             if (params['name']){ locator = 'name'; }
             if (params['link']){ locator = 'link'; }
             if (params['xpath']){ locator = 'xpath'; }
           
            //Setup second select
             var s1 = document.createElement('select');
             s1.className = 'smalloption';
             var o1 = document.createElement('option');
             o1.value = locator;
             o1.selected = 'selected';
             o1.innerHTML += locator;
             s1.appendChild(o1);
             
             for(var i=0;i<windmill.registry.locator.length;i++){
               var o1 = document.createElement('option');
               o1.value = windmill.registry.locator[i];
               o1.innerHTML += windmill.registry.locator[i];
               s1.appendChild(o1);
             }
             
             var c = document.createElement("td"); 
             c.appendChild(s1);
             r.appendChild(c);

             //Add the text box
             var i0 = document.createElement('input');
                 i0.name = 'locValue';
                 i0.className = 'texta';
                 i0.size ='35';
                 //Dont know why I have to do this.. but it wont work if its not setattrib
                 i0.setAttribute('value',params[locator]);
             
             i0.id = action.id + 'locator';   
             var c = document.createElement("td"); 
             c.appendChild(i0);
             r.appendChild(c);
             t.appendChild(r);
             }
            
            //If this method has a option
            if (windmill.registry.methods[method].option != false){
             var r = document.createElement("tr");
             r.id = action.id+'optionRow';
             var c = document.createElement("td");  
             c.innerHTML += 'Option: ';
             r.appendChild(c);
             
             //Setup third select
             var s2= document.createElement('select');
             s2.className = 'smalloption';
             var o2 = document.createElement('option');
             o2.value = windmill.registry.methods[method].option;
             o2.selected = 'selected';
             o2.innerHTML += windmill.registry.methods[method].option;
             s2.appendChild(o2);
             
             for(var i=0;i<windmill.registry.option.length;i++){
               var o2 = document.createElement('option');
               o2.value = windmill.registry.option[i];
               o2.innerHTML += windmill.registry.option[i];
               s2.appendChild(o2);
              }
              var c = document.createElement("td");  
              c.appendChild(s2);
              r.appendChild(c);
              
             //Add the text box
             var i1 = document.createElement('input');
                 i1.name = 'optValue';
                 i1.className = 'texta';
                 i1.size ='35';
                 i1.value = params[windmill.registry.methods[method].option];
                 
             i1.id = action.id + 'option';
             var c = document.createElement("td");  
             c.appendChild(i1);
             r.appendChild(c);
             t.appendChild(r);
            }
            
           //action.appendChild(t);
           action.innerHTML = t.innerHTML;
           return action; 
     }
     
     this.addActionAbove = function(uuid){
      var newAction = this.buildAction(null, {});
      var parent = windmill.remote.$(uuid).parentNode;
      parent.insertBefore(newAction, windmill.remote.$(uuid));
      fleegix.fx.fadeIn(windmill.remote.$(newAction.id));
     }
     this.addActionBelow = function(uuid){
      var newAction = this.buildAction(null,{});      
      var parent = windmill.remote.$(uuid).parentNode;
      parent.insertBefore(newAction, windmill.remote.$(uuid).nextSibling);   
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
     
     //write json to the remote from the click events
     this.writeJsonClicks = function(e){
         //console.log(e);
         //alert('now');
         if( windmill.ui.recordState == false){
                return;
         }
         
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
                windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('doubleClick', params));
            }
            else{
                 //console.log(e.target.parentNode);                 
                 if (windmill.remote.$("clickOn").checked == true){
                     windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('click', params));

                 }
                 else if ((e.target.onclick != null) || (locator == 'link') || (e.target.type == 'image')){
                    
                    windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('click', params));
                }
          }
        }
         windmill.ui.scrollRecorderTextArea();

     }
     
     //Writing json to the remote for the change events
     this.writeJsonChange = function(e){
          //console.log(e);
          
            if( windmill.ui.recordState == false){
                return;
            }

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
              windmill.remote.$("recordingSuite").appendChild(this.buildAction('type', params));

          }
          else if (e.target.type == 'text'){
              params['text'] = e.target.value;
              windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('type', params));
          }
          else if (e.target.type == 'password'){
              params['text'] = e.target.value;
              windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('type', params));
          }
          else if(e.target.type == 'select-one'){
              params['option'] = e.target.value;
              windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('select', params));   
          }
          else if(e.target.type == 'radio'){
              windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('radio', params));
          }
          else if(e.target.type == "checkbox"){
              windmill.remote.$("recordingSuite"+windmill.ui.recordSuiteNum).appendChild(this.buildAction('check', params));    
          }
          
          windmill.ui.scrollRecorderTextArea();

      }
      
      //Turn on the recorder
     //Since the click event does things like firing twice when a double click goes also
     //and can be obnoxious im enabling it to be turned off and on with a toggle check box
     this.recordOn = function(){
        
         //Turn off the listeners so that we don't have multiple attached listeners for the same event
         windmill.ui.recordOff();
         //keep track of the recorder state, for page refreshes
         windmill.ui.recordState = true;
         windmill.ui.getSuite();
          
         fleegix.event.listen(windmill.testingApp.document, 'ondblclick', windmill.ui, 'writeJsonClicks');
         fleegix.event.listen(windmill.testingApp.document, 'onchange', windmill.ui, 'writeJsonChange');
         //fleegix.event.listen(windmill.testingApp.document, 'onblur', windmill.ui, 'writeJsonChange');
         fleegix.event.listen(windmill.testingApp.document, 'onclick', windmill.ui, 'writeJsonClicks');

         //We need to set these listeners on all iframes inside the testing app, per bug 32
         var iframeCount = windmill.testingApp.window.frames.length;
         var iframeArray = windmill.testingApp.window.frames;
         
         for (var i=0;i<iframeCount;i++)
         {
             try{
                 fleegix.event.listen(iframeArray[i], 'ondblclick', windmill.ui, 'writeJsonClicks');
                 fleegix.event.listen(iframeArray[i], 'onchange', windmill.ui, 'writeJsonChange');
                 fleegix.event.listen(iframeArray[i], 'onclick', windmill.ui, 'writeJsonClicks');
                 //fleegix.event.listen(iframeArray[i], 'onblur', windmill.ui, 'writeJsonChange');

            }
            catch(error){             
                windmill.ui.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);     
            }
         }
     }
     
     
     this.recordOff = function(){
         windmill.ui.recordState = false;
         fleegix.event.unlisten(windmill.testingApp.document, 'ondblclick', windmill.ui, 'writeJsonClicks');
         fleegix.event.unlisten(windmill.testingApp.document, 'onchange', windmill.ui, 'writeJsonChange');
         fleegix.event.unlisten(windmill.testingApp.document, 'onclick', windmill.ui, 'writeJsonClicks');
         //fleegix.event.unlisten(windmill.testingApp.document, 'onblur', windmill.ui, 'writeJsonChange');

         //fleegix.event.unlisten(windmill.testingApp.document, 'onmousedown', windmill.ui, 'writeJsonDragDown');
         //fleegix.event.unlisten(windmill.testingApp.document, 'onmouseup', windmill.ui, 'writeJsonDragUp');
         
          //We need to disable these listeners on all iframes inside the testing app, per bug 32
         var iframeCount = windmill.testingApp.window.frames.length;
         var iframeArray = windmill.testingApp.window.frames;
         
         for (var i=0;i<iframeCount;i++)
         {
             try{
                 fleegix.event.unlisten(iframeArray[i], 'ondblclick', windmill.ui, 'writeJsonClicks');
                 fleegix.event.unlisten(iframeArray[i], 'onchange', windmill.ui, 'writeJsonChange');
                 fleegix.event.unlisten(iframeArray[i], 'onclick', windmill.ui, 'writeJsonClicks');
                 //fleegix.event.unlisten(iframeArray[i], 'onblur', windmill.ui, 'writeJsonClicks');

             }
             catch(error){ 
                windmill.ui.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);          
            }
         }      
     }
     
     this.addAction = function(){
       var suite = windmill.ui.getSuite();
       windmill.remote.$(suite.id).appendChild(windmill.ui.buildAction(null,{})); 
     }
     this.getSuite = function(){
         var suite = windmill.remote.$('recordingSuite'+windmill.ui.recordSuiteNum);
         if (suite == null){
             var ide = windmill.remote.$('ide');
             suite = windmill.remote.document.createElement('div');
             suite.id = 'recordingSuite' + windmill.ui.recordSuiteNum;
             suite.style.width = "99%";
             suite.style.background = "lightblue";
             suite.style.overflow = 'hidden';
             suite.style.border = '1px solid black';
             suite.innerHTML = "<div style='width:100%'><table style='width:100%;font:12px arial;'><tr><td><strong>Suite </strong>"+suite.id+
             "</td><td><span align=\"right\" style='top:0px;float:right;'><a href=\"#\" onclick=\"windmill.ui.deleteAction(\'"+suite.id+
             "\')\">[delete]</a>&nbsp<a href=\"#\" onclick=\"javascript:opener.windmill.xhr.toggleCollapse(\'"+suite.id+
             "\')\">[toggle]</a></span></td></tr></table></div>";
             windmill.remote.$('ide').appendChild(suite);
        }
        return suite;
     }
     
     this.setRecState = function(){
         if (windmill.ui.recordState == true){
             windmill.ui.recordOn();
         }
     }
     
     //Quickly bring the remote to focus
     this.testingAppKeyListener = function(e){
          
          if ((e.keyCode == 68) && (e.ctrlKey == true)){
                windmill.remote.alert('Dom Explorer Off');
                windmill.ui.domExplorerOff();
            }
            if ((e.keyCode == 82) && (e.ctrlKey == true)){
                windmill.remote.alert('Here I am!');
               
            }
    }
    
    //Send the tests to be played back
    this.sendPlayBack = function (uuid){
      
      if (typeof(uuid) == 'undefined'){
        var uuid = windmill.remote.$('ide').childNodes[1].id;
      }
      
      /*  var testArray = windmill.remote.document.getElementById('wmTest').value.split("\n");
        if (testArray[testArray.length-1] == ""){ 
            testArray.pop();
        }
        
        windmill.ui.recordOff();
          
          var resp = function(str){
        
             var respRun = function(str){
                 return true;
             }
               
             var json_object = new windmill.xhr.json_call('1.1', 'run_json_tests');
             var params_obj = {};
             params_obj.tests = testArray;
             json_object.params = params_obj;
             var json_string = fleegix.json.serialize(json_object)
             fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', json_string);
 
          }
          
          var json_object = new windmill.xhr.json_call('1.1', 'clear_queue');
          var params_obj = {};
          json_object.params = params_obj;
          var json_string = fleegix.json.serialize(json_object)
          json_string = json_string.replace('\\', '');
          fleegix.xhr.doPost(resp, '/windmill-jsonrpc/', json_string); */

    }
    
}