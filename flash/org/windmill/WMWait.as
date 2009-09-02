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
  import org.windmill.WMLocator;
  import org.windmill.astest.ASTest;
  import flash.utils.*;

  public class WMWait {
    public static function sleep(params:Object):void {
      ASTest.waiting = true;
      setTimeout(function ():void {
        ASTest.waiting = false;
      }, params.milliseconds);
    }

    public static function forCondition(params:Object):void {
      var timeout:int = Windmill.timeout;
      if (params.timeout) {
        if (!isNaN(parseInt(params.timeout, 10))) {
          timeout = params.timeout;
        }
      }
      var testFunc:Function = params.test;
      var timeoutCounter:int = 0;
      var loopInterval:int = 100;

      ASTest.waiting = true;
      // Recursively call the test function, and set
      // ASTest.waiting back to false if the code ever suceeds
      // Throw an error if this loop times out without
      // the test function ever succeeding
      var conditionTest:Function = function ():void {
        if (timeoutCounter > timeout) {
          ASTest.previousError = new Error(
              'Wait timed out after ' + timeout + ' milliseconds.');
          ASTest.waiting = false;
          return;
        }
        timeoutCounter += loopInterval;
        var result:*;
        try {
          result = testFunc();
        }
        catch (e:Error) {
          return;
        }
        result = !!result;
        if (result) {
          ASTest.waiting = false;
        }
        else {
          setTimeout(conditionTest, loopInterval);
        }
      };
      conditionTest();
    }

    public static function forDisplayObject(params:Object):void {
      var func:Function = function ():Boolean {
        var obj:* = WMLocator.lookupDisplayObject(params);
        return !!obj
      }
      params.test = func;
      return WMWait.forCondition(params);
    }
  }
}
