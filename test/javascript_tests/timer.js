windmill.jsTest.require('shared.js');

windmillMain.test_timer = new function () {
  this.setup = windmillMain.shared.test_navMain;
  this.test_timerObj = function () {
    var t = new windmill.jsTest.Timer();
    t.start();
    var str = '';
    while (str.length < 10000) {
      str += 'asdf';
    }
    t.finish();
    // t.time should be a number -- may actually
    // zero in Safari
    jum.assertTrue(!isNaN(t.time));
  };
};


