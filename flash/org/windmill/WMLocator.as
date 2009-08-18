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
  import flash.display.DisplayObject;
  import flash.display.DisplayObjectContainer;

  public class WMLocator {
    public function WMLocator():void {}

    public static function lookupDisplayObject(
        params:Object):DisplayObject {
      WMLocator.init();
      var locators:Array = [];
      var queue:Array = [];
      var obj:* = params.context || Windmill.context;
      var checkWMLocatorChain:Function = function (
          item:*, pos:int):DisplayObject {
        var map:Object = WMLocator.locatorMapObj;
        var loc:Object = locators[pos];
        var finder:Function = map[loc.attr] || WMLocator.findBySimpleAttr;
        var next:int = pos + 1;
        if (!!finder(item, loc.attr, loc.val)) {
          // Move to the next locator in the chain
          // If it's the end of the chain, we have a winner
          if (next == locators.length) {
            return item;
          }
          // Otherwise recursively check the next link in
          // the locator chain
          var count:int = 0;
          if (item is DisplayObjectContainer) {
            count = item.numChildren;
          }
          if (count > 0) {
            var index:int = 0;
            while (index < count) {
              var kid:DisplayObject = item.getChildAt(index);
              var res:DisplayObject = checkWMLocatorChain(kid, next);
              if (res) {
                return res;
              }
              index++;
            }
          }
        }
        return null;
      };
      var str:String = normalizeWMLocator(params);
      locators = parseWMLocatorChainExpresson(str);
      queue.push(obj);
      while (queue.length) {
        // Otherwise grab the next item in the queue
        var item:* = queue.shift();
        // Append any kids to the end of the queue
        if (item is DisplayObjectContainer) {
          var count:int = item.numChildren;
          var index:int = 0;
          while (index < count) {
            var kid:DisplayObject = item.getChildAt(index);
            queue.push(kid);
            index++;
          }
        }
        var res:DisplayObject = checkWMLocatorChain(item, 0);
        // If this is a full match, we're done
        if (res) {
          return res;
        }
      }
      return null;
    }

    private static function parseWMLocatorChainExpresson(
        exprStr:String):Array {
      var locators:Array = [];
      var expr:Array = exprStr.split('/');
      var arr:Array;
      for each (var item:String in expr) {
        arr = item.split(':');
        locators.push({
          attr: arr[0],
          val: arr[1]
        });
      }
      return locators;
    }

    private static function normalizeWMLocator(params:Object):String {
      if ('chain' in params) {
        return params.chain;
      }
      else {
        var map:Object = WMLocator.locatorMap;
        var attr:String;
        var val:*;
        // WMLocators have an order of precedence -- ComboBox will
        // have a name/id, and its sub-options will have label
        // Make sure to do name-/id-based lookups first, label last
        for each (var item:Array in map) {
          if (item[0] in params) {
            attr = item[0];
            val = params[attr];
            break;
          }
        }
        return attr + ':' + val;
      }
    }

    // Default locator for all basic key/val attr matches
    private static function findBySimpleAttr(
        obj:*, attr:String, val:*):Boolean {
      return !!(attr in obj && obj[attr] == val);
    }

    // Custom locator for links embedded in htmlText
    private static function findLink(
        obj:*, attr:String, val:*):Boolean {
      var res:Boolean = false;
      if ('htmlText' in obj) {
        res = !!locateLinkHref(val, obj.htmlText);
      }
      return res;
    }

    // Used by the custom locator for links, above
    public static function locateLinkHref(linkText:String,
        htmlText:String):String {
      var pat:RegExp = /(<a.+?>)([\s\S]*?)(?:<\/a>)/gi;
      var res:Array;
      var linkPlain:String = '';
      while (!!(res = pat.exec(htmlText))) {
        // Remove HTML tags and linebreaks; and trim
        linkPlain = res[2].replace(/<.+?>/g, '').
            replace(/\s+/g, ' ').replace(/^ | $/g, '');
        if (linkPlain == linkText) {
          var evPat:RegExp = /href="event:(.*?)"/i;
          var arr:Array = evPat.exec(res[1]);
          if (!!(arr && arr[1])) {
            return arr[1];
          }
          else {
            return '';
          }
        }
      }
      return '';
    }

    // Stupid AS3 doesn't iterate over Object keys
    // in insertion order
    // null for the finder func means use the default
    // of findBySimpleAttr
    private static var locatorMap:Array = [
      ['name', null],
      ['id', null],
      ['link', WMLocator.findLink],
      ['label', null]
    ];

    private static var locatorMapObj:Object = {};

    private static function init():void {
      for each (var arr:Array in WMLocator.locatorMap) {
        WMLocator.locatorMapObj[arr[0]] = arr[1];
      }
    }

  }
}
