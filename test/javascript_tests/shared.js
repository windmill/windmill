var windmillTestShared = new function () {
  var _STATIC_DIR = '/windmill-serv/jstest';
  this.pages = {
    MAIN: _STATIC_DIR + '/main.html',
    FORM: _STATIC_DIR + '/form.html'
  };
  this.tempData = null;
};

windmillTestShared.util = new function () {
  this.getCurrentDir = function () {
    var loc = location.href;
    var str = loc.substring(0, loc.lastIndexOf('/'));
    return str + '/';
  };
  this.waitForTempData = {
    method: "waits.forJS",
    params: {
      js: function () { return !!windmillTestShared.tempData; }
    }
  };
};

windmillTestShared.test_navMain = new function () {
  this.test_navigate = {
    method: "open",
    params: { url: windmillTestShared.pages.MAIN }
  };
  this.test_hasNavigated = {
    method: "waits.forElement",
    params: { id: "mainPageHeader" }
  };
};

windmillTestShared.test_navForm = new function () {
  this.test_navigate = {
    method: "open",
    params: { url: windmillTestShared.pages.FORM }
  };
  this.test_hasNavigated = {
    method: "waits.forElement",
    params: { id: "formPageHeader" }
  };
};


