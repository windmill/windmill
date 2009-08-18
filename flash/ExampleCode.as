package {
  import mx.core.Application;
  import flash.display.MovieClip;
  import flash.events.*
  import mx.controls.*
  import mx.containers.Panel
  import mx.events.*
  import flash.net.URLRequest;
  import flash.display.Sprite;
  import org.windmill.*;

  public class ExampleCode extends MovieClip {
    private var spr:Sprite = new Sprite();
    private var draggable:Sprite;
    private var context:*;
    private var elems:Object = {};

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

      spr.name = 'dragSprite';
      spr.graphics.clear()
      spr.graphics.beginFill(0x00ff00);
      spr.graphics.drawRect(0,0,100,100);
      subPanel.stage.addChild(spr);
      spr.addEventListener(MouseEvent.MOUSE_DOWN, beginDrag);
      subPanel.stage.addEventListener(MouseEvent.MOUSE_MOVE, doDrag);
      subPanel.stage.addEventListener(MouseEvent.MOUSE_UP, endDrag);

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
      //context.addEventListener(MouseEvent.MOUSE_MOVE, evHandler);
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

      org.windmill.Windmill.init({ context: context.stage });

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
      WMLogger.log(e.toString());
    }

		private function beginDrag(e:MouseEvent):void {
      draggable = spr;
    }
    private function doDrag(e:MouseEvent):void {
      if (draggable) {
        //WMLogger.log(e.toString());
        draggable.x = e.stageX;
        draggable.y = e.stageY;
      }
    }
    private function endDrag(e:MouseEvent):void {
      draggable = null;
    }
  }
}
