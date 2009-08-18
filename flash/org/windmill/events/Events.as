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

package org.windmill.events {
  import org.windmill.events.*;
  import flash.events.*
  import mx.events.*

  public class Events {
    public function Events():void {}

    // Allow lengthy list of ordered params or a simple params
    // object to override the default values
    // NOTE: 'default' param is an array of arrays -- this is
    // a janky hack because Object keys in AS3 don't iterate
    // in their insertion order
    private static function normalizeParams(defaults:Array,
        args:Array):Object {
      var p:Object = {};
      var elem:*;
      // Merge the two arrays into a params obj
      for each (elem in defaults) {
        p[elem[0]] = elem[1];
      };
      // If there are other params, that means either ordered
      // params, or a single params object to set all the options
      if (args.length) {
        // Ordered params -- use these to override vals
        // in the params map
        if (args[0] is Boolean) {
          // Iterate through the array of param keys to pull
          // out any param values passed, in order
          for each (elem in defaults) {
            p[elem[0]] = args.shift();
            if (!args.length) {
              break;
            }
          }
        }
        // Options param obj
        else {
          for (var prop:String in p) {
            if (prop in args[0]) {
              p[prop] = args[0][prop];
            }
          }
        }
      }
      return p;
    }

    public static function triggerMouseEvent(obj:*, type:String,
        ...args):void {
      // AS3 Object keys don't iterate in insertion order
      var defaults:Array = [
        ['bubbles', true], // Override the default of false
        ['cancelable', false],
        ['localX', 0], // Override the default of NaN
        ['localY', 0], // Override the default of NaN
        ['relatedObject', null],
        ['ctrlKey', false],
        ['altKey', false],
        ['shiftKey', false],
        ['buttonDown', false],
        ['delta', 0]
      ];
      var p:Object = Events.normalizeParams(defaults, args);
      var ev:WMMouseEvent = new WMMouseEvent(type, p.bubbles,
          p.cancelable, p.localX, p.localY,
          p.relatedObject, p.ctrlKey, p.altKey, p.shiftKey,
          p.buttonDown, p.delta);
      // Check for stageX and stageY in params obj -- these are
      // only getters in th superclass, so we don't set them in
      // the constructor -- we set them here.
      if (args.length && !(args[0] is Boolean)) {
        p = args[0];
        if ('stageX' in p) {
          ev.stageX = p.stageX;
        }
        if ('stageY' in p) {
          ev.stageY = p.stageY;
        }
      }
      obj.dispatchEvent(ev);
    }

    public static function triggerTextEvent(obj:*, type:String,
        ...args):void {
      // AS3 Object keys don't iterate in insertion order
      var defaults:Array = [
        ['bubbles', true], // Override the default of false
        ['cancelable', false],
        ['text', '']
      ];
      var p:Object = Events.normalizeParams(defaults, args);
      var ev:WMTextEvent = new WMTextEvent(type, p.bubbles,
          p.cancelable, p.text);
      obj.dispatchEvent(ev);
    }

    public static function triggerFocusEvent(obj:*, type:String,
        ...args):void {
      // AS3 Object keys don't iterate in insertion order
      var defaults:Array = [
        ['bubbles', true], // Override the default of false
        ['cancelable', false],
        ['relatedObject', null],
        ['shiftKey', false],
        ['keyCode', 0]
      ];
      var p:Object = Events.normalizeParams(defaults, args);
      var ev:WMFocusEvent = new WMFocusEvent(type, p.bubbles,
          p.cancelable, p.relatedObject, p.shiftKey, p.keyCode);
      obj.dispatchEvent(ev);
    }
    
    public static function triggerKeyboardEvent(obj:*, type:String,
        ...args):void {
      // AS3 Object keys don't iterate in insertion order
      var defaults:Array = [
        ['bubbles', true], // Override the default of false
        ['cancelable', false],
        ['charCode', 0],
        ['keyCode', 0],
        ['keyLocation', 0],
        ['ctrlKey', false],
        ['altKey', false],
        ['shiftKey', false]
      ];
      var p:Object = Events.normalizeParams(defaults, args);
      var ev:WMKeyboardEvent = new WMKeyboardEvent(type, p.bubbles,
          p.cancelable, p.charCode, p.keyCode, p.keyLocation,
          p.ctrlKey, p.altKey, p.shiftKey);
      obj.dispatchEvent(ev);
    }
    public static function triggerListEvent(obj:*, type:String,
        ...args):void {
      // AS3 Object keys don't iterate in insertion order
      var defaults:Array = [
        ['bubbles', false], // Don't override -- the real one doesn't bubble
        ['cancelable', false],
        ['columnIndex', -1],
        ['rowIndex', -1],
        ['reason', null],
        ['itemRenderer', null]
      ];
      var p:Object = Events.normalizeParams(defaults, args);
      var ev:WMListEvent = new WMListEvent(type, p.bubbles,
          p.cancelable, p.columnIndex, p.rowIndex, p.reason,
          p.itemRenderer);
      obj.dispatchEvent(ev);
    }
  }
}

