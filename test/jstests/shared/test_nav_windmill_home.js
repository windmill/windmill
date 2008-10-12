
windmillHomeTest.shared.test_navWindmillHome = new function () {
  this.test_navigate = [
    { method: "open", params: { url: "http://www.getwindmill.com/features" } }
  ];
  this.test_hasNavigated = [
    { method: "waits.forElement", params: { id: "sidebar" } }
  ];
};

