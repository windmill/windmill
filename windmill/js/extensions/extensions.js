/*
Copyright 2006, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

//Author: Adam Christian, Open Source Applications Foundation
//Email: adam@osafoundation.org
//
//Description: The following function allows a selenium test to accurately move an event DIV
//to a destination time/day using the Cosmo UI objects to calculate and compensate for
//The relative DIV offsets
//
//Since the div names are a concatonation of their hash key and a prepending string
//I will just recreate that before I actually look up the dom element, then click
//the appropriate element

windmill.controller.extensions.clickLozenge =function (param_object){
    var hash_key;

    eval ("hash_key=" + param_object.jsid + ";");
    //hash_key = eval('('+ param_object.jsid + ')');
    param_object.id = "eventDivContent__" + hash_key;
    delete param_object.jsid;

    //Since id comes before jsid in the lookup order
    //we don't need to reset it, now go ahead and click it!
    return this.click(param_object);
};


windmill.controller.extensions.cosmoDragDrop = function (p){

    var param = p || {};
    var dragged = param.dragged;
    var dest = param.destination;
    var app = windmill.testingApp;

    dragged.id = dragged.pfx + eval(dragged.jsid);
    // Delete the jsid to force lookup by regular id
    delete dragged.jsid;
    dragged = windmill.controller._lookupDispatch(dragged);
    dest = windmill.controller._lookupDispatch(dest);

    // Bail out if no drag elem or destination
    if (!dragged || !dest) {
        return false;
    }
    // Offsets to convert abs XY pos to local pos on canvas
    var vOff = app.TOP_MENU_HEIGHT +
        app.ALL_DAY_RESIZE_AREA_HEIGHT +
        app.DAY_LIST_DIV_HEIGHT +
        app.ALL_DAY_RESIZE_HANDLE_HEIGHT -
        app.cosmo.view.cal.canvas.getTimedCanvasScrollTop();
    var hOff = app.LEFT_SIDEBAR_WIDTH +
        app.HOUR_LISTING_WIDTH + 12;

    var mouseDownX = dragged.parentNode.offsetLeft + hOff;
    var mouseDownY = dragged.parentNode.offsetTop + vOff;

    var mouseUpX = dest.parentNode.offsetLeft + hOff;
    var mouseUpY = dest.offsetTop + vOff;

    windmill.events.triggerMouseEvent(app.document.body,
        'mousemove', true, mouseDownX, mouseDownY);
    windmill.events.triggerMouseEvent(dragged,
        'mousedown', true);
    windmill.events.triggerMouseEvent(app.document.body,
        'mousemove', true, mouseUpX, mouseUpY);
    windmill.events.triggerMouseEvent(dragged,
        'mouseup', true);
        return true;
};


