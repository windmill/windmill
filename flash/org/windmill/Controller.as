/*
Copyright 2009, Matthew Eernisse (mde@fleegix.org) and Slide, Inc.

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

package org.windmill {
  import org.windmill.events.*;
  import org.windmill.Locator;
  import flash.events.*
  import mx.events.*
  import flash.utils.*;
  import flash.geom.Point;
  import flash.external.ExternalInterface;

  public class Controller {
    private static function _log(msg:*):void {
      ExternalInterface.call("logger", msg);
    }

    public function Controller():void {}

    public static function click(params:Object):void {
      var obj:* = Locator.lookupDisplayObject(params);
      // Give it focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // Down, (TextEvent.LINK,) up, click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // If this is a link, do the TextEvent hokey-pokey
      // All events fire on the containing DisplayObject
      if ('link' in params) {
        var link:String = Locator.locateLinkHref(params.link,
          obj.htmlText);
        Events.triggerTextEvent(obj, TextEvent.LINK, {
            text: link });
      }
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
      Events.triggerMouseEvent(obj, MouseEvent.CLICK);
    }

    // Click alias functions
    public static function check(params:Object):void {
      return Controller.click(params);
    }
    public static function radio(params:Object):void {
      return Controller.click(params);
    }

    public static function dragDropElemToElem(params:Object):void {
      // Figure out what the destination is
      var destParams:Object = {};
      for (var attrib:String in params) {
        if (attrib.indexOf('opt') != -1){
          destParams[attrib.replace('opt', '')] = params[attrib];
          break;
        }
      }
      var dest:* = Locator.lookupDisplayObject(destParams);
      var destCoords:Point = new Point(dest.x, dest.y);
      destCoords = dest.localToGlobal(destCoords);
      params.coords = '(' + destCoords.x + ',' + destCoords.y + ')';
      dragDropToCoords(params);
    }

    public static function dragDropToCoords(params:Object):void {
      var obj:* = Locator.lookupDisplayObject(params);
      var startCoords:Point = new Point(obj.x, obj.y);
      var endCoords:Point = Controller.parseCoords(params.coords);
      Controller._log('start local' + startCoords.toString());
      Controller._log('end local ' + endCoords.toString());
      // Convert local X/Y to global
      startCoords = obj.localToGlobal(startCoords);
      endCoords = obj.localToGlobal(endCoords);
      Controller._log('start global ' + startCoords.toString());
      Controller._log('end global ' + endCoords.toString());
      // Move mouse over to the dragged obj
      Events.triggerMouseEvent(obj.stage, MouseEvent.MOUSE_MOVE, {
        stageX: startCoords.x,
        stageY: startCoords.y
      });
      // Give it focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // Down, (TextEvent.LINK,) up, click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // Number of steps will be number of pixels in shorter delta
      var deltaX:int = endCoords.x - startCoords.x;
      var deltaY:int = endCoords.y - startCoords.y;
      var stepCount:int = 10; // Just pick an arbitrary number of steps
      // Number of pixels to move per step
      var incrX:Number = deltaX / stepCount;
      var incrY:Number = deltaY / stepCount;
      // Current pos as the move happens
      var currX:Number = startCoords.x;
      var currY:Number = startCoords.y;
      // Step number
      var currStep:int = 0;
      // Use a delay so we can see the move
      var stepTimer:Timer = new Timer(5);
      // Step function -- reposition per step
      var doStep:Function = function ():void {
        if (currStep <= stepCount) {
          Events.triggerMouseEvent(obj.stage, MouseEvent.MOUSE_MOVE, {
            stageX: currX,
            stageY: currY
          });
          currX += incrX;
          currY += incrY;
          currStep++;
        }
        // Once it's finished, stop the timer and trigger
        // the final mouse events
        else {
          stepTimer.stop();
          Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
          Events.triggerMouseEvent(obj, MouseEvent.CLICK);
        }
      }
      // Start the timer loop
      stepTimer.addEventListener(TimerEvent.TIMER, doStep);
      stepTimer.start();
    }

    // Ensure coords are in the right format and are numbers
    private static function parseCoords(coordsStr:String):Point {
      var coords:Array = coordsStr.replace(
          /\(|\)| /g, '').split(',');
      var point:Point;
      if (isNaN(coords[0]) || isNaN(coords[1])) {
        throw new Error('Coordinates must be in format "(x, y)"');
      }
      else {
        coords[0] = parseInt(coords[0], 10);
        coords[1] = parseInt(coords[1], 10);
        point = new Point(coords[0], coords[1]);
      }
      return point;
    }

    public static function doubleClick(params:Object):void {
      var obj:* = Locator.lookupDisplayObject(params);
      // Give it focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // First click
      // Down, (TextEvent.LINK,) up, click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // If this is a link, do the TextEvent hokey-pokey
      // All events fire on the containing DisplayObject
      if ('link' in params) {
        var link:String = Locator.locateLinkHref(params.link,
          obj.htmlText);
        Events.triggerTextEvent(obj, TextEvent.LINK, {
            text: link });
      }
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
      Events.triggerMouseEvent(obj, MouseEvent.CLICK);
      // Second click
      // Down, (TextEvent.LINK,) up, double click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // TextEvent hokey-pokey, reprise
      if ('link' in params) {
        Events.triggerTextEvent(obj, TextEvent.LINK, {
            text: link });
      }
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
      Events.triggerMouseEvent(obj, MouseEvent.DOUBLE_CLICK);
    }

    public static function type(params:Object):void {
      // Look up the item to write to
      var obj:* = Locator.lookupDisplayObject(params);
      // Text to type out
      var str:String = params.text;
      // Char
      var currChar:String;
      // Char code
      var currCode:int;

      // Give the item focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // Clear out any value it previously had
      obj.text = '';

      // Write out the string, firing appropriate events as you go
      for (var i:int = 0; i < str.length; i++) {
        currChar = str.charAt(i);
        currCode = str.charCodeAt(i);
        // FIXME: In reality, capital letters / special chars
        // would be firing shift key events around these
        Events.triggerKeyboardEvent(obj, KeyboardEvent.KEY_DOWN, {
          charCode: currCode });
        // Append to the value
        obj.text += str.charAt(i);
        Events.triggerTextEvent(obj, TextEvent.TEXT_INPUT, {
            text: currChar });
        Events.triggerKeyboardEvent(obj, KeyboardEvent.KEY_UP, {
          charCode: currCode });
      }
    }

    public static function select(params:Object):void {
      // Look up the item to write to
      var obj:* = Locator.lookupDisplayObject(params);
      var sel:* = obj.selectedItem;
      var item:*;
      // Give the item focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // Set by index
      switch (true) {
        case ('index' in params):
          if (obj.selectedIndex != params.index) {
            Events.triggerListEvent(obj, ListEvent.CHANGE);
            obj.selectedIndex = params.index;
          }
          break;
        case ('label' in params):
        case ('text' in params):
          var targetLabel:String = params.label || params.text;
          // Can set a custom label field via labelField attr
          var labelField:String = obj.labelField ?
              obj.labelField : 'label';
          if (sel[labelField] != targetLabel) {
            Events.triggerListEvent(obj, ListEvent.CHANGE);
            for each (item in obj.dataProvider) {
              if (item[labelField] == targetLabel) {
                obj.selectedItem = item;
              }
            }
          }
          break;
        case ('data' in params):
        case ('value' in params):
          var targetData:String = params.data || params.value;
          if (sel.data != targetData) {
            Events.triggerListEvent(obj, ListEvent.CHANGE);
            for each (item in obj.dataProvider) {
              if (item.data == targetData) {
                obj.selectedItem = item;
              }
            }
          }
          break;
        default:
          // Do nothing
      }
    }
  }
}

