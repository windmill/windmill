// A useful shortcut for our test code
var wmAsserts = windmill.controller.asserts;
// Set this to see if test failures are reported correctly
var TEST_FAILURES = false;

// Use this to set the order you want your tests to run
var registeredTests = [
  'test_jsonDom',
  'test_waitForXHR',
  'test_formBasics',
  'test_jumBasics',
  'test_scope',
  'test_timer'
];

// Test the test failures last if we're checking them
if (TEST_FAILURES) {
  registeredTests.push('test_failures');
}

// Register top-level test namespaces in the order
// we want to run them
windmill.jsTest.register(registeredTests);

// Set this to true to run *only* the registered tests
// Defaults to false, so registered tests run first --
// all others run in the order they're found by the parser
//windmill.jsTest.runRegisteredTestsOnly = true;

// Pull in the code for all the tests
windmill.jsTest.require('json_dom.js');
windmill.jsTest.require('wait_xhr.js');
windmill.jsTest.require('form_basics.js');
windmill.jsTest.require('jum_basics.js');
windmill.jsTest.require('scope.js');
windmill.jsTest.require('timer.js');
windmill.jsTest.require('failures.js');


