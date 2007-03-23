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
//Mozilla specific functionality abstracted to mozController.js
//Safari specific functionality abstracted to safController.js
//IE specific functionality abstracted to ieController.js

//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the Controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.

function UI() {
    
    this.donothing = function(){
	    return;
	}
    //Run code and manage its result
    this.Run = function(){
        
    	var jstext = Windmill.Remote.document.getElementById("jsrunner");
    	
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

        	    result = Windmill.Controller[run_obj.method](run_obj.params); 
            
                //setTimeout("Windmill.UI.donothing()", 5000);
            
            	if (result == true){
            		Windmill.UI.writeResult(run_obj.method + '<font color="#69d91f"><b> Succeeded.</b></font>' );
            	}
            	else{
            		Windmill.UI.writeResult(run_obj.method + ' <font color="#FF0000">Failed.</font>' );
                }
            }    
        }
    	/*var run_obj = eval('(' + jstext.value + ')');
    
	    result = Windmill.Controller[run_obj.method](run_obj.params); 
        
    	if (result == true){
    		Windmill.UI.writeResult('Success');
    	}
    	else{
            Windmill.UI.writeResult('Failure');    	
        }*/
	
    }

    //Clearing runner box
    this.clearJs = function(){
    	var jstext = Windmill.Remote.document.getElementById("jsrunner");
    	jstext.value = "";
    }
    
    //Toggle Pause
    this.toggleLoopButtonText = function(){
        var loopButton = Windmill.Remote.document.getElementById("loopButton");
        if (loopButton.value == "Loop Stopped"){
            loopButton.value = "Loop Running";
            
        }
        else{
            loopButton.value = "Loop Stopped";
        }
           
    }
    
    //Writing to the performance tab
    this.writePerformance = function(str){
        var resultsDiv = Windmill.Remote.document.getElementById("tab3");
        resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    this.writeStatus = function(str){
        Windmill.Remote.document.getElementById("runningStatus").innerHTML = str;
    }
    
    //Writing to the results tab
    this.writeResult = function(str){
        var resultsDiv = Windmill.Remote.document.getElementById("tab4");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }
    
    //Allowing the stopOnFailure switch to be controlled from the UI
    this.toggleBreak = function(){
        var breakCheckBox = Windmill.Remote.document.getElementById('toggleBreak');
        if (breakCheckBox.checked){
            Windmill.stopOnFailure = true;
        }
        else{
            Windmill.stopOnFailure = false;
        }
    }

}