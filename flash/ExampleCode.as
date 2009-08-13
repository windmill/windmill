package {
	import mx.core.Application;
	import flash.display.MovieClip;
	import flash.events.*
	import flash.external.ExternalInterface;
	import mx.controls.*
	import mx.containers.Panel
	import mx.events.*
	import flash.net.URLRequest;
	import org.windmill.*;

	public class ExampleCode extends MovieClip {
		private var context:*;
		private var elems:Object = {};
		private function _log(msg:*):void {
			ExternalInterface.call("logger", msg);
		}

		public function init(ctxt:Application):void {
			context = ctxt;

			// Panel
			var panel:Panel = new Panel();
			context.addChild(panel);
			panel.id = 'mainPanel';
			panel.title = "Windmill Flash Tests";

			// TextArea
			var txtArea:TextArea = new TextArea();
			txtArea.name = 'testTextArea';
			panel.addChild(txtArea);
			elems.txtArea = txtArea;

			// Button
			var button:Button = new Button();
			button.id = 'howdyButton';
			button.label = 'Howdy';
			panel.addChild(button);

			var subPanel:Panel = new Panel();
			panel.addChild(subPanel);
			subPanel.id = 'subPanel';

			// Plain text field
			var txtField:Text = new Text();
			txtField.name = 'testText';
			subPanel.addChild(txtField);
			txtField.htmlText = 'This is some test text. <u><a href="event:foo">This is a <em>test</em> link</a></u>';

			// Combo box (select)
			var items:Array = [
				{
					dude: 'Geddy',
					data: 'bass'
				},
				{
					dude: 'Neil',
					data: 'drums'
				},
				{
					dude: 'Alex',
					data: 'guitar'
				}
			];
			var box:ComboBox = new ComboBox();
			box.labelField = 'dude';
			box.name = 'comboTest';
			box.dataProvider = items;
			box.selectedItem = items[1];
			subPanel.addChild(box);

			context.doubleClickEnabled = true;
			// Focus
			context.addEventListener(FocusEvent.FOCUS_IN, evHandler);
			context.addEventListener(FocusEvent.FOCUS_OUT, evHandler);
			// Keyboard
			//context.addEventListener(KeyboardEvent.KEY_DOWN, evHandler);
			//context.addEventListener(KeyboardEvent.KEY_UP, evHandler);
			// Mouse
			context.addEventListener(MouseEvent.MOUSE_DOWN, evHandler);
			context.addEventListener(MouseEvent.MOUSE_UP, evHandler);
			context.addEventListener(MouseEvent.DOUBLE_CLICK, evHandler);
			context.addEventListener(MouseEvent.CLICK, evHandler);
			// Text
			context.addEventListener(TextEvent.TEXT_INPUT, evHandler);
			context.addEventListener(TextEvent.LINK, evHandler);
			// ComboBox
			box.addEventListener(ListEvent.CHANGE, evHandler);
			box.addEventListener(ListEvent.ITEM_ROLL_OVER, evHandler);
			box.addEventListener(ListEvent.ITEM_ROLL_OUT, evHandler);
			box.addEventListener(DropdownEvent.OPEN, evHandler);
			box.addEventListener(DropdownEvent.CLOSE, evHandler);
			box.addEventListener(ScrollEvent.SCROLL, evHandler);

			ExternalInterface.addCallback('wmFlashClick', org.windmill.Controller.click);
			ExternalInterface.addCallback('wmFlashDoubleClick', org.windmill.Controller.doubleClick);
			ExternalInterface.addCallback('wmFlashType', org.windmill.Controller.type);
			ExternalInterface.addCallback('wmFlashSelect', org.windmill.Controller.select);
			org.windmill.Windmill.init({ context: context });

			/*
			org.windmill.Controller.click({
				label: 'Howdy'
			});

			org.windmill.Controller.click({
				link: 'This is a test link'
			});

			org.windmill.Controller.type({
				name: 'testText',
				text: 'Howdy, sir.'
			});
			*/
		}
		private function evHandler(e:Event):void {
			_log(e.target.toString());
			_log(e.toString());
		}

	}
}
