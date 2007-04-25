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
    
    this.donothing = function(){
	    return;
	}
    //Run code and manage its result
    this.Run = function(){
        
    	var jstext = windmill.Remote.document.getElementById("jsrunner");
    	
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
                
                var run_obj = eval('(' + array_commands[i] + ')');
                
                if (run_obj.method.indexOf('.') != -1){
                    var mArray = run_obj.method.split(".");
                    result = windmill.controller[mArray[0]][mArray[1]](run_obj.params);  
                }
                else{ result = windmill.controller[run_obj.method](run_obj.params); }
                            
            	if (result == true){ windmill.ui.writeResult(run_obj.method + '<font color="#69d91f"><b> Succeeded.</b></font>' ); }
            	else{ windmill.ui.writeResult(run_obj.method + ' <font color="#FF0000">Failed.</font>' ); }
            }    
        }
	
    }

    //Clearing runner box
    this.clearJs = function(){
    	var jstext = windmill.Remote.document.getElementById("jsrunner");
    	jstext.value = "";
    }
    
    //Toggle Pause
    this.toggleLoopButtonText = function(){
        var loopButton = windmill.Remote.document.getElementById("loopButton");
        if (loopButton.value == "Loop Stopped"){
            loopButton.value = "Loop Running";
            
        }
        else{
            loopButton.value = "Loop Stopped";
        }
           
    }
    
    //Writing to the performance tab
    this.writePerformance = function(str){
        var resultsDiv = windmill.Remote.document.getElementById("tab3");
        resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    this.writeStatus = function(str){
        windmill.Remote.document.getElementById("runningStatus").innerHTML = str;
    }
    
    //Writing to the results tab
    this.writeResult = function(str){
        var resultsDiv = windmill.Remote.document.getElementById("tab4");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    //Allowing the stopOnFailure switch to be controlled from the UI
    this.toggleBreak = function(){
        var breakCheckBox = windmill.Remote.document.getElementById('toggleBreak');
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
            windmill.Remote.document.getElementById("domExp").innerHTML = "ID: "+ e.target.id;  
        }
        else{
            windmill.Remote.document.getElementById("domExp").innerHTML = "Name: "+ e.target.nodeName;  
        }
        e.target.style.border = "1px solid yellow";
    }
    
    //Reset the border to what it was before the mouse over
    this.resetBorder = function(e){
        e.target.style.border = "";
    }
    
    //Set the listeners for the dom explorer
    this.domExplorerOn = function(){
        //fleegix.event.listen(windmill.testingApp.document, 'onmouseover', windmill.ui, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseover', blah);
        fleegix.event.listen(windmill.testingApp.document, 'onmouseout', windmill.ui, 'resetBorder');   
    }
    
    //Remove the listeners for the dom explorer
    this.domExplorerOff = function(){
           fleegix.event.unlisten(windmill.testingApp.document, 'onmouseover', windmill.ui, 'setIdInRemote');
           fleegix.event.unlisten(windmill.testingApp.document, 'onmouseout', windmill.ui, 'resetBorder');
    }
     
     this.scrollRecorderTextArea = function() {
         var obj=windmill.Remote.document.getElementById("wmTest");
         obj.scrollTop=obj.scrollHeight;
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
            locValue = e.target.nodeName;
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
                windmill.Remote.document.getElementById("wmTest").value = windmill.Remote.document.getElementById("wmTest").value + '{"method": "doubleClick", "params":{"'+locator+'": "'+locValue+'"}}\n';
            }
            else{
                 windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "'+e.type+'", "params":{"'+locator+'": "'+locValue+'"}}\n';
            }
            windmill.ui.scrollRecorderTextArea();
        }
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
              windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "type", "params":{"'+locator+'": "'+locValue+'","text": "'+e.target.value+'"}}\n';  
          }
          else if (e.target.type == 'text'){
              windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "type", "params":{"'+locator+'": "'+locValue+'","text": "'+e.target.value+'"}}\n';
            
          }
          else if(e.target.type == 'select-one'){
              windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "select", "params":{"'+locator+'": "'+locValue+'","option": "'+e.target.value+'"}}\n';   
          }
          else if(e.target.type == 'radio'){
              windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "radio", "params":{"'+locator+'": "'+locValue+'"}}\n';  
          }
          else if(e.target.type == "checkbox"){
              windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "check", "params":{"'+locator+'": "'+locValue+'"}}\n';       
          }
          
          windmill.ui.scrollRecorderTextArea();

      }
     
     this.writeJsonDragDown = function(e){
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
        //console.log(e);
      
        //windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '{"method": "dragDrop", "params": {"dragged" : {"'+locator+'": "'+locValue+'"},'; 
    }
     
     this.writeJsonDragUp = function(e){
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
         //console.log(e);
         //windmill.Remote.document.getElementById("wmTest").value =  windmill.Remote.document.getElementById("wmTest").value + '"destination": {"'+locator+'": "'+locValue+'"}, "mouseDownPos": "Insert your custom dragged function here.", "mouseUpPos": "Insert your custom dest function here." }}\n';
          
      }
     
     //Turn on the recorder
     //Since the click event does things like firing twice when a double click goes also
     //and can be obnoxious im enabling it to be turned off and on with a toggle check box
     this.recordOn = function(){
         
         //Turn off the listeners so that we don't have multiple attached listeners for the same event
         windmill.ui.recordOff();
         
         if (windmill.Remote.document.getElementById("dragOn").checked){       
             fleegix.event.listen(windmill.testingApp.document, 'onmousedown', windmill.ui, 'writeJsonDragDown');
             fleegix.event.listen(windmill.testingApp.document, 'onmouseup', windmill.ui, 'writeJsonDragUp');
         }
         else{
             fleegix.event.listen(windmill.testingApp.document, 'ondblclick', windmill.ui, 'writeJsonClicks');
             fleegix.event.listen(windmill.testingApp.document, 'onchange', windmill.ui, 'writeJsonChange');
         
             if (windmill.Remote.document.getElementById("clickOn").checked){    
                 fleegix.event.listen(windmill.testingApp.document, 'onclick', windmill.ui, 'writeJsonClicks');
             }
         }
     }
     
     this.recordOff = function(){
         fleegix.event.unlisten(windmill.testingApp.document, 'ondblclick', windmill.ui, 'writeJsonClicks');
         fleegix.event.unlisten(windmill.testingApp.document, 'onchange', windmill.ui, 'writeJsonChange');
         fleegix.event.unlisten(windmill.testingApp.document, 'onclick', windmill.ui, 'writeJsonClicks');
         fleegix.event.unlisten(windmill.testingApp.document, 'onmousedown', windmill.ui, 'writeJsonDragDown');
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseup', windmill.ui, 'writeJsonDragUp');
         
     }
     

}