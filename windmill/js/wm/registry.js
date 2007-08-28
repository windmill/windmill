/*
Copyright 2006, Open Source Applications Foundation

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
windmill.registry.locator.push('id','link','xpath','jsid', 'name');
windmill.registry.option.push('text','url','option','validator','destination','stopOnFailure','showRemote', 'milliseconds');

//Setup method registry
windmill.registry.methods['open']           = {'locator': false, 'option': 'url' };
windmill.registry.methods['wait']           = {'locator': false, 'option': 'milliseconds' };
windmill.registry.methods['click']          = {'locator': true, 'option': false };
windmill.registry.methods['doubleClick']    = {'locator': true, 'option': false};
windmill.registry.methods['type']           = {'locator': true, 'option': 'text'};
windmill.registry.methods['radio']          = {'locator': true, 'option': false };
windmill.registry.methods['check']          = {'locator': true, 'option': false };
windmill.registry.methods['select']         = {'locator': true, 'option': 'option'};
windmill.registry.methods['assertProperty'] = {'locator': true, 'option': 'validator' };
windmill.registry.methods['assertText']     = {'locator': true, 'option': 'validator' };
windmill.registry.methods['assertValue']     = {'locator': true, 'option': 'validator' } ;
windmill.registry.methods['assertNode']     = {'locator': true, 'option': false } ;
windmill.registry.methods['assertImageLoaded']     = {'locator': true, 'option': false } ;
windmill.registry.methods['extensions.clickLozenge']   = {'locator': true, 'option': false };
windmill.registry.methods['cosmoDragDrop']  = {'locator': true, 'option':'destination'};
windmill.registry.methods['setOptions']     = {'locator': false, 'option':'stopOnFailure'};
windmill.registry.methods['reWriteAlert']   = {'locator': false, 'option': false };
windmill.registry.methods['storeURL']       = {'locator': true, 'option': false };
windmill.registry.methods['complex']        = {};

