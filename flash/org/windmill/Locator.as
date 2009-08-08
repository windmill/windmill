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
	import flash.external.ExternalInterface;

	public class Locator {
		private static function _log(msg:*):void {
			ExternalInterface.call("logger", msg);
		}
		public function Locator():void {}

		public static function lookupDisplayObject(
				params:Object):DisplayObject {
			var obj:* = params.context || Windmill.context;
			var map:Object = Locator.locatorMap;
			var finder:Function;
			var attr:String;
			var val:*;
			// Locators have an order of precedence -- ComboBox will
			// have a name/id, and its sub-options will have label
			// Make sure to do name-/id-based lookups first, label last
			for each (var item:Array in map) {
				if (item[0] in params) {
					attr = item[0];
					finder = item[1];
					val = params[attr];
					break;
				}
			}
			// Return value -- if no matches are found, this remains unset
			// and returns with its value of null
			var res:DisplayObject;
			// Short-circuit flag for the recursion
			var found:Boolean = false;
			// Recursive function -- examine this obj and all
			// objs it contains for the attr/value specified
			var examineKids:Function = function (obj:*):void {
				// Examine the obj first -- container objects may
				// actually be the object we're looking for
				if (!!finder(obj, attr, val)) {
					res = obj;
					found = true;
				}
				// If this is not the droids we're looking for, and
				// there are contained objects, recurse through them
				if (!found) {
					var count:int = 0;
					if (obj is DisplayObjectContainer) {
						count = obj.numChildren;
					}
					if (count > 0) {
						var index:int = 0;
						// Keep looking as long as the short-circuit switch
						// isn't thrown
						while (!found && (index < count)) {
							examineKids(obj.getChildAt(index));
							index++;
						}
					}
				}
			}
			examineKids(obj);
			return res;
		}

		private static function findBySimpleAttr(
				obj:*, attr:String, val:*):Boolean {
			return !!(attr in obj && obj[attr] == val);
		}
	
		private static function findLink(
				obj:*, attr:String, val:*):Boolean {
			var res:Boolean = false; 
			if ('htmlText' in obj) {
				res = !!locateLinkHref(val, obj.htmlText);
			}
			return res;
		}

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
		private static var locatorMap:Array = [
			['name', Locator.findBySimpleAttr],
			['id', Locator.findBySimpleAttr],
			['link', Locator.findLink],
			['label', Locator.findBySimpleAttr]
		];
	}
}
