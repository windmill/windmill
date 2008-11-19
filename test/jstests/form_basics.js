windmill.jsTest.require('shared.js');

windmillMain.test_formBasics = new function () {
  // Navigate to the main page
  this.setup = windmillMain.shared.test_navForm;
  this.test_optionsLength = function () {
    var form = $('wmTestForm');
    var len = form.sciFiSelect.options.length;
    jum.assertEquals(4, len);
  }
  this.test_setText = [
    { method: "select", params: {id: 'sciFiSelect', option: 'Saturn 3'} }
  ];
  this.test_textValueJS = function () {
    var textSet = $('display').innerHTML.indexOf('Saturn 3') > -1;
    jum.assertTrue(textSet);
  };
  this.test_textValueAction = [
    { method: "asserts.assertText", params: {id: 'display',
      validator: 'Saturn 3'} }
  ];
  this.test_disableText = [
    { method: "click", params: {id: 'disableButton' } }
  ];
  this.test_disabledState = function () {
    var node = $('disableText');
    jum.assertTrue(node.disabled);
  };
  this.test_enableText = [
    { method: "click", params: {id: 'disableButton' } }
  ];
  this.test_enabledState = function () {
    var node = $('disableText');
    jum.assertFalse(node.disabled);
  };
  this.test_setVisibility = [
    { method: "click", params: {id: 'visibilityA' } },
    { method: "click", params: {id: 'visibilityB' } }
  ];
  this.test_visibilityStateVisible = function () {
    jum.assertEquals('visible', $('visA').style.visibility);
    jum.assertEquals('visible', $('visB').style.visibility);
  };
  this.test_visibilityStateStillHidden = function () {
    jum.assertNotEquals('visible', $('visC').style.visibility);
  };
};


