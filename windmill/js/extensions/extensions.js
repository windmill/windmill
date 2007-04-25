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
    
    windmill.controller.extensions.clickLozenge =function(param_object){
        var hash_key;
        
        eval ("hash_key=" + param_object.jsid + ";");
        //hash_key = eval('('+ param_object.jsid + ')');
        param_object.id = "eventDivContent__" + hash_key;
        delete param_object.jsid;
        
        //Since id comes before jsid in the lookup order
        //we don't need to reset it, now go ahead and click it!
        return this.click(param_object);    
    }
    
    
    windmill.controller.extensions.cosmoDragDrop = function(param_object){
        
       
         var p = param_object;
         var hash_key;
         
         eval ("hash_key=" + p.dragged.jsid + ";");
         p.dragged.id = p.dragged.pfx+ hash_key;
         delete p.dragged.jsid;
                 
                function getPos(elem, evType) {
                         // param_object.mouseDownPos or param_obj.mouseUpPos
                         var t = evType + 'Pos';
                         var res = [];
                         // Explicit function for getting XY of both
                         // start and end position for drag  start 
                         // to be calculated from the initial pos of the
                         // dragged, and end to be calculated from the
                         // position of the destination
                         if (p[t]) {
                             var f = eval(p[t]);
                             res = f(elem);
                         }
                         // Otherwise naively assume top/left XY for both
                         // start (dragged) and end (destination)
                         else {
                                res = [elem.offsetLeft, elem.offsetTop];
                         }
           
                        return res;
                    }
                    
        
            var dragged = windmill.controller._lookupDispatch(p.dragged);
            var dest = windmill.controller._lookupDispatch(p.destination);
            //var mouseDownPos = getPos(dragged, 'mouseDown');
            //var mouseUpPos = getPos(dest, 'mouseUp');
        
            var webApp = parent.frames['webapp'];
            var mouseDownX = dragged.parentNode.offsetLeft + (webApp.LEFT_SIDEBAR_WIDTH + webApp.HOUR_LISTING_WIDTH + 2) + 12; 
            var mouseDownY = dragged.parentNode.offsetTop - (webApp.cosmo.view.cal.canvas.getTimedCanvasScrollTop() - webApp.TOP_MENU_HEIGHT) + 12;
        
            var webApp = parent.frames['webapp'];
            var mouseUpX = dest.parentNode.offsetLeft + (webApp.LEFT_SIDEBAR_WIDTH + webApp.HOUR_LISTING_WIDTH + 2) + 12; 
            var mouseUpY = dest.offsetTop - (webApp.cosmo.view.cal.canvas.getTimedCanvasScrollTop() - webApp.TOP_MENU_HEIGHT) + 12; 
            
            var webApp = parent.frames['webapp'];
            windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseDownX, mouseDownY);
            windmill.events.triggerMouseEvent(dragged, 'mousedown', true);
            windmill.events.triggerMouseEvent(webApp.document.body, 'mousemove', true, mouseUpX, mouseUpY);
            windmill.events.triggerMouseEvent(dragged, 'mouseup', true);
            
            return true;
    }
    
  