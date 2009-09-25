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
  import org.windmill.WMLocator;
  import org.windmill.WMLogger;
  import org.windmill.WMRecorder;
  import flash.display.Stage;
  import flash.display.Sprite;
  import flash.events.MouseEvent;
  import flash.geom.Point;
  import flash.geom.Rectangle;
  import flash.external.ExternalInterface;

  public class WMExplorer {
    // Sprite which gets superimposed on the moused-over element
    // and provides the border effect
    private static var borderSprite:Sprite = new Sprite();
    private static var running:Boolean = false;
    private static var strictLocators:* = null; // true, false, or null

    public static function init():void {
    }

    public static function start(...args):void {
      if (args.length) {
        strictLocators = args[0];
      }
      else {
        strictLocators = null;
      }

      // Stop the recorder if it's going
      WMRecorder.stop();
      running = true;

      var stage:Stage = Windmill.getStage();
      var spr:Sprite = borderSprite;
      // Add the border-sprite to the stage
      spr.name = 'windmillBorderSprite';
      stage.addChild(spr);
      // Highlight every element, create locator chain on mouseover
      stage.addEventListener(MouseEvent.MOUSE_OVER, select, false);
      // Stop on click
      stage.addEventListener(MouseEvent.MOUSE_DOWN, annihilateEvent, true);
      stage.addEventListener(MouseEvent.MOUSE_UP, annihilateEvent, true);
      // This passes off to annihilateEvent to kill clicks too
      stage.addEventListener(MouseEvent.CLICK, stop, true);
    }

    public static function stop(e:MouseEvent = null):void {
      if (!running) { return; }
      var stage:Stage = Windmill.getStage();
      stage.removeChild(borderSprite);
      stage.removeEventListener(MouseEvent.MOUSE_OVER, select);
      // Call removeEventListener with useCapture of 'true', since
      // the listener was added with true
      stage.removeEventListener(MouseEvent.MOUSE_DOWN, annihilateEvent, true);
      stage.removeEventListener(MouseEvent.MOUSE_UP, annihilateEvent, true);
      stage.removeEventListener(MouseEvent.CLICK, stop, true);
      running = false;
      // Pass off to annihilateEvent to prevent the app from responding
      annihilateEvent(e);
    }

    // Highlights the rolled-over item and generates a chained-locator
    // expression for it
    public static function select(e:MouseEvent):void {
      var targ:* = e.target;
      if ('name' in targ && targ.name == 'windmillBorderSprite') {
        return;
      }
      // Bordered sprite for highlighting
      var spr:Sprite = borderSprite;
      // Get the global coords of the moused-over elem
      // Overlay the border sprite in the same position
      var bounds:Rectangle = targ.getBounds(targ.parent);
      var p:Point = new Point(bounds.x, bounds.y);
      p = targ.parent.localToGlobal(p);
      spr.x = p.x;
      spr.y = p.y;
      // Clear any previous border, and draw a new border
      // the same size as the moused-over elem
      spr.graphics.clear()
      spr.graphics.lineStyle(2, 0x3875d7, 1);
      spr.graphics.drawRect(0, 0, targ.width, targ.height);
      // Generate the expression
      var args:Array = [];
      args.push(targ);
      if (strictLocators is Boolean) {
        args.push(strictLocators);
      }
      var expr:String = WMLocator.generateLocator.apply(WMLocator, args);
      if (expr && expr.length) {
        var res:* = ExternalInterface.call('wm_explorerSelect', expr);
        if (!res) {
          WMLogger.log('Locator chain: ' + expr);
        }
      }
      else {
        throw new Error('Could not find any usable attributes for locator.');
      }
    }

    public static function annihilateEvent(e:MouseEvent):void {
      e.preventDefault();
      e.stopImmediatePropagation();
    }

  }
}
