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

package util {
  import flash.display.Sprite;
  import flash.events.MouseEvent;
  import flash.geom.Point;
  import flash.geom.Rectangle;

  /*
   * Replacement for AS3 Sprite startDrag/stopDrag
   * using only DOM events.
   * This allows the drag/drop action to be automated
   * using Windmill or other automation frameworks
   * that rely on simulated user events
   */
  public class DOMEventDrag {
    // The Sprite instance to drag
    private static var dragSprite:Sprite;
    // Pointer offset from top-left corner of the Sprite
    private static var offset:Point;
    // Lock pointer to the center of the Sprite or not
    private static var lockCenter:Boolean;
    // Drag constraints, if any, for the drag operation
    private static var bounds:Rectangle;

    // For docs on the built-in method, see:
    // http://help.adobe.com/en_US/AS3LCR/Flash_10.0/flash/display/Sprite.html#startDrag%28%29
    public static function startDrag(spr:Sprite,
        lockCenter:Boolean = false, bounds:Rectangle = null):void {
      DOMEventDrag.dragSprite = spr;
      DOMEventDrag.lockCenter = lockCenter;
      DOMEventDrag.bounds = bounds;
      // Event listener for mouse move on the stage
      // routed to private doDrag method
      spr.stage.addEventListener(MouseEvent.MOUSE_MOVE, DOMEventDrag.doDrag);
    }

    // For docs on the built-in method, see:
    // http://help.adobe.com/en_US/AS3LCR/Flash_10.0/flash/display/Sprite.html#stopDrag%28%29
    public static function stopDrag(spr:Sprite):void {
      // Remove the event listener on the stage
      DOMEventDrag.dragSprite.stage.removeEventListener(
          MouseEvent.MOUSE_MOVE,
          DOMEventDrag.doDrag);
      // Remove the dragSprite and the saved offset
      DOMEventDrag.dragSprite = null;
      DOMEventDrag.offset = null;
    }

    private static function doDrag(e:MouseEvent):void {
      var dr:Sprite = DOMEventDrag.dragSprite;
      // If there's a dragSprite, drag that mofo
      // The dragSprite is removed in stopDrag
      if (dr) {
        var dragX:int;
        var dragY:int;
        var coordsAbs:Point = new Point(e.stageX, e.stageY);
        // Get the local coors of the sprite's container
        var coordsLocal:Point = dr.parent.globalToLocal(coordsAbs);
        // Since we don't get access to the inital mouse click,
        // calculate the offset on the very first mouse move.
        // Once the offset is set, blow by this every time.
        // stopDrag clears the saved offset until the next drag
        if (!DOMEventDrag.offset) {
          // Lock the cursor to the center of the Sprite
          // Set in the constructor -- defaults to false
          if (DOMEventDrag.lockCenter) {
            var offX:int = dr.width / 2;
            var offY:int = dr.height / 2;
            DOMEventDrag.offset = new Point(offX, offY);
          }
          // Otherwise remember where the click happened,
          // and preserve the offset
          else {
            DOMEventDrag.offset = new Point(coordsLocal.x - dr.x,
                coordsLocal.y - dr.y);
          }
        }
        // Adjust the x/y by the offset -- either pointer position
        // or to center of the Sprite
        dragX = coordsLocal.x - DOMEventDrag.offset.x;
        dragY = coordsLocal.y - DOMEventDrag.offset.y;
        // Observe any drag constraints
        var bounds:Rectangle = DOMEventDrag.bounds;
        if (bounds) {
          // Left bound
          dragX = dragX < bounds.left ?
              bounds.left : dragX;
          // Top bound
          dragY = dragY < bounds.top ?
              bounds.top : dragY;
          // Right bound
          dragX = (dragX + dr.width) > bounds.right ?
              (bounds.right - dr.width) : dragX;
          // Left bound
          dragY = (dragY + dr.height) > bounds.bottom ?
              (bounds.bottom - dr.height) : dragY;
        }
        dr.x = Math.round(dragX);
        dr.y = Math.round(dragY);
      }
    }
  }
}


