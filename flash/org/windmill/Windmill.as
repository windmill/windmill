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
    public static var assertMethods:Array = [];
    public static var packages:Object = {
      controller: {
        packageRef: org.windmill.WMController,
        methodNames: []
      },
      assert: {
        packageRef: org.windmill.WMAssert,
        methodNames: []
      }
    };

    public function Windmill():void {}

    public static function init(config:Object):void {
      var methodName:String;
      var item:*;
      var descr:XML;
      // Returns a wrapped version of the method
      // which returns the Error obj instead of throwing
      var genExtFunc:Function = function (k:String,
          m:String):Function {
        return function (...args):* {
          try {
            return packages[k].packageRef[m].apply(null, args);
          }
          catch (e:Error) {
            return e;
          }
        }
      }
      // Search context for locators -- can be either
      // Stage or Application, but usually a Stage
      context = config.context;

      // controller, assert
      for (var key:String in packages) {
        // Introspect all the public packages
        // to expose via ExternalInterface
        descr = flash.utils.describeType(
            packages[key].packageRef);
        for each (item in descr..method) {
          packages[key].methodNames.push(item.@name.toXMLString());
        }
        // Expose public packages via ExternalInterface
        // 'dragDropOnCoords' becomes 'wm_dragDropOnCoords'
        // The exposed method is wrapped in a try/catch
        // that returns the Error obj to JS instead of throwing
        for each (methodName in packages[key].methodNames) {
          ExternalInterface.addCallback('wm_' + methodName,
              genExtFunc(key, methodName));
        }
      }
    }
  }
}
