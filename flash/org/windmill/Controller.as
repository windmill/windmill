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
	import org.windmill.events.*;
	import org.windmill.Locator;
	import flash.events.*
	import mx.events.*
	import flash.external.ExternalInterface;

	public class Controller {
		private static function _log(msg:*):void {
			ExternalInterface.call("logger", msg);
		}
		
		public function Controller():void {}

		public static function click(params:Object):void {
			var obj:* = Locator.lookupDisplayObject(params);
			// Give it focus
			Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
			// Down, (TextEvent.LINK,) up, click
			Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
					buttonDown: true });
			// If this is a link, do the TextEvent hokey-pokey
			// All events fire on the containing DisplayObject
			if ('link' in params) {
				var link:String = Locator.locateLinkHref(params.link,
					obj.htmlText);
				Events.triggerTextEvent(obj, TextEvent.LINK, {
						text: link });
			}
			Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
			Events.triggerMouseEvent(obj, MouseEvent.CLICK);
		}
		
		// Click alias functions
		public static function check(params:Object):void {
			return Controller.click(params);
		}
		public static function radio(params:Object):void {
			return Controller.click(params);
		}

		public static function doubleClick(params:Object):void {
			var obj:* = Locator.lookupDisplayObject(params);
			// Give it focus
			Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
			// First click
			// Down, (TextEvent.LINK,) up, click
			Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
					buttonDown: true });
			// If this is a link, do the TextEvent hokey-pokey
			// All events fire on the containing DisplayObject
			if ('link' in params) {
				var link:String = Locator.locateLinkHref(params.link,
					obj.htmlText);
				Events.triggerTextEvent(obj, TextEvent.LINK, {
						text: link });
			}
			Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
			Events.triggerMouseEvent(obj, MouseEvent.CLICK);
			// Second click
			// Down, (TextEvent.LINK,) up, double click
			Events.triggerMouseEvent(obj, MouseEvent.MOUSE_DOWN, {
					buttonDown: true });
			// TextEvent hokey-pokey, reprise
			if ('link' in params) {
				Events.triggerTextEvent(obj, TextEvent.LINK, {
						text: link });
			}
			Events.triggerMouseEvent(obj, MouseEvent.MOUSE_UP);
			Events.triggerMouseEvent(obj, MouseEvent.DOUBLE_CLICK);
		}

		public static function type(params:Object):void {
			// Look up the item to write to
			var obj:* = Locator.lookupDisplayObject(params);
			// Text to type out
			var str:String = params.text;
			// Char
			var currChar:String;
			// Char code
			var currCode:int;

			// Give the item focus
			Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
			// Clear out any value it previously had
			obj.text = '';

			// Write out the string, firing appropriate events as you go
			for (var i:int = 0; i < str.length; i++) {
				currChar = str.charAt(i);
				currCode = str.charCodeAt(i);
				// FIXME: In reality, capital letters / special chars
				// would be firing shift key events around these
				Events.triggerKeyboardEvent(obj, KeyboardEvent.KEY_DOWN, {
					charCode: currCode });
				// Append to the value
				obj.text += str.charAt(i);
				Events.triggerTextEvent(obj, TextEvent.TEXT_INPUT, {
						text: currChar });
				Events.triggerKeyboardEvent(obj, KeyboardEvent.KEY_UP, {
					charCode: currCode });
			}
		}

		public static function select(params:Object):void {
			// Look up the item to write to
			var obj:* = Locator.lookupDisplayObject(params);
			var sel:* = obj.selectedItem;
			var item:*;
			// Give the item focus
			Events.triggerFocusEvent(obj, FocusEvent.FOCUS_IN);
			// Set by index
			switch (true) {
				case ('index' in params):
					if (obj.selectedIndex != params.index) {
						Events.triggerListEvent(obj, ListEvent.CHANGE);
						obj.selectedIndex = params.index;
					}
					break;
				case ('label' in params):
				case ('text' in params):
					var targetLabel:String = params.label || params.text;
					// Can set a custom label field via labelField attr
					var labelField:String = obj.labelField ?
							obj.labelField : 'label';
					if (sel[labelField] != targetLabel) {
						Events.triggerListEvent(obj, ListEvent.CHANGE);
						for each (item in obj.dataProvider) {
							if (item[labelField] == targetLabel) {
								obj.selectedItem = item;
							}
						}
					}
					break;
				case ('data' in params):
				case ('value' in params):
					var targetData:String = params.data || params.value;
					if (sel.data != targetData) {
						Events.triggerListEvent(obj, ListEvent.CHANGE);
						for each (item in obj.dataProvider) {
							if (item.data == targetData) {
								obj.selectedItem = item;
							}
						}
					}
					break;
				default:
					// Do nothing
			}
		}
	}
}

