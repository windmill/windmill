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
  import org.windmill.astest.ASTest;
  import org.windmill.WMLocator;
  import org.windmill.WMController;
  import org.windmill.WMAssert;
  import flash.utils.*;
  import mx.core.Application;
  import flash.system.Security;
  import flash.display.Sprite;
  import flash.display.Stage;
  import flash.display.DisplayObject;
  import flash.external.ExternalInterface;

  public class Windmill extends Sprite {
    public static var config:Object = {
      context: null, // Ref to the Stage or Application
      timeout: 20000, // Default timeout for waits
      domains: [],
      strictLocators: false 
    };
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

    // Initializes the Windmill Flash code
    // 1. Saves a reference to the stage in config.context
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
    public static function init(params:Object):void {
      var methodName:String;
      var item:*;
      var descr:XML;
      // A reference to the Stage
      // ----------------
      if (!(params.context is Stage || params.context is Application)) {
        throw new Error('Windmill.config.context must be a reference to the Application or Stage.');
      }
      config.context = params.context;

      // Allow script access to talk to the Windmill API
      // via ExternalInterface from the following domains
      if ('domains' in params) {
        var domainsArr:Array = params.domain is Array ?
          params.domains : [params.domains];
        config.domains = domainsArr;
        for each (var d:String in config.domains) {
          Windmill.addDomain(d);
        }
      }

      // Set up the locator map
      // ========
      WMLocator.init();
      // Create dynamic asserts
      // ========
      WMAssert.init();

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

      // Expose controller and non-dynamic assert methods
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

      // Expose dynamic asserts
      // ----------------
      // These *will not*
      // show up via introspection with describeType, but
      // they *are there* -- add them manually by iterating
      // through the same list that used to build them
      var asserts:* = WMAssert;
      for (methodName in asserts.assertTemplates) {
        ExternalInterface.addCallback('wm_' + methodName,
            genExtFunc(asserts[methodName]));

      }

      // Other misc ExternalInterface methods
      // ----------------
      var miscMethods:Object = {
        explorerStart: WMExplorer.start,
        explorerStop: WMExplorer.stop,
        recorderStart: WMRecorder.start,
        recorderStop: WMRecorder.stop,
        runASTests: ASTest.run
      }
      for (methodName in miscMethods) {
        ExternalInterface.addCallback('wm_' + methodName,
            genExtFunc(miscMethods[methodName]));
      }

      // Wrap controller methods for AS tests to do auto-wait
      // ========
      ASTest.init();
    }

    public static function addDomain(domain:String):void {
      flash.system.Security.allowDomain(domain);
    }

    public static function contextIsStage():Boolean {
      return (config.context is Stage);
    }

    public static function contextIsApplication():Boolean {
      return (config.context is Application);
    }

    public static function getContext():* {
      return config.context;
    }

    public static function getStage():Stage {
      var context:* = config.context;
      var stage:Stage;
      if (contextIsApplication()) {
        stage = context.stage;
      }
      else if (contextIsStage()) {
        stage = context;
      }
      else {
        throw new Error('Windmill.config.context must be a reference to an Application or Stage.' +
            ' Perhaps Windmill.init has not run yet.');
      }
      return stage;
    }

  }
}
