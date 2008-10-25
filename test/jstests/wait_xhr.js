windmill.jsTest.require('shared.js');

// Namespace obj to contain our tests
windmillMain.test_waitForXHR = new function () {
  // Make the async XHR call
  this.test_xhrCall = function () {
    // Callback function -- sets temp flag to 'returned'
    var success = function () {
      windmillMain.tempData = 'returned';
    };
    fleegix.xhr.get(success, '/test.txt');
  };
  this.test_wait = windmillMain.shared.util.waitForTempData;
  this.test_afterWait = function () {
    jum.assertEquals('returned', windmillMain.tempData);
  };
  // Remove the node so we can run the test again
  this.teardown = function () {
    windmillMain.tempData = null;
  }
};

