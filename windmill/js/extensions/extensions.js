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

//Author: Adam Christian, Open Source Applications Foundation
//Email: adam@osafoundation.org
//
//Description: The following function allows a selenium test to accurately move an event DIV
//to a destination time/day using the Cosmo UI objects to calculate and compensate for
//The relative DIV offsets
//
//Example html Selenium test table:
//<tr>
//	<td>store</td>
//	<td>javascript{this.browserbot.getCurrentWindow().Cal.eventRegistry.getFirst().id}</td>
//	<td>did</td>
//</tr>
//<tr>
//	<td>dragdropDivCosmo</td>
//	<td>id=eventDivContent__${did}</td>
//	<td>id=hourDiv4-1200</td>
//</tr>
/*Selenium.prototype.doDragdropDivCosmo = function(origlocator, destlocator) {
    
    //Get originating coordinates for the event
    var element = this.page().findElement(origlocator)
    var eStartXY = getClientXY(element)
    var eStartX = eStartXY[0];
    var eStartY = eStartXY[1];
    
    //Click on it, so the Draggable object is insantiated and becomes accessable via Cal.dragElem
    triggerMouseEvent(element, 'mousedown', true, eStartX, eStartY);

    //Calculate the start drag using the x and y calendar offsets
    var eStartX = (eStartX + this.browserbot.getCurrentWindow().Cal.dragElem.clickOffsetX);
    var eStartY = (eStartY + this.browserbot.getCurrentWindow().Cal.dragElem.clickOffsetY);
    
    //Get destination div x,y coordinates
    var destelement = this.page().findElement(destlocator)
    var dStartXY = getClientXY(destelement)
    
    //Adjust for offsets, the offsets were both still off by increments of 150 and 50, so I correct this here.
    //(There is probably a better way to do this, but this was the best hack I could make work reliably.)
    //This breaks when the X value when the browser canvas is significantly shrunk because the dest div size shrinks
    //This will be fixed after the merge code is given to QA
    var dStartX = (dStartXY[0] + this.browserbot.getCurrentWindow().Cal.dragElem.clickOffsetX - 100 - this.browserbot.getCurrentWindow().cosmo.view.cal.canvas.dayUnitWidth);
    var dStartY = (dStartXY[1] + this.browserbot.getCurrentWindow().Cal.dragElem.clickOffsetY - 50);
    //this.browserbot.getCurrentWindow().cosmo.view.cal.canvas.dayUnitWidth
    
    //Calculate the actual distance the x and y needs to move
    var xVal = Math.abs(dStartX - eStartX);
    var yVal = Math.abs(dStartY - eStartY);
    
    //Default both to moving negatively
    var Xdir = "-";
    var Ydir = "-";
    
    //Default the increment direction
    var movementXincrement = -1;
    var movementYincrement = -1;
    
    //Set coordinate pos/neg for X
    if (dStartX > eStartX) {
        Xdir = "+";
        movementXincrement = 1;
    }
    
    //Set coordinate pos/neg for Y
    if (dStartY > eStartY) {
        Xdir = "+";
        movementYincrement = 1;
    }
    
    //Prepare to move the cursor (starting place)
    var clientX = eStartX;
    var clientY = eStartY;
    
    //Prepare to move to destination
    var clientFinishX = dStartX;
    var clientFinishY = dStartY;
       
       //While loop to actually move the mouse cursor
       while ((clientX != clientFinishX) || (clientY != clientFinishY)) {
       	if (clientX != clientFinishX) {
       		    //Set incremented X coord
       		    clientX += movementXincrement;
            }
       	if (clientY != clientFinishY) {
       	        //Set incremented Y coord
       		    clientY += movementYincrement;
            }
            //Move the mouse to the new coordinates
            triggerMouseEvent(element, 'mousemove', true, clientX, clientY);
        }
        
    //Mouseup in the final resting place for the event
    triggerMouseEvent(element, 'mouseup',   true, clientFinishX, clientFinishY);
    
}
*/
//Author: Adam Christian, Open Source Applications Foundation
//Email: adam@osafoundation.org
//
//Description: The following is the equivalent of a wrapper, this allows me to use:
//<tr>
//	<td>storeId</td>
//	<td>first</td>
//	<td>did</td>
//</tr>
//
//When the java script objects in Cosmo are changed, as they were in the merge editing ths code
//will fix all of the tests. 
/*
Selenium.prototype.doStoreId = function(expression, variableName) {
    // This command is a synonym for storeExpression.
     // @param expression the identifier for the ID we want from Cosmo
    // @param variableName the name of a <a href="#storedVars">variable</a> in which the result is to be stored.
     //
    //If they want the next
    if (expression == "next"){
        storedVars[variableName] = this.browserbot.getCurrentWindow().cosmo.view.cal.canvas.eventRegistry.getNext().id;
    }
    //Default to the first, more cases could be added
    else{
        storedVars[variableName] =  this.browserbot.getCurrentWindow().cosmo.view.cal.canvas.eventRegistry.getFirst().id;
    }
}
*/