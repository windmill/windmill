
windmillHomeTest.shared.test_navWindmillHome = new function () {
  this.test_navigate = [
    { method: "open", params: { url: "http://windmill.osafoundation.org/" } }
  ];
  this.test_hasNavigated = [
    { method: "waits.forElement", params: { id: "wSideContainer" } }
  ];
};

