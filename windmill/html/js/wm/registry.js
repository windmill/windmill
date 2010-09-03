/*
Copyright 2006-2007, Open Source Applications Foundation

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

windmill.registry = new function () {
  this.methods  = {};
  this.locator = [];
  this.option  = [];
};

//Setup all the current methods supported
windmill.registry.locator = ['id','link','xpath','jsid', 'name','value','classname', 'tagname','label','jquery', 'string', 'rteID','chain','--'];
//windmill.registry.locator.push('id','link','xpath','jsid', 'name','classname', 'tagname');

for( var i=0; i<windmill.registry.locator.length;i++ ){
  windmill.registry.option.push('opt'+windmill.registry.locator[i]);
}

windmill.registry.option.push('text','url','option','validator','destination','stopOnFailure', 'milliseconds', 'timeout','js', 'status','domain', 'coords', 'pixels', 'val');

//Setup method registry
windmill.registry.methods = {
  '-- Mouse --': {'locator': false, 'option': false, 'section': true},
  'click': {'locator': true, 'option': false},
  'rightClick': {'locator': true, 'option': false},
  'doubleClick': {'locator': true, 'option': false},
  'mouseDown': {'locator': true, 'option': false},
  'mouseMove': {'locator': false, 'option': 'coords'},
  'mouseMoveTo': {'locator': false, 'option': 'coords'},
  'mouseUp': {'locator': true, 'option': false},
  'mouseOut': {'locator': true,'option': false},
  'mouseOver': {'locator': true,'option': false},
  'dragDropElem': {'locator': true,'option': 'pixels'},
  'dragDropAbs': {'locator': true,'option': 'coords'},
  'dragDropElemToAbs': {'locator': true,'option': 'coords'},
  'dragDropElemToElem': {'locator': true,'option': true, 'optionIsLocator': true},
  'radio': {'locator': true, 'option': false },
  'check': {'locator': true, 'option': false },
  'select': {'locator': true, 'option': 'option,val,index'},
  'selectReset': {'locator': true, 'option': false },
  '-- Keyboard --': {'locator': false, 'option': false, 'section': true},
  'type': {'locator': true, 'option': 'text'},
  'keyPress': {'locator': true, 'option': 'options'},
  'keyDown': {'locator': true, 'option': 'options'},
  'keyUp': {'locator': true, 'option': 'options'},
  '-- Browser --': {'locator': false, 'option': false, 'section': true},
  'open': {'locator': false, 'option': 'url' },
  'goBack': {'locator': false, 'option': false },
  'goForward': {'locator': false, 'option': false },
  'refresh': {'locator': false, 'option': false },
  'scroll': {'locator': false, 'option': 'coords' },
  '-- Waits --': {'locator': false, 'option': false, 'section': true},
  'waits.sleep': {'locator': false, 'option': 'milliseconds' },
  'waits.forElement': {'locator': true, 'option': 'timeout' },
  'waits.forNotElement': {'locator': true, 'option': 'timeout' },
  'waits.forJS': {'locator': false, 'option': 'js' },
  'waits.forElementProperty': {'locator': true, 'option': 'option' },
  'waits.forPageLoad': {'locator': false, 'option': 'timeout' },
  '-- Other --': {'locator': false, 'option': false, 'section': true},
  'closeWindow': {'locator': false, 'option': false},
  'execJS': {'locator': false, 'option': 'js' },
  'execIDEJS': {'locator': false, 'option': 'js' },
  'execJQuery': {'locator': false, 'option': 'jquery' },
  'overrideDialogs': {'locator': false, 'option': false },
  'revertWindow': {'locator': false, 'option': false},
  'reWriteAlert': {'locator': false, 'option': false },
  'setPromptDefault': {'locator': false, 'option': 'val' },
  'setTestWindow': {'locator': false, 'option': 'path'},
  'setWindowByTitle': {'locator': false, 'option': 'title'},
  'setDocDomain': {'locator': false, 'option': 'domain' },
  'setOptions': {'locator': false, 'option':'stopOnFailure'},
  'show': {'locator': true, 'option':false},
  'lookup': {'locator': true, 'option':false},
  'storeURL': {'locator': true, 'option': false },
  'storeVarFromJS': {'locator': false, 'option': 'options' },
  'storeVarFromIDEJS': {'locator': false, 'option': 'options' },
  'storeVarFromLocAttrib': {'locator': true, 'option': 'options' },
  'triggerEvent': {'locator': true, 'option': 'option' },
  '-- Flash --': {'locator': false, 'option': false, 'section': true},
  'flex.click': {'swf':true, 'locator': true, 'option': false},
  'flex.mouseOver': {'swf':true, 'locator': true, 'option': false},
  'flex.mouseOut': {'swf':true, 'locator': true, 'option': false},
  'flex.check': {'swf':true, 'locator': true, 'option': false},
  'flex.radio': {'swf':true, 'locator': true, 'option': false},  
  'flex.type': {'swf':true, 'locator': true, 'option': 'text'},
  'flex.select': {'swf':true, 'locator': true, 'option': 'text,index,label,data,value'},
  'flex.dragDropElemToElem': {'swf':true, 'locator': true, 'option': true, 'optionIsLocator': true},
  'flex.dragDropToCoords': {'swf':true, 'locator': true, 'option': 'coords'},
  'flex.asserts.assertDisplayObject': {'swf':true, 'locator': true, 'option': false},
  'flex.asserts.assertProperty': {'swf':true, 'locator': true, 'option': 'validator'},
  'flex.waits.forDisplayObject': {'swf':true, 'locator': true, 'option': false},
  'flex.waits.forFlash': {'swf':false, 'locator': true, 'option': false},
  '-- Asserts --': {'locator': false, 'option': false, 'section': true},
  'asserts.assertJS': {'locator': false, 'option': 'js' },
  'asserts.assertIDEJS': {'locator': false, 'option': 'js' },
  'asserts.assertElemJS': {'locator': true, 'option': 'js' },
  'asserts.assertProperty': {'locator': true, 'option': 'validator' },
  'asserts.assertText': {'locator': true, 'option': 'validator' },
  'asserts.assertTextIn': {'locator': true, 'option': 'validator' },
  'asserts.assertValue': {'locator': true, 'option': 'validator' },
  'asserts.assertValueIn': {'locator': true, 'option': 'validator' },
  'asserts.assertChecked': {'locator': true, 'option': false },
  'asserts.assertSelected': {'locator': true, 'option': 'validator' } ,
  'asserts.assertNode': {'locator': true, 'option': false },
  'asserts.assertImageLoaded': {'locator': true, 'option': false },
  'asserts.assertNotChecked': {'locator': true, 'option': false }
};
