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
    // Simple wait function -- puts ASTest into waiting
    // mode, calls a function on setTimeout to take it
    // back out of waiting mode
    public static function sleep(params:Object):void {
      ASTest.waiting = true;
      setTimeout(function ():void {
        ASTest.waiting = false;
      }, params.milliseconds);
    }

    // Generic wait function which waits for a true result
    // from a test function (params.test)
    // All other waits should simply define a test function
    // and hand off to this
    // Default timeout (Windmill.timeout) is 20 seconds --
    // can be overridden with params.timeout
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

        // If test function never returns a true result, time out.
        // Can't throw an actual error here, because after the first
        // setTimeout, this recursive call-loop executes outside the
        // scope of the original try/catch in the ASTest.runNextTest
        // loop. So rather than throwing here, we hang the error on
        // ASTest.previousError, so when runNextTest resumes, it will
        // find it and report it before running the next test action
        if (timeoutCounter > timeout) {
          ASTest.previousError = new Error(
              'Wait timed out after ' + timeout + ' milliseconds.');
          ASTest.waiting = false;
          return;
        }

        // Not timed out, so increment the counter and go on
        timeoutCounter += loopInterval;

        // Exec the test function, and cast it to a Bool
        var result:*;
        try {
          result = testFunc();
        }
        // If it throws an error, just try again -- if it never
        // succeeds, the timeout code will handle it
        catch (e:Error) {
          return;
        }
        result = !!result;

        // Success -- switch off waiting state so ASTest.runNextTest
        // will resume
        if (result) {
          ASTest.waiting = false;
        }
        // Otherwise keep trying until it times out
        else {
          setTimeout(conditionTest, loopInterval);
        }
      };
      conditionTest(); // Start the recursive calling process
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
