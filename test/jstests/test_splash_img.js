
windmillHomeTest.test_splashPageImg = new function () {
  this.test_beginImageLoaded = function () {
    var img = $('firefoxImg');
    jum.assertImageLoaded(img);
    var alt = img.alt;
    jum.assertEquals(alt, 'Firefox');
  };
  this.test_endImageLoaded = function () {
    var img = $('safariImg');
    jum.assertImageLoaded(img);
    var alt = img.alt;
    jum.assertEquals(alt, 'Safari');
  };
}
