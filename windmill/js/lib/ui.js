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
        
    //Needed to keep track of the old border for the dom explorer
    var domExplorerBorder  = null;
    //keeping track of the recorder state when a new page is loaded and wipes the document
    var recordState = false;
    
    this.donothing = function(){
	    return;
	}
	
    //Run code and manage its result
    this.Run = function(){
        
    	var jstext = windmill.remote.document.getElementById("jsrunner");
    	
    	var command_string = jstext.value;
    	var array_commands = command_string.split("\n")
    	//alert(array_commands[0]);
    	
    	//This loop works if there are multiple actions on a page
    	//But if involves page reloads since these are instantly
    	//dispatched it probably wont wait long enough to get UI elements
    	//Even with a wait command
    	for (var i=0;i<array_commands.length;i++)
        {
            if (array_commands[i]){
                result = true;
                var run_obj = eval('(' + array_commands[i] + ')');
                try{
                    if (run_obj.method.indexOf('.') != -1){
                        var mArray = run_obj.method.split(".");
                        result = windmill.controller[mArray[0]][mArray[1]](run_obj.params); 
                        }
                    else{ result = windmill.controller[run_obj.method](run_obj.params); }
                }
                catch (e) {
                     result = false;
                     windmill.ui.writeResult(run_obj.method + ' <font color="#FF0000">Method failed, '+ e +'</font>' );
                 }           
            	if (result == true){ windmill.ui.writeResult(run_obj.method + '<font color="#69d91f"><b> Succeeded.</b></font>' ); }
            }    
        }
	
    }

    //Clearing runner box
    this.clearJs = function(){
    	var jstext = windmill.remote.document.getElementById("jsrunner");
    	jstext.value = "";
    }
    
    //Toggle Pause
    this.toggleLoopButtonText = function(){
        var loopButton = windmill.remote.document.getElementById("loopButton");
        if (loopButton.value == "Loop Stopped"){
            loopButton.value = "Loop Running";
            
        }
        else{
            loopButton.value = "Loop Stopped";
        }
           
    }
    
    //Writing to the performance tab
    this.writePerformance = function(str){
        var resultsDiv = windmill.remote.document.getElementById("tab3");
        resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    this.writeStatus = function(str){
        windmill.remote.document.getElementById("runningStatus").innerHTML = str;
    }
    
    //Writing to the results tab
    this.writeResult = function(str){
        var resultsDiv = windmill.remote.document.getElementById("tab4");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    //Allowing the stopOnFailure switch to be controlled from the UI
    this.toggleBreak = function(){
        var breakCheckBox = windmill.remote.document.getElementById('toggleBreak');
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
            windmill.remote.document.getElementById("domExp").innerHTML = "ID: "+ e.target.id;  
        }
        else{
            windmill.remote.document.getElementById("domExp").innerHTML = "Name: "+ e.target.nodeName;  
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
     
     this.constructAction = function(method,locater,locValue,option,optValue){
         var d = document.createElement('div');
         var t = document.createElement('table');
         t.style.position = 'relative';
         t.style.border = '1px dashed #aaa';
         t.style.background = 'lightyellow';
         t.style.width = '100%';
         t.setAttribute("border", "0");
         t.setAttribute("cellspacing", "1");
         t.setAttribute("cellpadding", "0");

         var tr = document.createElement('tr');
         var td = document.createElement('td');
         var td0 = document.createElement('td');
         td0.setAttribute('valign', 'top');
         var td1 = document.createElement('td');
         //var td2 = document.createElement('td');
         
         //Setup first select
         var s = document.createElement('select');
         s.setAttribute('class', 'smalloption');
         
         //Setup default method
         var o = document.createElement('option');
             o.setAttribute("value", method);
             
             o.setAttribute("selected", 'selected');
             o.innerHTML += method;
             s.appendChild(o);
         
         //Setup an option
         avm = this.getContMethodsUI();
         
         for (x = 0; x < avm.length; x++){
             
             var o = document.createElement('option');
             o.setAttribute("value", avm[x]);
             o.innerHTML += avm[x];
             s.appendChild(o);
         }
         
         //Setup second select
         var s1 = document.createElement('select');
         s1.setAttribute('class', 'smalloption');
         
         //Setup an option
         //set the default
         if ((locater != '') && (locater != 'undefined')){
             var o1 = document.createElement('option');
             o1.setAttribute("value", locater);
             o1.setAttribute("selected", "selected");

             o1.innerHTML += locater;
             s1.appendChild(o1);
         }
         
         var o1 = document.createElement('option');
         o1.setAttribute("value", "id");
         o1.innerHTML += 'id';
         s1.appendChild(o1);
         
         var o1 = document.createElement('option');
         o1.setAttribute("value", "link");
         o1.innerHTML += 'link';
         s1.appendChild(o1);
         
         var o1 = document.createElement('option');
         o1.setAttribute("value", "xpath");
         o1.innerHTML += 'xpath';
         s1.appendChild(o1);
         
         var o1 = document.createElement('option');
         o1.setAttribute("value", "jsid");
         o1.innerHTML += 'jsid';
         s1.appendChild(o1);
        
         
         //Setup third select
         var s2 = document.createElement('select');
         s2.setAttribute('class', 'smalloption');
           if ((option != '') && (option != 'undefined')){
             var o2 = document.createElement('option');
             o2.setAttribute("value", option);
             o2.setAttribute("selected", "selected");

             o2.innerHTML += option;
             s2.appendChild(o2);
         }
         
         var o2 = document.createElement('option');
         o2.setAttribute("url", 'url');
         o2.innerHTML += 'url';
         s2.appendChild(o2);
         
         var o2 = document.createElement('seconds');
         o2.setAttribute("seconds", 'seconds');
         o2.innerHTML += 'seconds';
         s2.appendChild(o2);
         
         var o2 = document.createElement('option');
         o2.setAttribute("text", 'text');
         o2.innerHTML += 'text';
         s2.appendChild(o2);
         
         var o2 = document.createElement('option');
         o2.setAttribute("option", 'option');
         o2.innerHTML += 'option';
         s2.appendChild(o2);
         
         var o2 = document.createElement('option');
         o2.setAttribute("validator", 'validator');
         o2.innerHTML += 'validator';
         s2.appendChild(o2);
         
         var o2 = document.createElement('option');
         o2.setAttribute("destination", 'destination');
         o2.innerHTML += 'destination';
         s2.appendChild(o2);
         
         var o2 = document.createElement('option');
         o2.setAttribute("stopOnFailure", 'stopOnFailure');
         o2.innerHTML += 'stopOnFailure';
         s2.appendChild(o2);
         
         var o2 = document.createElement('option');
         o2.setAttribute("showRemote", 'showRemote');
         o2.innerHTML += 'showRemote';
         s2.appendChild(o2);
         
         //Add the option to the select
         s.appendChild(o);
         s1.appendChild(o1);
         s2.appendChild(o2);
         
         //add images to td
         var img1 = document.createElement('img');
         img1.setAttribute("src", "ide/img/play.png");
         img1.style.height = '15px';
         img1.style.width = '15px';

         var img2 = document.createElement('img');
         img2.setAttribute("src", "ide/img/trash.png");
         img2.style.height = '15px';
         img2.style.width = '15px';
         
         td.appendChild(img1);
         td.innerHTML += '<br>';
         td.appendChild(img2);
         
         //Append all the methods
         td0.appendChild(s);
         //td0.innerHTML += '<br>';
         td0.innerHTML += '&nbsp';
         
         switch (method){
            case (method = 'click'):
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';

                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 i.setAttribute('value', locValue);
                 td0.appendChild(i);
            break
            
            case (method = 'doubleClick'): 
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';
                 
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 i.setAttribute('value', locValue);
                 td0.appendChild(i);
            break
            
             case (method = 'type'): 
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';
                 
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');

                 i.setAttribute('size', 25);
                 i.setAttribute('value', locValue);
                 td0.appendChild(i);
         
                 td0.innerHTML += '<br>';
                 td0.appendChild(s2);
                 td0.innerHTML += '&nbsp';
                 
                 var i = document.createElement('input');
                 i.setAttribute('name', 'optValue');
                 i.setAttribute('class', 'texta');

                 i.setAttribute('size', 25);
                 i.setAttribute('value', optValue);
                 td0.appendChild(i);
            break
            
             case (method = 'radio'): 
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 i.setAttribute('value', locValue);
                 td0.appendChild(i);
         
            break
            
             case (method = 'check'): 
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 i.setAttribute('value', locValue);
                 td0.appendChild(i);
         
            break
             case (method = 'select'): 
       
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 i.setAttribute('value', locValue);
                 td0.appendChild(i);
         
                 td0.innerHTML += '<br>';
                 td0.appendChild(s2);
                 td0.innerHTML += '&nbsp';
                 var i = document.createElement('input');
                 i.setAttribute('name', 'optValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 i.setAttribute('value', optValue);
                 td0.appendChild(i);
            break
            
            default:
                 
                 td0.appendChild(s1);
                 td0.innerHTML += '&nbsp';
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 td0.appendChild(i);
         
                 td0.innerHTML += '<br>';
                 td0.appendChild(s2);
                 td0.innerHTML += '&nbsp';
                 var i = document.createElement('input');
                 i.setAttribute('name', 'locValue');
                 i.setAttribute('class', 'texta');
                 i.setAttribute('size', 25);
                 td0.appendChild(i);
             break
        }
         
         //Add the columns to the row
         tr.appendChild(td);
         tr.appendChild(td0);
         //tr.appendChild(td1);
         //tr.appendChild(td2);
         
         //Add the row to the table
         t.appendChild(tr);
         //Append the table to the div
         d.appendChild(t);
				
		 return d;
     }
     
     //write json to the remote from the click events
     this.writeJsonClicks = function(e){
         //console.log(e);
         //alert('now');
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
            if(e.type == 'dblclick'){
                windmill.remote.$("recordingSuite").appendChild(this.constructAction('doubleClick',locator, locValue));

            }
            else{
                 //console.log(e.target.parentNode);                 
                 if (windmill.remote.$("clickOn").checked == true){
                     windmill.remote.$("recordingSuite").appendChild(this.constructAction('click',locator, locValue));

                 }
                 else if ((e.target.onclick != null) || (locator == 'link') || (e.target.type == 'image')){
                    windmill.remote.$("recordingSuite").appendChild(this.constructAction('click',locator, locValue));
                }
          }
        }
         windmill.ui.scrollRecorderTextArea();

     }
     
     //Writing json to the remote for the change events
     this.writeJsonChange = function(e){
          //console.log(e);
          
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
          
          if (e.target.type == 'textarea'){
              windmill.remote.$("recordingSuite").appendChild(this.constructAction('type',locator, locValue, 'text', e.target.value));

          }
          else if (e.target.type == 'text'){
              windmill.remote.$("recordingSuite").appendChild(this.constructAction('type',locator, locValue, 'text', e.target.value));
          }
          else if (e.target.type == 'password'){
              windmill.remote.$("recordingSuite").appendChild(this.constructAction('type',locator, locValue, 'text', e.target.value));
          }
          else if(e.target.type == 'select-one'){
              windmill.remote.$("recordingSuite").appendChild(this.constructAction('select',locator, locValue, 'option', e.target.value));   
          }
          else if(e.target.type == 'radio'){
              windmill.remote.$("recordingSuite").appendChild(this.constructAction('radio',locator, locValue));
          }
          else if(e.target.type == "checkbox"){
              windmill.remote.$("recordingSuite").appendChild(this.constructAction('check',locator, locValue));    
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
         
         //Need to clear the ide, and stick in a new test suite
         var suite = windmill.remote.document.getElementById('recordingSuite');
         if (suite == null){
             var ide = windmill.remote.document.getElementById('ide');
             var suite = document.createElement('div');
             suite.setAttribute("id", 'recordingSuite');
             suite.style.width = "99%";
             suite.style.background = "lightblue";
             suite.style.overflow = 'hidden';
             suite.style.border = '1px solid black';
             suite.innerHTML = "<div><table style=\"font:9pt arial;\"><tr><td width=\"95%\"><strong>Suite </strong> recordingSuite</td><td><a href=\"#\" onclick=\"javascript:opener.windmill.xhr.toggleCollapse(\'recordingSuite\')\">[toggle]</a> </td></table></div>";
             ide.appendChild(suite);
        }
          
         fleegix.event.listen(windmill.testingApp.document, 'ondblclick', windmill.ui, 'writeJsonClicks');
         fleegix.event.listen(windmill.testingApp.document, 'onchange', windmill.ui, 'writeJsonChange');
         fleegix.event.listen(windmill.testingApp.document, 'onblur', windmill.ui, 'writeJsonChange');
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
                 fleegix.event.listen(iframeArray[i], 'onblur', windmill.ui, 'writeJsonChange');

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
         fleegix.event.unlisten(windmill.testingApp.document, 'onblur', windmill.ui, 'writeJsonChange');

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
                 fleegix.event.unlisten(iframeArray[i], 'onblur', windmill.ui, 'writeJsonClicks');

             }
             catch(error){ 
                windmill.ui.writeResult('There was a problem binding to one of your iframes, is it cross domain? Binding to all others.' + error);          
            }

         }
         
     }
     
     this.setRecState = function(){
         if (windmill.ui.recordState == true){
             windmill.ui.recordOn();
         }
     }
     
     //Handle key listeners for windmill remote shortcuts
     this.remoteKeyDown = function(e){
         
         //keyboard shortcut to run your recorded test
         if ((e.keyCode == 82) && (e.ctrlKey == true)){
             if (windmill.remote.document.getElementById('wmTest').value != ""){
                windmill.ui.sendPlayBack();
             }
         }
         
         //ctrl b, gets the action from the builder and adds it to the recorder
         if ((e.keyCode == 66) && (e.ctrlKey == true)){
            if (windmill.remote.document.getElementById('methodDD').value != ""){
                windmill.builder.addToRecorder();
            }    
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
    this.sendPlayBack = function (){
        var testArray = windmill.remote.document.getElementById('wmTest').value.split("\n");
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
          fleegix.xhr.doPost(resp, '/windmill-jsonrpc/', json_string);

    }
    
}