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

//Playback Functionality
//*********************************
windmill.ui.playback = new
function() {

    //Keep track of the status of the playback
    this.running = false;

    this.resetPlayBack = function() {
        if (($('runningStatus').innerHTML.indexOf('Waiting for tests...') != -1) && ($('playback').src.indexOf("img/playbackstop.png") != -1) && windmill.ui.playback.running) {
            $('playback').src = 'img/playback.png';
            windmill.ui.playback.running = false;

        }

    };
    this.setPlaying = function() {
        $('playback').src = 'img/playbackstop.png';
        windmill.ui.playback.running = true;

    };

    //Send the tests to be played back
    this.sendPlayBack = function(uuid, suiteOnly) {
        //Turn off explorers and recorder
        windmill.ui.recorder.recordOff();
        windmill.ui.domexplorer.domExplorerOff();
        windmill.ui.assertexplorer.assertExplorerOff();

        var appending = false;
        var testArray = [];

        //if we don't pass an action to start at just play them all
        if (!uuid && !suiteOnly) {
            appending = true;
        }

        //if we want to play them all in a provided suite
        if (!uuid && suiteOnly) {
            appending = true;
            var suites = new Array();
            suites.push('\n   ');
            suites.push($(suiteOnly));

        }

        //else play every suite in the IDE
        else {
            var suites = windmill.remote.$('ideForm').childNodes;
        }

        //default the nodeType to 1 (firefox)
        var s = 1;
        //In IE we start our iteration at 0, else 1 for the first suite
        if (suites[0].nodeType == 1) {
            var s = 0;

        }

        //Iterate through the entire IDE starting playback
        for (var i = s; i < suites.length; i++) {
            if (suites[i].hasChildNodes()) {
                for (var j = 1; j < suites[i].childNodes.length; j++) {
                    //if we hit the suite id, turn on appending
                    if (suites[i].childNodes[j].id == uuid) {
                        appending = true;

                    }
                    //if the playback starts at a specific action, check if we hit that point
                    if (appending == true) {
                        var actionObj = {};
                        actionObj.suite_name = suites[i].id;
                        actionObj.version = "0.1";

                        //If it wasn't a standard UI element
                        if (windmill.remote.$(suites[i].childNodes[j].id + 'params') != null) {
                            actionObj.method = windmill.remote.$(suites[i].childNodes[j].id + 'method').value;
                            actionObj.params = eval('(' + windmill.remote.$(suites[i].childNodes[j].id + 'params').value + ')');

                        }
                        //if its a standard UI element build the params
                        else {
                            var si = windmill.remote.$(suites[i].childNodes[j].id + 'method').selectedIndex;
                            actionObj.method = windmill.remote.$(suites[i].childNodes[j].id + 'method')[si].value;

                            var paramsObj = {};
                            paramsObj.uuid = suites[i].childNodes[j].id;

                            if (windmill.registry.methods[actionObj.method].locator) {
                                var si = windmill.remote.$(suites[i].childNodes[j].id + 'locatorType').selectedIndex;
                                paramsObj[windmill.remote.$(suites[i].childNodes[j].id + 'locatorType')[si].value] = windmill.remote.$(suites[i].childNodes[j].id + 'locator').value;

                            }
                            if (windmill.registry.methods[actionObj.method].option) {
                                var si = windmill.remote.$(suites[i].childNodes[j].id + 'optionType').selectedIndex;
                                paramsObj[windmill.remote.$(suites[i].childNodes[j].id + 'optionType')[si].value] = windmill.remote.$(suites[i].childNodes[j].id + 'option').value;

                            }

                            actionObj.params = paramsObj;

                        }

                        windmill.remote.$(suites[i].childNodes[j].id).style.background = 'lightyellow';
                        testArray.push(actionObj);

                    }

                    //if they don't want the play button for each action to cascade
                    //Just play that particular action, unless the big play button was hit
                    if ((windmill.remote.$('playCascade').checked == false) && (typeof(uuid) != 'undefined')) {
                        appending = false;

                    }

                }

            }

        }

        windmill.ui.recorder.recordOff();

        var respRun = function(str) {
            //setTimeout('windmill.remote.$(\'playback\').src = \'img/playback.png\'', 3000);
            windmill.ui.playback.running = true;

            //If one of the action playback buttons is clicked
            //and the action playback cascading is enabled
            //we need the user to be able to stop the playback while it's
            //cascading, so I check if thats the state and set change the image accordingly
            if ($('playCascade').checked) {
                $('playback').src = "img/playbackstop.png";

            }
            return true;

        }

        var json_object = new json_call('1.1', 'restart_test_run');
        var params_obj = {};
        params_obj.tests = testArray;
        json_object.params = params_obj;
        var json_string = fleegix.json.serialize(json_object)

        doCall = function() {
            var z = fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', json_string);

        }

        setTimeout('doCall()', 100);

    }

};