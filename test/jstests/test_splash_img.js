
windmillHomeTest.test_splashPageImg = new function () {
  this.test_beginImageLoaded = function () {
    var img = $('mottoImgBegin');
    jum.assertImageLoaded(img);
    var alt = img.alt;
    jum.assertEquals(alt, 'Web UI testing ...');
  };
  this.test_endImageLoaded = function () {
    var img = $('mottoImgEnd');
    jum.assertImageLoaded(img);
    var alt = img.alt;
    jum.assertEquals(alt, 'The way it should be.');
  };
}
