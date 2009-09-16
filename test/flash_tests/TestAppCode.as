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

package {
  import mx.core.Application;
  import flash.display.MovieClip;
  import flash.events.*
  import mx.controls.*
  import mx.containers.Panel
  import mx.events.*
  import flash.utils.*;
  import flash.net.URLRequest;
  import flash.display.Stage;
  import flash.display.Sprite;
	import flash.geom.Rectangle;
  import util.DOMEventDrag;
  import flash.display.Sprite;
  import flash.geom.Point;
  import flash.external.ExternalInterface;
  import org.windmill.WMBootstrap;

  public class TestAppCode extends MovieClip {
    private var stg:Stage;
    private var spr:Sprite = new Sprite();
    private var draggable:Sprite;
    private var context:*;
    private var elems:Object = {};
    private var foo:Sprite;

    public function init(ctxt:Application):void {
      context = ctxt;
      stg = context.stage;


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

      // Text input
      var txtInput:TextInput = new TextInput();
      txtInput.name = 'testTextInput';
      panel.addChild(txtInput);
      txtInput.htmlText = 'This is a test.';
      elems.txtInput = txtInput

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

      spr.name = 'dragSprite';
      spr.graphics.clear()
      spr.graphics.beginFill(0x00ff00);
      spr.graphics.drawRect(0,0,100,100);
      stg.addChild(spr);

      spr.addEventListener(MouseEvent.MOUSE_DOWN, beginDrag);
      stg.addEventListener(MouseEvent.MOUSE_UP, endDrag);

      context.doubleClickEnabled = true;
      
      WMBootstrap.init(context);
      /*
      // Focus
      stg.addEventListener(FocusEvent.FOCUS_IN, evHandler);
      stg.addEventListener(FocusEvent.FOCUS_OUT, evHandler);
      // Keyboard
      stg.addEventListener(KeyboardEvent.KEY_DOWN, evHandler);
      stg.addEventListener(KeyboardEvent.KEY_UP, evHandler);
      // Mouse
      stg.addEventListener(MouseEvent.MOUSE_DOWN, evHandler);
      stg.addEventListener(MouseEvent.MOUSE_UP, evHandler);
      //stg.addEventListener(MouseEvent.MOUSE_MOVE, evHandler);
      stg.addEventListener(MouseEvent.DOUBLE_CLICK, evHandler);
      stg.addEventListener(MouseEvent.CLICK, evHandler);
      // Text
      stg.addEventListener(TextEvent.TEXT_INPUT, evHandler);
      stg.addEventListener(TextEvent.LINK, evHandler);
      // ComboBox
      box.addEventListener(ListEvent.CHANGE, evHandler);
      box.addEventListener(ListEvent.ITEM_ROLL_OVER, evHandler);
      box.addEventListener(ListEvent.ITEM_ROLL_OUT, evHandler);
      box.addEventListener(DropdownEvent.OPEN, evHandler);
      box.addEventListener(DropdownEvent.CLOSE, evHandler);
      box.addEventListener(ScrollEvent.SCROLL, evHandler);
      */


      /*
      org.windmill.WMController.click({
        label: 'Howdy'
      });

      org.windmill.WMController.click({
        link: 'This is a test link'
      });

      org.windmill.WMController.type({
        name: 'testText',
        text: 'Howdy, sir.'
      });
      */

    }
    private function evHandler(e:Event):void {
      var targ:* = e.target;
      trace(e.toString());
      trace(e.target.toString());
      trace(getQualifiedClassName(e.target));
    }

		private function beginDrag(e:MouseEvent):void {
      if (e.target.name == 'dragSprite') {
        DOMEventDrag.startDrag(spr);
        //spr.startDrag();
      }
    }
    private function endDrag(e:MouseEvent):void {
      if (e.target.name == 'dragSprite') {
        DOMEventDrag.stopDrag(spr);
      }
      //spr.stopDrag();
    }
  }
}
