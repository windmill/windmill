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
  import flash.display.Stage;
  import flash.display.Sprite;
  import flash.events.MouseEvent;
  import flash.geom.Point;
  import flash.external.ExternalInterface;

  public class WMExplorer {
    // Sprite which gets superimposed on the moused-over element
    // and provides the border effect
    private static var borderSprite:Sprite = new Sprite();

    public function WMExplorer():void {}

    public static function start():void {
      var context:Stage = Windmill.context;
      var spr:Sprite = WMExplorer.borderSprite;
      if (!context || !context is Stage) {
        throw new Error('Windmill.context must be a reference to the Stage.' +
            ' Perhaps Windmill.init has not run yet.');
      }
      // Add the border-sprite to the stage
      spr.name = 'borderSprite';
      context.addChild(spr);
      // Highlight every element on mouseover
      context.addEventListener(MouseEvent.MOUSE_OVER, WMExplorer.highlight, true);
      // Clicks should pass the lookup expression to JS
      context.addEventListener(MouseEvent.MOUSE_DOWN, WMExplorer.select, true);
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
    public static function select(e:MouseEvent):void {
      var item:* = e.target;
      var expr:String = '';
      // Look for these items, in this priority
      var locatorPriority:Array = [
        'automationId',
        'id',
        'name',
        'label'
      ];
      do {
        for each (var lookup:String in locatorPriority) {
          // If we find one of the lookuup keys, prepend
          // on the locator expression
          if (lookup in item && item[lookup]) {
            expr = lookup + ':' + item[lookup] + '/' + expr;
            break;
          }
        }
        item = item.parent;
      } while (!(item is Stage) && item.parent) 
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

    public static function stop():void {
      var context:Stage = Windmill.context;
      context.removeChild(WMExplorer.borderSprite);
      context.removeEventListener(MouseEvent.MOUSE_OVER, WMExplorer.highlight);
      context.removeEventListener(MouseEvent.MOUSE_DOWN, WMExplorer.select);
    }
  }
}
