
windmillHomeTest.shared.test_navWindmillBook = new function () {
  this.test_navigate = [
    { method: "open", params: { url: "http://trac.getwindmill.com/wiki/WindmillBook" } }
  ];
  this.test_hasNavigated = [
    { method: "waits.forElement", params: { id: "WindmillBook" } }
  ];  
};

