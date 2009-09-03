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

package org.windmill.astest {
  import org.windmill.WMLogger;
  import flash.utils.*;
  import flash.external.ExternalInterface;

  public class ASTest {
    // How long to wait between each test action
    private static const TEST_INTERVAL:int = 10;
    // List of all the test classes for this test run
    public static var testClassList:Array = [];
    // The complete list of all methods for each class
    // in this test run
    private static var testListComplete:Array = [];
    // Copy of the list of tests -- items are popped
    // of to run the tests
    private static var testList:Array = [];
    // The last test action -- used to do reporting on
    // success/failure of each test. Waits happen
    // async in a setTimeout loop, so reporting happens
    // for the *previous* test at the beginning of each
    // runNextTest call, before grabbing and running the
    // next test
    private static var previousTest:Object = null;
    // Error for the previous test if it was unsuccessful
    // Used in the reporting as described above
    public static var previousError:Object = false;
    // Tests are running or not
    public static var inProgress:Boolean = false;
    // In waiting mode, the runNextTest loop just idles
    public static var waiting:Boolean = false;

    public static function run(files:* = null):void {
      //['/flash/TestFoo.swf', '/flash/TestBar.swf']
      // If we're passed some files, load 'em up first
      // the loader will call back to this again when
      // it's done, with no args
      if (files) {
        // **** Ugly hack ****
        // -------------
        if (!(files is Array)) {
          // The files param passed in from XPCOM trusted JS
          // loses its Array-ness -- fails the 'is Array' test,
          // and has no 'length' property. It's just a generic
          // Object with integers for keys
          // In that case, reconstitute the Array by manually
          // stepping through it until we run out of items
          var filesTemp:Array = [];
          var incr:int = 0;
          var item:*;
          var keepGoing:Boolean = true;
          while (keepGoing) {
            item = files[incr];
            if (item) {
              filesTemp.push(item);
            }
            else {
              keepGoing = false;
            }
            incr++;
          }
          files = filesTemp;
        }
        // -------------
        ASTest.loadTestFiles(files);
        return;
      }
      ASTest.getCompleteListOfTests();
      ASTest.start();
    }

    public static function loadTestFiles(files:Array):void {
      // Clear out the list of tests before loading
      ASTest.testClassList = [];
      ASTest.testList = [];
      // Load the shit
      WMLoader.load(files);
    }

    public static function start():void {
      // Make a copy of the tests to work on
      ASTest.testList = ASTest.testListComplete.slice();
      ASTest.inProgress = true;
      // Run recursively in a setTimeout loop so
      // we can implement sleeps and waits
      ASTest.runNextTest();
    }

    public static function runNextTest():void {
      var test:Object = null;
      var res:*; // Result from ExternalInterface calls
      var data:Object;
      // If we're idling in a wait, just move along ...
      // Nothing to see here
      if (ASTest.waiting) {
        // Let's try again in a second or so
        setTimeout(function ():void {
          ASTest.runNextTest.call(ASTest);
        }, 1000);
        return;
      }
      // Do reporting for the previous test -- we do this here
      // because waits happen async in a setTimeout loop,
      // and we only know when it has finished by when the next
      // test actually starts
      if (ASTest.previousTest) {
        test = ASTest.previousTest;
        data = {
          test: {
            className: test.className,
            methodName: test.methodName
          },
          error: null
        };
        // Error
        if (ASTest.previousError) {
          data.error = ASTest.previousError;
          ASTest.previousError = null;
        }
        
        // Report via ExternalInterface, or log results
        res = ExternalInterface.call('wm_asTestResult', data);
        if (!res) {
          if (data.error) {
            WMLogger.log('FAILURE: ' + data.error.message);
          }
          else {
            WMLogger.log('SUCCESS');
          }
        }
        ASTest.previousTest = null;
      }

      // If we're out of tests, we're all done
      // TODO: Add some kind of final report
      if (ASTest.testList.length == 0) {
        ASTest.inProgress = false;
      }
      // If we still have tests to run, grab the next one
      // and run that bitch
      else {
        test = ASTest.testList.shift();
        // Save a ref to this test to use for reporting
        // at the beginning of the next call
        ASTest.previousTest = test;
        
        data = {
          test: {
            className: test.className,
            methodName: test.methodName
          }
        };
        res = ExternalInterface.call('wm_asTestStart', data);
        if (!res) {
          WMLogger.log('Running ' + test.className + '.' + test.methodName + ' ...');
        }

        // Run the test
        // -----------
        try {
          test.instance[test.methodName].call(test.instance);
        }
        catch (e:Error) {
          // Save a ref to the error to use for reporting
          // at the beginning of the next call
          ASTest.previousError = e;
        }

        // Recurse until done -- note this is not actually a
        // tail call because the setTimeout invokes the function
        // in the global execution context
        setTimeout(function ():void {
          ASTest.runNextTest.call(ASTest);
        }, ASTest.TEST_INTERVAL);
      }
    }

    public static function getCompleteListOfTests():void {
      var createTestItem:Function = function (item:Object,
          methodName:String):Object {
        return {
          methodName: methodName,
          instance: item.instance,
          className: item.className,
          classDescription: item.classDescription
        };
      }
      var testList:Array = [];
      // No args -- this is being re-invoked from WMLoader
      // now that we have our tests loaded
      for each (var item:Object in ASTest.testClassList) {
        var currTestList:Array = [];
        var descr:XML;
        var hasSetup:Boolean = false;
        var hasTeardown:Boolean = false;
        descr = flash.utils.describeType(
            item.classDescription);
        var meth:*;
        var methods:Object = {};
        for each (meth in descr..method) {
          var methodName:String = meth.@name.toXMLString();
          if (/^test/.test(methodName)) {
            methods[methodName] = item;
          }
          // If there's a setup or teardown somewhere in there
          // flag them so we can prepend/append after adding all
          // the tests
          if (methodName == 'setup') {
            hasSetup = true;
          }
          if (methodName == 'teardown') {
            hasTeardown = true;
          }
        }

        // Normal test methods
        // -----
        // If there's an 'order' array defined, run any tests
        // it contains in the defined order
        var key:String;
        if ('order' in item.instance) {
          for each (key in item.instance.order) {
            if (!key in methods) {
              throw new Error(key + ' is not a method in ' + item.className);
            }
            currTestList.push(createTestItem(methods[key], key));
            delete methods[key];
          }
        }
        // Run any other methods in whatever order
        for (key in methods) {
          currTestList.push(createTestItem(methods[key], key));
        }

        // Setup/teardown
        // -----
        // Prepend list with setup if one exists
        if (hasSetup) {
          currTestList.unshift(createTestItem(item, 'setup'));
        }
        // Append list with teardown if one exists
        if (hasTeardown) {
          currTestList.push(createTestItem(item, 'teardown'));
        }
        testList = testList.concat.apply(testList, currTestList);
      }
      ASTest.testListComplete = testList;
    }
  }
}



