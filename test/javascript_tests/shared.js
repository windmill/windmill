windmillMain.shared = {};

windmillMain.shared.util = new function () {
  this.getCurrentDir = function () {
    var loc = location.href;
    var str = loc.substring(0, loc.lastIndexOf('/'));
    return str + '/';
  };
  this.waitForTempData = {
    method: "waits.forJS",
    params: {
      js: function () { return !!windmillMain.tempData; }
    }
  };
};

windmillMain.shared.test_navMain = new function () {
  this.test_navigate = {
    method: "open",
    params: { url: windmillMain.pages.MAIN }
  };
  this.test_hasNavigated = {
    method: "waits.forElement",
    params: { id: "mainPageHeader" }
  };
};

windmillMain.shared.test_navForm = new function () {
  this.test_navigate = {
    method: "open",
    params: { url: windmillMain.pages.FORM }
  };
  this.test_hasNavigated = {
    method: "waits.forElement",
    params: { id: "formPageHeader" }
  };
};


