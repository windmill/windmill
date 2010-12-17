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

//Loader function
function Load() {
    $(
        '<div>' +
        '<p><img src="img/wlogo.png" alt="Windmill" /></p>' +
        '<p><img src="img/load_new.gif" alt="loading please wait" /></p>' +
        '</div>'
    )
    .attr('id', 'loading')
    .css({
        'position': 'absolute',
        'z-index': '1000',
        'text-align': 'center',
        'left': '40%',
        'top': '25%'
    })
    .appendTo('body');

    var remUrl = window.location.href.replace('start.html', 'remote.html');
    var remote = window.open(remUrl, 'windmill_Remote', 'width=567,height=600,toolbar=no,' + 
    'location=no,directories=no,status=yes,menubar=no,scrollbars=yes,copyhistory=no,resizable=yes');

    // FIXME: We are unable to determin if chrome blocked the popup.
// Reffrence: http://stackoverflow.com/questions/668286/detect-blocked-popup-in-chrome
    if (!remote) {
        alert('We detected a popup blocker, please disable it while ' + 
        'you are using Windmill as we load the UI in a popup window. This requires a reload of the page.');
    }

    setTimeout(function() {
        window.location = urlSTR;
    }, 3000);
}