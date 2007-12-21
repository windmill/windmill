
windmillHomeTest.shared.test_navWindmillBook = new function () {
  this.test_navigate = [
    { method: "open", params: { url: "http://windmill.osafoundation.org/trac/wiki/WindmillBook" } }
  ];
  this.test_hasNavigated = [
    { method: "waits.forElement", params: { id: "WindmillBook" } }
  ];
};

