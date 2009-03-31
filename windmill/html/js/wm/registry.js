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
windmill.registry.locator = ['id','link','xpath','jsid', 'name','value','classname', 'tagname','label'];
//windmill.registry.locator.push('id','link','xpath','jsid', 'name','classname', 'tagname');

for( loc in windmill.registry.locator ){
  windmill.registry.option.push('opt'+loc);
}

windmill.registry.option.push('text','url','option','validator','destination','stopOnFailure', 'milliseconds', 'timeout','js', 'status','domain', 'coords', 'pixels', 'val');

//Setup method registry
windmill.registry.methods['-- Mouse --']        = {'locator': false, 'option': false, 'section': true};
windmill.registry.methods['click']               = {'locator': true, 'option': false };
windmill.registry.methods['doubleClick']         = {'locator': true, 'option': false};
windmill.registry.methods['mouseDown']           = {'locator': true, 'option': false};
windmill.registry.methods['mouseMove']           = {'locator': false, 'option': 'coords'};
windmill.registry.methods['mouseMoveTo']         = {'locator': false, 'option': 'coords'};
windmill.registry.methods['mouseUp']             = {'locator': true, 'option': false};
windmill.registry.methods['mouseOut']            = {'locator': true,'option': false};
windmill.registry.methods['mouseOver']           = {'locator': true,'option': false};
windmill.registry.methods['dragDropElem']        = {'locator': true,'option': 'pixels'};
windmill.registry.methods['dragDropAbs']         = {'locator': true,'option': 'coords'};
windmill.registry.methods['dragDropElemToElem']  = {'locator': true,'option': true, 'optionIsLocator': true};
windmill.registry.methods['radio']               = {'locator': true, 'option': false };
windmill.registry.methods['check']               = {'locator': true, 'option': false };
windmill.registry.methods['select']              = {'locator': true, 'option': 'option,val,index'};
windmill.registry.methods['-- Keyboard --']      = {'locator': false, 'option': false, 'section': true};
windmill.registry.methods['type']                = {'locator': true, 'option': 'text'};
windmill.registry.methods['keyPress']            = {'locator': true, 'option': 'options'};
windmill.registry.methods['keyDown']            = {'locator': true, 'option': 'options'};
windmill.registry.methods['keyUp']            = {'locator': true, 'option': 'options'};
windmill.registry.methods['-- Browser --']       = {'locator': false, 'option': false, 'section': true};
windmill.registry.methods['open']                = {'locator': false, 'option': 'url' };
windmill.registry.methods['goBack']              = {'locator': false, 'option': false };
windmill.registry.methods['goForward']           = {'locator': false, 'option': false };
windmill.registry.methods['refresh']             = {'locator': false, 'option': false };
windmill.registry.methods['scroll']              = {'locator': false, 'option': 'coords' };
windmill.registry.methods['-- Waits --']         = {'locator': false, 'option': false, 'section': true};
windmill.registry.methods['waits.sleep']         = {'locator': false, 'option': 'milliseconds' };
windmill.registry.methods['waits.forElement']     = {'locator': true, 'option': 'timeout' };
windmill.registry.methods['waits.forNotElement']  = {'locator': true, 'option': 'timeout' };
windmill.registry.methods['waits.forJS']        = {'locator': false, 'option': 'js' };
windmill.registry.methods['waits.forElementProperty']    = {'locator': true, 'option': 'option' };
windmill.registry.methods['waits.forPageLoad']    = {'locator': false, 'option': 'timeout' };
windmill.registry.methods['-- Other --']        = {'locator': false, 'option': false, 'section': true};
windmill.registry.methods['triggerEvent']    = {'locator': true, 'option': 'option' };
windmill.registry.methods['closeWindow']   = {'locator': false, 'option': false};
windmill.registry.methods['complex']            = {'locator': false, 'option': false };
windmill.registry.methods['execJsInTestWindow']   = {'locator': false, 'option': 'js' };
windmill.registry.methods['execIDEJS']            = {'locator': false, 'option': 'js' };
windmill.registry.methods['revertWindow']   = {'locator': false, 'option': false};
windmill.registry.methods['reWriteAlert']       = {'locator': false, 'option': false };
windmill.registry.methods['setPromptDefault']       = {'locator': false, 'option': 'val' };
windmill.registry.methods['setTestWindow']      = {'locator': false, 'option': 'path'};
windmill.registry.methods['setWindowByTitle']   = {'locator': false, 'option': 'title'};
windmill.registry.methods['setDocDomain']           = {'locator': false, 'option': 'domain' };
windmill.registry.methods['setOptions']         = {'locator': false, 'option':'stopOnFailure'};
windmill.registry.methods['storeURL']           = {'locator': true, 'option': false };
windmill.registry.methods['storeVarFromJS']     = {'locator': false, 'option': 'options' };
windmill.registry.methods['storeVarFromIDEJS']     = {'locator': false, 'option': 'options' };
windmill.registry.methods['storeVarFromLocAttrib']     = {'locator': true, 'option': 'options' };
windmill.registry.methods['-- Asserts --']        = {'locator': false, 'option': false, 'section': true};
windmill.registry.methods['asserts.assertJS']    = {'locator': false, 'option': 'js' };
windmill.registry.methods['asserts.assertElemJS']    = {'locator': true, 'option': 'js' };
windmill.registry.methods['asserts.assertProperty'] = {'locator': true, 'option': 'validator' };
windmill.registry.methods['asserts.assertText']     = {'locator': true, 'option': 'validator' };
windmill.registry.methods['asserts.assertValue']    = {'locator': true, 'option': 'validator' };
windmill.registry.methods['asserts.assertChecked']  = {'locator': true, 'option': false };
windmill.registry.methods['asserts.assertSelected'] = {'locator': true, 'option': 'validator' } ;
windmill.registry.methods['asserts.assertNode']     = {'locator': true, 'option': false };
windmill.registry.methods['asserts.assertImageLoaded']  = {'locator': true, 'option': false };
windmill.registry.methods['asserts.assertNotChecked']  = {'locator': true, 'option': false };