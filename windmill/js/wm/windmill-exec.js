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
        //Set the app your testing
       windmill.testingApp = parent.frames['webapp'];
           
       if (windmill.showRemote == true){           
        windmill.remote = window.open('remote.html','windmill_Remote','width=465,height=500,toolbar=no,'+
        'location=no,directories=no,status=yes,menubar=no,scrollbars=yes,copyhistory=no,resizable=yes');
        
        if (!windmill.remote){
          alert('We detected a popup blocker, please disable it while you are using Windmill as we load the UI in a popup window.');
        }
       } 
      
       setTimeout("windmill.controller.continueLoop()", 4000);
       
}
