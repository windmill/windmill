windmill.jsTest.require('shared.js');

var test_waitForXHR = new function () {
  // Navigate to the main page
  this.setup = windmillTestShared.test_navMain;
  // Make the async XHR call
  this.test_xhrCall = function () {
    // Callback function -- sets temp flag to 'returned'
    var success = function () {
      windmillTestShared.tempData = 'returned';
    };
    fleegix.xhr.get(success, '/windmill-serv/jstest/data.json');
  };
  this.test_wait = windmillTestShared.util.waitForTempData;
  this.test_afterWait = function () {
    jum.assertEquals('returned', windmillTestShared.tempData);
  };
  // Remove the temp data so we can run the test again
  this.teardown = function () {
    windmillTestShared.tempData = null;
  };
};

