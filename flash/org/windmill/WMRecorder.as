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
  import org.windmill.Windmill;
  import org.windmill.WMLogger;
  import org.windmill.WMLocator;
  import org.windmill.WMExplorer;
  import flash.utils.*;
  import flash.display.Stage;
  import flash.display.DisplayObject;
  import flash.display.DisplayObjectContainer;
  import flash.events.MouseEvent;
  import flash.events.TextEvent;
  import flash.events.KeyboardEvent;
  import mx.events.ListEvent;
  import mx.controls.ComboBox;
  import mx.controls.List;

  public class WMRecorder {
    // Remember the last event type so we know when to
    // output the stored string from a sequence of keyDown events
    private static var lastEventType:String;
    // Remember recent target -- used to detect double-click
    // and to throw away click events on text items that have
    // already spawned a 'link' TextEvent.
    // Only remembered for one second
    private static var recentTarget:Object = {
      click: null,
      change: null
    };
    // Timeout id for removing the recentTarget
    private static var recentTargetTimeout:Object = {
      click: null,
      change: null
    };
    // String built from a sequenece of keyDown events
    private static var keyDownString:String = '';
    private static var listItems:Array = [];
    private static var running:Boolean = false;

    public function WMRecorder():void {}

    public static function start():void {
      // Stop the explorer if it's going
      WMExplorer.stop();

      var recurseAttach:Function = function (item:*):void {
        // Otherwise recursively check the next link in
        // the locator chain
        var count:int = 0;
        if (item is ComboBox || item is List) {
          WMRecorder.listItems.push(item);
          item.addEventListener(ListEvent.CHANGE, WMRecorder.handleEvent);
        }
        if (item is DisplayObjectContainer) {
          count = item.numChildren;
        }
        if (count > 0) {
          var index:int = 0;
          while (index < count) {
            var kid:DisplayObject = item.getChildAt(index);
            var res:DisplayObject = recurseAttach(kid);
            index++;
          }
        }
      }
      recurseAttach(Windmill.getContext());
      var stage:Stage = Windmill.getStage();
      stage.addEventListener(MouseEvent.CLICK, WMRecorder.handleEvent);
      stage.addEventListener(MouseEvent.DOUBLE_CLICK, WMRecorder.handleEvent);
      stage.addEventListener(TextEvent.LINK, WMRecorder.handleEvent);
      stage.addEventListener(KeyboardEvent.KEY_DOWN, WMRecorder.handleEvent);

      WMRecorder.running = true;
    }

    public static function stop():void {
      if (!WMRecorder.running) { return; }
      var stage:Stage = Windmill.getStage();
      stage.removeEventListener(MouseEvent.CLICK, WMRecorder.handleEvent);
      stage.removeEventListener(MouseEvent.DOUBLE_CLICK, WMRecorder.handleEvent);
      stage.removeEventListener(TextEvent.LINK, WMRecorder.handleEvent);
      stage.removeEventListener(KeyboardEvent.KEY_DOWN, WMRecorder.handleEvent);
      var list:Array = WMRecorder.listItems;
      for each (var item:* in list) {
        item.removeEventListener(ListEvent.CHANGE, WMRecorder.handleEvent);
      }
    }

    private static function handleEvent(e:*):void {
      var targ:* = e.target;
      var _this:* = WMRecorder;
      var chain:String = WMLocator.generateLocator(targ);

      switch (e.type) {
        // Keyboard input -- append to the stored string reference
        case KeyboardEvent.KEY_DOWN:
          _this.keyDownString += String.fromCharCode(e.charCode);
          break;
        // ComboBox changes
        case ListEvent.CHANGE:
          _this.generateAction('select', targ);
          _this.resetRecentTarget('change', e);
          break;
        // Mouse/URL clicks
        default:
          // If the last event was a keyDown, write out the string
          // that's been saved from the sequence of keyboard events
          if (_this.lastEventType == KeyboardEvent.KEY_DOWN) {
            _this.generateAction('type', targ, { text: _this.keyDownString });
            // Empty out string storage
            _this.keyDownString = '';
          }
          // Ignore clicks on ComboBox/List items that result
          // in ListEvent.CHANGE events -- the list gets blown
          // away, and can't be looked up by the generated locator
          // anyway, so we have to use this event instead
          else if (_this.lastEventType == ListEvent.CHANGE) {
            if (_this.recentTarget.change) {
              return;
            }
          }
          // Avoid multiple clicks on the same target
          if (_this.recentTarget == e.target) {
            // Check for previous TextEvent.LINK
            if (_this.lastEventType != MouseEvent.DOUBLE_CLICK) {
              // Just throw this mofo away
              return;
            }
          }
          var t:String = e.type == MouseEvent.DOUBLE_CLICK ?
              'doubleClick' : 'click';
          _this.generateAction(t, targ);
          _this.resetRecentTarget('click', e);
      }

      // Remember the last event type for saving sequences of
      // keyboard events
      _this.lastEventType = e.type;

      //WMLogger.log(e.toString());
      //WMLogger.log(e.target.toString());
    }

    private static function resetRecentTarget(t:String, e:*):void  {
      var _this:* = WMRecorder;
      // Remember this target, avoid multiple clicks on it
      _this.recentTarget[t] = e.target;
      // Cancel any old setTimeout still hanging around
      if (_this.recentTargetTimeout[t]) {
        clearTimeout(_this.recentTargetTimeout[t]);
      }
      // Clear the recentTarget after 1 sec.
      _this.recentTargetTimeout[t] = setTimeout(function ():void {
        _this.recentTarget[t] = null;
        _this.recentTargetTimeout[t] = null;
      }, 1);
    }

    private static function generateAction(t:String, targ:*,
        opts:Object = null):void {
      var chain:String = WMLocator.generateLocator(targ);
      var res:Object = {
        method: t,
        chain: chain
      };
      var params:Object = {};
      var p:String;
      for (p in opts) {
        params[p] = opts[p]
      }
      switch (t) {
        case 'click':
          break;
        case 'doubleClick':
          break;
        case 'select':
          var sel:* = targ.selectedItem;
          // Can set a custom label field via labelField attr
          var labelField:String = targ.labelField ?
              targ.labelField : 'label';
          params.label = sel[labelField];
          break;
        case 'type':
          break;
      }
      for (p in params) {
        res.params = params;
        break;
      }
      WMLogger.log(res);
    }

  }
}

