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
  import flash.external.ExternalInterface;

  public class WMExplorer {
    // Sprite which gets superimposed on the moused-over element
    // and provides the border effect
    private static var borderSprite:Sprite = new Sprite();
    private static var running:Boolean = false;

    public function WMExplorer():void {}

    public static function start():void {
      // Stop the recorder if it's going
      WMRecorder.stop();
      WMExplorer.running = true;

      var stage:Stage = Windmill.getStage();
      var spr:Sprite = WMExplorer.borderSprite;
      // Add the border-sprite to the stage
      spr.name = 'borderSprite';
      stage.addChild(spr);
      // Highlight every element, create locator chain on mouseover
      stage.addEventListener(MouseEvent.MOUSE_OVER, WMExplorer.highlight);
      stage.addEventListener(MouseEvent.MOUSE_OVER, WMExplorer.select);
      // Stop on click 
      stage.addEventListener(MouseEvent.MOUSE_DOWN, WMExplorer.stop);
    }

    public static function stop(e:MouseEvent = null):void {
      if (!WMExplorer.running) { return; }
      var stage:Stage = Windmill.getStage();
      stage.removeChild(WMExplorer.borderSprite);
      stage.removeEventListener(MouseEvent.MOUSE_OVER, WMExplorer.highlight);
      stage.removeEventListener(MouseEvent.MOUSE_OVER, WMExplorer.select);
      stage.removeEventListener(MouseEvent.MOUSE_DOWN, WMExplorer.stop);
      WMExplorer.running = false;
    }

    public static function highlight(e:MouseEvent):void {
      var targ:* = e.target;
      var spr:Sprite = WMExplorer.borderSprite;
      var p:Point = new Point(0, 0);
      // Get the global coords of the moused-over elem
      p = targ.localToGlobal(p);
      spr.x = p.x;
      spr.y = p.y;
      // Clear any previous border, and draw a new border
      // the same size as the moused-over elem
      spr.graphics.clear()
      spr.graphics.lineStyle(0, 0xff0000, 0.5);
      spr.graphics.drawRect(0, 0, targ.width, targ.height);
    }

    // Generates a chained-locator expression for the clicked-on item
    public static function select(e:*):void {
      var item:* = e.target;
      var expr:String = WMLocator.generateLocator(item);
      if (expr.length) {
        // Strip off trailing slash
        expr = expr.replace(/\/$/, '');
        var res:* = ExternalInterface.call('wm_explorerSelect', expr);
        if (!res) {
          WMLogger.log(expr + ' (Windmill Flash bridge not found.)');
        }
      }
      else {
        throw new Error('Could not find any usable attributes for locator.');
      }
    }

  }
}
