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
  // FIXME:
  // Relying on implicit imports of org.windmill.*
  // to avoid infinite recursion in build script
  import flash.utils.*;
  import mx.core.Application;
  import flash.display.Stage;
  import flash.display.DisplayObject;
  import flash.external.ExternalInterface;

  public class Windmill {
    public static var context:*; // A reference to the Stage
    public static var controllerMethods:Array = [];
    public static var assertMethods:Array = [];
    public static var packages:Object = {
      controller: {
        // Ref to the namespace, since you can't
        // do it via string lookup
        packageRef: org.windmill.WMController,
        // Gets filled with the list of public methods --
        // used to generate the wrapped methods exposed
        // via ExternalInterface
        methodNames: []
      },
      assert: {
        packageRef: org.windmill.WMAssert,
        methodNames: []
      }
    };

    public function Windmill():void {}

    // Initializes the Windmill Flash code
    // 1. Saves a reference to the stage in 'context'
    //    this is the equivalent of the window obj in
    //    Windmill's JS impl. See WMLocator to see how
    //    it's used
    // 2. Does some introspection/metaprogramming to
    //    expose all the public methods in WMController
    //    and WMAsserts through the ExternalInterface
    //    as wrapped functions that return either the
    //    Boolean true, or the Error object if an error
    //    happens (as in the case of all failed tests)
    // 3. Exposes the start/stop method of WMExplorer
    //    to turn on and off the explorer
    public static function init(config:Object):void {
      var methodName:String;
      var item:*;
      var descr:XML;
      // Returns a wrapped version of the method that returns
      // the Error obj to JS-land instead of actually throwing
      var genExtFunc:Function = function (func:Function):Function {
        return function (...args):* {
          try {
            return func.apply(null, args);
          }
          catch (e:Error) {
            return e;
          }
        }
      }
      // A reference to the Stage
      // ----------------
      if (!(config.context is Stage || config.context is Application)) {
        throw new Error('Windmill.context must be a reference to the Application or Stage.');
      }
      context = config.context;

      // Expose controller and assert methods
      // ----------------
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
              genExtFunc(packages[key].packageRef[methodName]));
        }
      }

      // Other misc ExternalInterface methods
      var miscMethods:Object = {
        explorerStart: WMExplorer.start,
        explorerStop: WMExplorer.stop,
        recorderStart: WMRecorder.start,
        recorderStop: WMRecorder.stop
      }
      // Don't care what order these happen in
      for (methodName in miscMethods) {
        ExternalInterface.addCallback('wm_' + methodName,
            genExtFunc(miscMethods[methodName]));
      }
    }

    public static function getStage():Stage {
      var context:* = Windmill.context;
      var stage:Stage;
      if (context is Application) {
        stage = context.stage;
      }
      else if (context is Stage) {
        stage = context;
      }
      else {
        throw new Error('Windmill.context must be a reference to an Application or Stage.' +
            ' Perhaps Windmill.init has not run yet.');
      }
      return stage; 
    }
    
    public static function getTopLevel():DisplayObject {
      var topLevel:*;
      var context:* = Windmill.context;
      if (context is Application) {
        topLevel = context.parent;
      }
      else if (context is Stage) {
        topLevel = context;
      }
      else {
        throw new Error('Windmill.context must be a reference to an Application or Stage.' +
            ' Perhaps Windmill.init has not run yet.');
      }
      return topLevel; 
    }
  }
}
