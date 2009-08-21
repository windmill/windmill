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

  public class WMAssert {
    public function WMAssert():void {}

    private static var matchTypes:Object = {
      EXACT: 'exact',
      CONTAINS: 'contains'
    };

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
      return WMAssert.doAssert(params);
    }

    public static function assertText(params:Object):Boolean {
      return WMAssert.assertTextGeneric(params, true);
    }

    public static function assertTextIn(params:Object):Boolean {
      return WMAssert.assertTextGeneric(params, false);
    }
    
    private static function assertTextGeneric(params:Object,
        exact:Boolean):Boolean {
      return WMAssert.doAssert(params, {
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
    private static function doAssert(params:Object,
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
