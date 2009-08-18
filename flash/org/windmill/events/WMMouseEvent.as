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
  
  import flash.events.MouseEvent;
  import flash.display.InteractiveObject;
  
  public class WMMouseEvent extends MouseEvent {
    private var fakeStageX:Number;
    private var fakeStageY:Number;

    public function WMMouseEvent(type:String,
        bubbles:Boolean = false, cancelable:Boolean = false,
        localX:Number = NaN, localY:Number = NaN, 
        relatedObject:InteractiveObject = null,
        ctrlKey:Boolean = false, altKey:Boolean = false,
        shiftKey:Boolean = false, buttonDown:Boolean = false,
        delta:int = 0) {
      super(type, bubbles, cancelable, localX, localY,
          relatedObject, ctrlKey, altKey, shiftKey, buttonDown,
          delta);
    }
    public function set stageX(value:Number):void {
      fakeStageX = value;
    }
    override public function get stageX():Number {
      return fakeStageX;
    }
    public function set stageY(value:Number):void {
      fakeStageY = value;
    }
    override public function get stageY():Number {
      return fakeStageY;
    }
  }
}

