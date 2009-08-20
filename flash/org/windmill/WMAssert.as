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
    
    public static function assertProperty(params:Object):Boolean {
      var obj:* = WMLocator.lookupDisplayObject(params);
      // validators can look like this:
      // foo|bar (Check for attribute foo with value of bar)
      // foo.bar.baz|qux (Chained attr lookup -- look for
      //    bar on foo, then baz on bar, where baz has a
      //    value of qux.
      var validator:Array = params.validator.split('|');
      if (validator.length != 2) {
        throw new Error('assertProperty needs a validator with a pipe separator.');
      }
      var attr:String = validator[0];
      var val:String = validator[1];
      // Attribute may be chained, so loop through any and
      // look up the attr we want to check the value on
      var attrArr:Array = attr.split('.');
      var objRef:Object;
      var key:String;
      while (attrArr.length) {
        if (!objRef) {
          objRef = obj;
        }
        key = attrArr.shift();
        if (key in objRef) {
          objRef = objRef[key];
        }
        else {
          throw new Error('"' + key + '" does not exist.');
        }
      }
      if (objRef == val) {
        return true;
      }
      else {
        throw new Error('"' + key + '" does not equal "' + val + '"');
      }
    }
  }
}
