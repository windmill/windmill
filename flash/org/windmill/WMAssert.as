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
  import org.windmill.WMLocator;
  import org.windmill.WMLogger;
  import flash.utils.getQualifiedClassName;

  public dynamic class WMAssert {

    public static var assertTemplates:Object = {
      assertTrue: {
        expr: function (a:Boolean):Boolean {
            return a === true;
          },
        errMsg: 'expected true but was false.'
      },
      assertFalse: {
        expr: function (a:Boolean):Boolean {
            return a === false;
        },
        errMsg: 'expected false but was true.'
      },
      assertEquals: {
        expr: function (a:*, b:*):Boolean { return a === b; },
        errMsg: 'expected $1 but was $2.'
      },
      assertNotEquals: {
        expr: function (a:*, b:*):Boolean { return a !== b; },
        errMsg: 'expected one of the two values not to be $1.'
      },
      assertGreaterThan: {
        expr: function (a:*, b:*):Boolean { return a > b; },
        errMsg: 'expected a value greater than $2 but was $1.'
      },
      assertLessThan: {
        expr: function (a:*, b:*):Boolean { return a < b; },
        errMsg: 'expected a value less than $2 but was $1.'
      },
      assertNull: {
        expr: function (a:*):Boolean { return a === null; },
        errMsg: 'expected to be null but was $1.'
      },
      assertNotNull: {
        expr: function (a:*):Boolean { return a !== null; },
        errMsg: 'expected not to be null but was null.'
      },
      assertUndefined: {
        expr: function (a:*):Boolean { return typeof a == 'undefined'; },
        errMsg: 'expected to be undefined but was $1.'
      },
      assertNotUndefined: {
        expr: function (a:*):Boolean { return typeof a != 'undefined'; },
        errMsg: 'expected not to be undefined but was undefined.'
      },
      assertNaN: {
        expr: function (a:*):Boolean { return isNaN(a); },
        errMsg: 'expected $1 to be NaN, but was not NaN.'
      },
      assertNotNaN: {
        expr: function (a:*):Boolean { return !isNaN(a); },
        errMsg: 'expected $1 not to be NaN, but was NaN.'
      },
      assertEvaluatesToTrue: {
        expr: function (a:*):Boolean { return !!a; },
        errMsg: 'value of $1 does not evaluate to true.'
      },
      assertEvaluatesToFalse: {
        expr: function (a:*):Boolean { return !a; },
        errMsg: 'value of $1 does not evaluate to false.'
      },
      assertContains: {
        expr: function (a:*, b:*):Boolean {
            if (typeof a != 'string' || typeof b != 'string') {
              throw('Bad argument to assertContains.');
            }
            return (a.indexOf(b) > -1);
        },
        errMsg: 'value of $1 does not contain $2.'
      }
    };

    private static var matchTypes:Object = {
      EXACT: 'exact',
      CONTAINS: 'contains'
    };

    public static function init():void {
      for (var p:String in WMAssert.assertTemplates) {
        WMAssert[p] = WMAssert.createAssert(p);
      }
    }

    private static function createAssert(meth:String):Function {
      // Makes sure each assert is called with the right
      // number of args
      // -------
      var validateArgs:Function = function(count:int,
          args:Array):Boolean {
        if (!(args.length == count ||
        (args.length == count + 1 && typeof(args[0]) == 'string') )) {
          throw('Incorrect arguments passed to assert function');
        }
        return true;
      }
      // Creates error message for each assert
      // -------
      var createErrMsg:Function = function (msg:String, arr:Array):String {
        var str:String = msg;
        for (var i:int = 0; i < arr.length; i++) {
          // When calling jum functions arr is an array with a null entry
          if (arr[i] != null){
            var val:* = arr[i];
            var display:String = '<' + val.toString().replace(/\n/g, '') +
              '> (' + getQualifiedClassName(val) + ')';
            str = str.replace('$' + (i + 1).toString(), display);
          }
        }
        return str;
      }
      // Function that runs the dynamically generated asserts
      // -------
      var doAssert:Function = function(...args):Boolean {
        // The actual assert method, e.g, 'equals'
        var meth:String = args.shift();
        // The assert object
        var asrt:Object = WMAssert.assertTemplates[meth]; 
        // The assert expresion
        var expr:Function = asrt.expr;
        // Validate the args passed
        var valid:Boolean = validateArgs(expr.length, args);
        // Pull off additional comment which may be first arg
        //var comment = args.length > expr.length ?
        //  args.shift() : null;
        // Run the assert
        var res:Boolean = expr.apply(null, args);
        if (res) {
          return true;
        }
        else {
          var message:String = meth + ' -- ' +
              createErrMsg(asrt.errMsg, args);
          throw new Error(message);
        }
      }
      // Return a function for each dynamically generated
      // assert in the assertTemplates list
      return function (...args):Boolean {
        args.unshift(meth);
        return doAssert.apply(null, args);
      }
    }

    public static function assertDisplayObject(params:Object):Boolean {
      var obj:* = WMLocator.lookupDisplayObject(params);
      if (!!obj) {
        return true;
      }
      else {
        throw new Error('Object ' + obj.toString() +
            ' does not exist.');
      }
    }

    public static function assertProperty(params:Object):Boolean {
      return WMAssert.doBaseAssert(params);
    }

    public static function assertText(params:Object):Boolean {
      return WMAssert.assertTextGeneric(params, true);
    }

    public static function assertTextIn(params:Object):Boolean {
      return WMAssert.assertTextGeneric(params, false);
    }
    
    private static function assertTextGeneric(params:Object,
        exact:Boolean):Boolean {
      return WMAssert.doBaseAssert(params, {
        attrName: ['htmlText', 'label'],
        preMatchProcess: function (str:String):String {
          return str.replace(/^\s*|\s*$/g, '');
        },
        matchType: exact ? WMAssert.matchTypes.EXACT :
            WMAssert.matchTypes.CONTAINS
      });
    }
    
    // Workhorse function that does all the main work for
    // most asserts
    private static function doBaseAssert(params:Object,
        opts:Object = null):Boolean {
      // Ref to the object to do the lookup on
      var obj:* = WMLocator.lookupDisplayObject(params);
      // Exact vs. 'in' (contains) match
      var matchType:String = WMAssert.matchTypes.EXACT;
      var attrName:String;
      var expectedVal:String;
      // Explicitly passing in the attr name, or a list of
      // possible names
      if (opts) {
        expectedVal = params.validator;
        if ('matchType' in opts) {
          matchType = opts.matchType;
        }
        // Passed attr name is a simple string, e.g.,
        // opts.attrName = 'label'
        if (opts.attrName is String) {
          attrName = opts.attrName;
          attrVal = obj[attrName];
        }
        // Passed attr is a list of possible ones
        // to look for, in order of priority
        // opts.attr = ['htmlText', 'label']
        else if (opts.attrName is Array) {
          for each (var item:String in opts.attrName) {
            if (item in obj) {
              attrName = item;
              attrVal = obj[attrName];
              break;
            }
          }
        }
      }
      // Attr name is passed as part of the validator using
      // the pipe syntax:
      // foo|bar (Check for attribute foo with value of bar)
      // foo.bar.baz|qux (Chained attr lookup -- look for
      //    bar on foo, then baz on bar, where baz has a
      //    value of qux.
      else {
        var validatorStr:String = params.validator;
        var validatorArr:Array = validatorStr.split('|');
        if (validatorArr.length != 2) {
          throw new Error('validator must have a pipe separator.');
        }
        attrName = validatorArr[0];
        expectedVal = validatorArr[1];
        // Attribute may be chained, so loop through any and
        // look up the attr we want to check the value on
        var attrArr:Array = attrName.split('.');
        var attrVal:Object;
        var key:String;
        while (attrArr.length) {
          if (!attrVal) {
            attrVal = obj;
          }
          key = attrArr.shift();
          if (key in attrVal) {
            attrName = key;
            attrVal = attrVal[attrName];
          }
          else {
            throw new Error('"' + key +
                '" attribute does not exist on this object.');
          }
        }
      }

      // Do any preprocessing of the value to check
      if (opts.preMatchProcess) {
        attrVal = opts.preMatchProcess(attrVal);
      }

      // Check for a match
      var ret:Boolean = false;
      var errMsg:String;
      if (matchType == WMAssert.matchTypes.EXACT) {
        ret = attrVal == expectedVal;
        errMsg = 'Expected "' + expectedVal + '", got "' + attrVal + '"';
      }
      else if (matchType == WMAssert.matchTypes.CONTAINS) {
        ret = attrVal.indexOf(expectedVal) > -1;
        errMsg = '"' + attrVal + '" did not contain "' + expectedVal + '"';
      }

      if (ret) {
        return ret;
      }
      else {
        throw new Error(errMsg);
      }
    }
  }
}
