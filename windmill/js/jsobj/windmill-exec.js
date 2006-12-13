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


//New code called to instantiate a browserbot and a selenium object to call directly
var windmillBot = null;
var windSel = null;
var selenium = null;


function Load(){
    windmillBot = new BrowserBot(this.window);
    windmill = new Selenium(windmillBot);
    timing = new TimeObj();
    
    
    //This is because there is still some code expecting this to exist
    selenium = new Selenium(windmillBot);
    
    //tabContainer = document.getElementById("tab1").parentNode;
	//tabContainer.style.border = "0px";
    
    //alert("blah");
    //windSel.doClick("xpath=//html/body/div/div/div[5]/div/div[3]/a");
    //windSel.doRefresh();
    //alert(Selenium.DEFAULT_TIMEOUT);   
    //Selenium.prototype.doClick("xpath=//html/body/div/div/div[5]/div/div[3]/a");
}
//Run function, allows one to call the function and execute code against the page.
function Run(code){
    
    try {
        var resp = eval(code);
    } 
    catch (error) {
        var resp = "Error";
    }
    
    return resp;
    
    //var windmillBot = new BrowserBot(this.window);
    //var windSel = new Selenium(windmillBot);
    //windSel.doRefresh();
}

function runJS(){
	var jstext = document.getElementById("jsrunner");
	result = Run(jstext.value);
	var resultsDiv = document.getElementById("tab4");
	
	if (result == true){
		resultsDiv.innerHTML = resultsDiv.innerHTML + "<br>" + 'Success';
	}
	else{
		resultsDiv.innerHTML = resultsDiv.innerHTML + "<br>" + 'No Response';
	}
	
	/*example's of code that can be input:
	windmill.doClick("xpath=//html/body/div/div/div[5]/div/div[3]/a");
	
	//Cosmo login page
	windmill.doType("id=loginDialogUsernameInput", "test");
	windmill.doType("id=loginDialogPasswordInput", "test");
	
	//Clicking on links, however there is a problem still with the server accessing some dialogs in cosmo
	windmill.doClick("link=Click here to create one.");
	windmill.doClick("link=Create an Account");
	
	*/
}

function clearJS(){
	var jstext = document.getElementById("jsrunner");
	jstext.value = "";
}