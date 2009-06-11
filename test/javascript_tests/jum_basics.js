windmill.jsTest.require('shared.js');

// Namespace obj to contain our tests
var test_jumBasics = new function () {
  // Navigate to the main page
  this.setup = windmillTestShared.test_navMain;

  this.test_assertTrue = function () {
    jum.assertTrue(true);
    jum.assertTrue('Rush: A Farewell To Kings'.indexOf('Rush') > -1);
  };
  this.test_assertFalse = function () {
    jum.assertFalse(false);
    jum.assertFalse('Rush: Caress of Steel'.indexOf('Neil Peart') > -1);
  };
  this.test_assertEquals = function () {
    jum.assertEquals(true, true);
    jum.assertEquals(2112, 2112);
    jum.assertEquals('Geddy', 'Geddy');
  };
  this.test_assertNotEquals = function () {
    jum.assertNotEquals(false, true);
    jum.assertNotEquals(2112, 1001);
    jum.assertNotEquals('Geddy', 'Alex');
  };
  this.test_assertGreaterThan = function () {
    jum.assertGreaterThan(2, 1);
  };
  this.test_assertLessThan = function () {
    jum.assertLessThan(1, 2);
  };
  this.test_assertNull = function () {
    jum.assertNull(null);
    jum.assertNull($('asdfasdfasdfasdfasdf'));
  };
  this.test_assertNotNull = function () {
    jum.assertNotNull('Grace Under Pressure');
    jum.assertNotNull(document.body);
  };
  this.test_assertUndefined = function () {
    var foo;
    jum.assertUndefined(foo);
  };
  this.test_assertNotUndefined = function () {
    jum.assertNotUndefined(null); // Strict equality
  };
  this.test_assertNaN = function () {
    jum.assertNaN('Temples of Syrinx');
  };
  this.test_assertNotNaN = function () {
    jum.assertNotNaN('2112'); // Numeric string
    jum.assertNotNaN(2112); // Actual number
  };
  this.test_assertEvaluatesToTrue = function () {
    jum.assertEvaluatesToTrue(2112);
    jum.assertEvaluatesToTrue('2112');
    jum.assertEvaluatesToTrue({});
  };
  this.test_assertEvaluatesToFalse = function () {
    var foo;
    jum.assertEvaluatesToFalse(foo);
    jum.assertEvaluatesToFalse(null);
    jum.assertEvaluatesToFalse(0);
    jum.assertEvaluatesToFalse('');
    jum.assertEvaluatesToFalse(NaN);
    var func = function () {};
    jum.assertEvaluatesToFalse(func());
  };
  this.test_assertContains = function () {
    jum.assertContains('Rush: Signals', 'Rush');
  };
};


