windmill.jsTest.require('test_splash_img.js');
windmill.jsTest.require('test_reload_test_code.js');
windmill.jsTest.require('test_jum_asserts.js');

var test_windmillHome = new function () {
  this.test_splashImage =  windmillHomeTest.test_splashPageImg;
  this.test_reloadTestCode = windmillHomeTest.test_reloadTestCode;
  this.test_jumAsserts = windmillHomeTest.test_jumAsserts;
};
