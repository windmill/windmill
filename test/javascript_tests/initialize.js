
var windmillMain = new function () {
  var _STATIC_DIR = '/windmill-serv/jstest';
  this.pages = {
    MAIN: _STATIC_DIR + '/main.html',
    FORM: _STATIC_DIR + '/form.html'
  };
  this.tempData = null;
};
var wmAsserts = windmill.controller.asserts;
