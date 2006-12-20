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

//Safari specific Controller functions

Controller.prototype.what = function() {
    alert('Safari');
} 

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
Controller.prototype.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
    return PageBot.prototype.locateElementById(identifier, inDocument, inWindow)
            || PageBot.prototype.locateElementByName(identifier, inDocument, inWindow)
            || null;
};

Controller.prototype.click = function(param_object){
       var element = this.lookup_dispatch(param_object);
       triggerMouseEvent(element, 'click', true);
};