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
    
    //This is because there is still some code expecting this to exist
    selenium = new Selenium(windmillBot);
    
    
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
    } catch (error) {
    var resp = "Error";
    }
    
    return resp;
    
    //var windmillBot = new BrowserBot(this.window);
    //var windSel = new Selenium(windmillBot);
    //windSel.doRefresh();
}
