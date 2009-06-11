windmill.jsTest.require('shared.js');

// Namespace obj to contain our tests
var test_scope = new function () {
  // Get a reference to this obj for comparison
  // in test_verifyThisIsThis
  var _this = this;
  // Navigate to the main page
  this.setup = windmillTestShared.test_navMain;
  this.test_verifyThisIsThis = function () {
    // Make sure these functions get the right
    // execution scope
    jum.assertEquals(_this, this);
  };
};

