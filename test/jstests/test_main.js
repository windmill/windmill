windmill.jsTest.require('wait_xhr.js');
windmill.jsTest.require('json_dom.js');
windmill.jsTest.require('form_basics.js');
windmill.jsTest.require('scope.js');
windmill.jsTest.require('jum_basics.js');
windmill.jsTest.require('failures.js');

var TEST_FAILURES = false;

var test_main = new function () {
  this.test_waitForXHR = windmillMain.test_waitForXHR;
  this.test_jsonDom = windmillMain.test_jsonDom;
  this.test_formBasics = windmillMain.test_formBasics;
  this.test_scope = windmillMain.test_scope;
  this.test_jumBasics = windmillMain.test_jumBasics;
  if (TEST_FAILURES) {
    this.test_failures = windmillMain.test_failures
  }
};


