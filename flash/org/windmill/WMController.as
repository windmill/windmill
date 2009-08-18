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
  import org.windmill.WMLocator;
  import flash.events.*
  import mx.events.*
  import flash.utils.*;
  import flash.geom.Point;

  public class WMController {
    public function WMController():void {}

    public static function click(params:Object):void {
      var obj:* = WMLocator.lookupDisplayObject(params);
      // Give it focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // Down, (TextEvent.LINK,) up, click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // If this is a link, do the TextEvent hokey-pokey
      // All events fire on the containing DisplayObject
      if ('link' in params) {
        var link:String = WMLocator.locateLinkHref(params.link,
          obj.htmlText);
        Events.triggerTextEvent(obj, TextEvent.LINK, {
            text: link });
      }
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
      Events.triggerMouseEvent(obj, MouseEvent.CLICK);
    }

    // Click alias functions
    public static function check(params:Object):void {
      return WMController.click(params);
    }
    public static function radio(params:Object):void {
      return WMController.click(params);
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
      var dest:* = WMLocator.lookupDisplayObject(destParams);
      var destCoords:Point = new Point(0, 0);
      destCoords = dest.localToGlobal(destCoords);
      params.coords = '(' + destCoords.x + ',' + destCoords.y + ')';
      dragDropToCoords(params);
    }

    public static function dragDropToCoords(params:Object):void {
      var obj:* = WMLocator.lookupDisplayObject(params);
      var startCoordsLocal:Point = new Point(0, 0);
      var endCoordsAbs:Point = WMController.parseCoords(params.coords);
      // Convert local X/Y to global
      var startCoordsAbs:Point = obj.localToGlobal(startCoordsLocal);
      // Move mouse over to the dragged obj
      Events.triggerMouseEvent(obj.stage, MouseEvent.MOUSE_MOVE, {
        stageX: startCoordsAbs.x,
        stageY: startCoordsAbs.y
      });
      // Give it focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // Down, (TextEvent.LINK,) up, click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // Number of steps will be number of pixels in shorter delta
      var deltaX:int = endCoordsAbs.x - startCoordsAbs.x;
      var deltaY:int = endCoordsAbs.y - startCoordsAbs.y;
      var stepCount:int = 10; // Just pick an arbitrary number of steps
      // Number of pixels to move per step
      var incrX:Number = deltaX / stepCount;
      var incrY:Number = deltaY / stepCount;
      // Current pos as the move happens
      var currXAbs:Number = startCoordsAbs.x;
      var currYAbs:Number = startCoordsAbs.y;
      var currXLocal:Number = startCoordsLocal.x;
      var currYLocal:Number = startCoordsLocal.y;
      // Step number
      var currStep:int = 0;
      // Use a delay so we can see the move
      var stepTimer:Timer = new Timer(5);
      // Step function -- reposition per step
      var doStep:Function = function ():void {
        if (currStep <= stepCount) {
          Events.triggerMouseEvent(obj, MouseEvent.MOUSE_MOVE, {
            stageX: currXAbs,
            stageY: currYAbs,
            localX: currXLocal,
            localY: currYLocal
          });
          currXAbs += incrX;
          currYAbs += incrY;
          currXLocal += incrX;
          currYLocal += incrY;
          currStep++;
        }
        // Once it's finished, stop the timer and trigger
        // the final mouse events
        else {
          stepTimer.stop();
          Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP, {
            stageX: currXAbs,
            stageY: currYAbs,
            localX: currXLocal,
            localY: currYLocal
          });
          Events.triggerMouseEvent(obj, MouseEvent.CLICK, {
            stageX: currXAbs,
            stageY: currYAbs,
            localX: currXLocal,
            localY: currYLocal
          });
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
      var obj:* = WMLocator.lookupDisplayObject(params);
      // Give it focus
      Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
      // First click
      // Down, (TextEvent.LINK,) up, click
      Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
          buttonDown: true });
      // If this is a link, do the TextEvent hokey-pokey
      // All events fire on the containing DisplayObject
      if ('link' in params) {
        var link:String = WMLocator.locateLinkHref(params.link,
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
      var obj:* = WMLocator.lookupDisplayObject(params);
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
      var obj:* = WMLocator.lookupDisplayObject(params);
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

