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
  import flash.display.Stage;
  import flash.display.DisplayObject;
  import flash.display.DisplayObjectContainer;
  import flash.events.Event;
  import flash.events.MouseEvent;
  import flash.events.TextEvent;
  import flash.events.KeyboardEvent;

  public class WMRecorder {
    private static var lastEventType:String;
    private static var keyDownString:String;

    public function WMRecorder():void {}

    public static function start():void {
      var context:Stage = Windmill.context;
      if (!context || !context is Stage) {
        throw new Error('Windmill.context must be a reference to the Stage.' +
            ' Perhaps Windmill.init has not run yet.');
      }
      context.addEventListener(MouseEvent.CLICK, WMRecorder.handleEvent);
      context.addEventListener(TextEvent.LINK, WMRecorder.handleEvent);
      context.addEventListener(KeyboardEvent.KEY_DOWN, WMRecorder.handleEvent);
    }

    private static function handleEvent(e:Event):void {
      var targ:* = e.target;
      WMLogger.log(e.toString());
      //WMLogger.log(e.target.toString());
    }

    public static function stop():void {}
  }
}

