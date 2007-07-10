windmill.registry = new function () {

  this.methods = {};
  this.locator = [];
  this.option = [];

};

//Setup all the current methods supported
windmill.registry.locator.push('id','link','xpath','jsid', 'name');
windmill.registry.option.push('text','url','option','validator','destination','stopOnFailure','showRemote', 'milliseconds');

//Setup method registry
windmill.registry.methods['open'] = {'locator': false, 'option': 'url' };
windmill.registry.methods['click'] = {'locator': true, 'option': false };
windmill.registry.methods['wait'] = {'locator': false, 'option': 'milliseconds' };
windmill.registry.methods['radio'] = {'locator': true, 'option': false };
windmill.registry.methods['check'] = {'locator': true, 'option': false };
windmill.registry.methods['type'] = {'locator': true, 'option': 'text'};
windmill.registry.methods['verify'] = {'locator': true, 'option': 'text' } ;
windmill.registry.methods['select'] = {'locator': true, 'option': 'option'};
windmill.registry.methods['doubleClick'] = {'locator': true, 'option': false};
windmill.registry.methods['clickLozenge'] = {'locator': true, 'option': false };
windmill.registry.methods['cosmoDragDrop'] = {'locator': true, 'option':'destination'};
windmill.registry.methods['setOptions'] = {'locator': false, 'option':'stopOnFailure'};
windmill.registry.methods['reWriteAlert'] = {'locator': false, 'option': false };
windmill.registry.methods['defer'] = {'locator': false, 'option': false };