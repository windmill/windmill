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


//Loader function
function Load(){
    
    //Instantiate the windmill object
    Windmill = new windmill_main(browser);

}

//Run function, allows one to call the function and execute code against the page.
function Run(code){
    var resp = eval(code);
/*    try {
        var resp = eval(code);
    } 
    catch (error) {
        var resp = "Error";
    }
    
    return resp;
    */
    //var windmillBot = new BrowserBot(this.window);
    //var windSel = new Selenium(windmillBot);
    //windSel.doRefresh();
}

//Run code and manage its result
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
	
}

//Clearing runner box
function clearJS(){
	var jstext = document.getElementById("jsrunner");
	jstext.value = "";
}