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
  import flash.utils.*;
  import flash.external.ExternalInterface;

  public class Windmill {
    public static var context:*; // May be Stage or Application
    public static var controllerMethods:Array = [];

    public function Windmill():void {}

    public static function init(config:Object):void {
      // Search context for locators -- can be either
      // Stage or Application, but usually a Stage
      context = config.context;

      // Introspect all the public controller methods
      // to expose via ExternalInterface
      var descr:XML = flash.utils.describeType(
          org.windmill.WMController);
      for each (var item:* in descr..method) {
        controllerMethods.push(item.@name.toXMLString());
      }
      // Expose public methods via ExternalInterface
      // 'dragDropOnCoords' becomes 'wm_dragDropOnCoords'
      for each (var methodName:String in controllerMethods) {
        ExternalInterface.addCallback('wm_' + methodName,
            org.windmill.WMController[methodName]);
      }
    }
  }
}
