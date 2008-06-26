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

//Functionality that works for every browser
//Mozilla specific functionality abstracted to mozcontroller.js
//Safari specific functionality abstracted to safcontroller.js
//IE specific functionality abstracted to iecontroller.js
//The reason for this is that the start page only includes the one corresponding
//to the current browser, this means that the functionality in the controller
//object is only for the current browser, and there is only one copy of the code being
//loaded into the browser for performance.

windmill.ui = new
function() {
    var _this = this;
    //Needed to keep track of the old border for the dom explorer
    //keeping track of the recorder state when a new page is loaded and wipes the document
    this.recordSuiteNum = 0;

    //Setter, incremeneting the recordSuiteNum
    this.incRecSuite = function() {
        this.recordSuiteNum++;

    }

    this.toggleCollapse = function(id) {
        if ($(id).style.height == '18px') {
            $(id).style.height = '';

        }
        else {
            $(id).style.height = '18px';
        }

    };

    //Allowing the stopOnFailure switch to be controlled from the UI
    this.toggleBreak = function() {
        var breakCheckBox = $('toggleBreak');
        if (breakCheckBox.checked) {
            windmill.stopOnFailure = true;

        }
        else {
            windmill.stopOnFailure = false;

        }

    }
    this.getContMethodsUI = function() {
        var str = '';
        for (var i in windmill.controller) {
            if (i.indexOf('_') == -1) {
                str += "," + i;
            }
        }
        for (var i in windmill.controller.extensions) {
            if (str) {
                str += ','
            }
            str += 'extensions.' + i;

        }
        for (var i in windmill.controller.commands) {
            if (str) {
                str += ','
            }
            str += 'commands.' + i;

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


};