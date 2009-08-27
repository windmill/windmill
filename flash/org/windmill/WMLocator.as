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
  import flash.display.DisplayObject;
  import flash.display.DisplayObjectContainer;

  public class WMLocator {
    // Stupid AS3 doesn't iterate over Object keys
    // in insertion order
    // null for the finder func means use the default
    // of findBySimpleAttr
    private static var locatorMap:Array = [
      ['name', null],
      ['id', null],
      ['link', WMLocator.findLink],
      ['label', null],
      ['htmlText', WMLocator.findHTML],
      ['automationName', null]
    ];
    private static var locatorMapObj:Object = {};
    private static var locatorMapCreated:Boolean = false;

    // This is the list of attrs we like to use for the
    // locators, in order of preference
    // FIXME: Need to add some regex fu for pawing through
    // text containers for Flash's janky anchor-tag impl
    private static var locatorLookupPriority:Array = [
      'automationName',
      'id',
      'name',
      'label',
      'htmlText'
    ];

    private static function init():void {
      for each (var arr:Array in WMLocator.locatorMap) {
        WMLocator.locatorMapObj[arr[0]] = arr[1];
      }
      WMLocator.locatorMapCreated = true;
    }

    public function WMLocator():void {}

    public static function lookupDisplayObject(
        params:Object):DisplayObject {
      if (!WMLocator.locatorMapCreated) {
        WMLocator.init();
      }
      var locators:Array = [];
      var queue:Array = [];
      var obj:* = Windmill.getTopLevel();
      var checkWMLocatorChain:Function = function (
          item:*, pos:int):DisplayObject {
        var map:Object = WMLocator.locatorMapObj;
        var loc:Object = locators[pos];
        // If nothing specific exists for that attr, use the basic one
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

    // Custom locator for links embedded in htmlText
    private static function findHTML(
        obj:*, attr:String, val:*):Boolean {
      var res:Boolean = false;
      if ('htmlText' in obj) {
        var text:String = WMLocator.cleanHTML(obj.htmlText);
        return val == text;
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
        linkPlain = WMLocator.cleanHTML(res[2]);
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

    private static function cleanHTML(markup:String):String {
      return markup.replace(/<.+?>/g, '').replace(
          /\s+/g, ' ').replace(/^ | $/g, '');
    }

    // Generates a chained-locator expression for the clicked-on item
    public static function generateLocator(item:*):String {
      var expr:String = '';
      var attr:String;
      var attrVal:String;
      // Attrs to look for, ordered by priority
      var locatorPriority:Array = WMLocator.locatorLookupPriority;
      do {
        for each (attr in locatorPriority) {
          // If we find one of the lookuup keys, prepend
          // on the locator expression
          if (attr in item && item[attr]) {
            attrVal = attr == 'htmlText' ?
                WMLocator.cleanHTML(item[attr]) : item[attr];
            expr = attr + ':' + attrVal + '/' + expr;
            break;
          }
        }
        item = item.parent;
      } while (item.parent)
      if (expr.length) {
        // Strip off trailing slash
        expr = expr.replace(/\/$/, '');
        return expr;
      }
      else {
        throw new Error('Could not find any usable attributes for locator.');
      }
    }
  }
}
