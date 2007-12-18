windmill.utilities = new function () {
  //Append code and execute it
  this.appendScriptTag = function(win, code) {
    var script = win.document.createElement('script');
    script.type = 'text/javascript';
    var head = win.document.getElementsByTagName("head")[0] ||
      win.document.documentElement;
    if (document.all) {
      script.text = code;
    }
    else {
      script.appendChild(win.document.createTextNode(code));
    }
    head.appendChild(script);
    head.removeChild(script);
    return true;
  };
  
  this.appendScript = function(win, url) {
    var script = win.document.createElement('script');
    script.type = 'text/javascript';
    var head = win.document.getElementsByTagName("head")[0] ||
      win.document.documentElement;
      script.src = url;
    head.appendChild(script);
    return true;
  };
  
  //Grab a file with xhr
  this.getFile = function (path) {
    var file = fleegix.xhr.doReq({ url: path,
	  async: false });
    return file;
  };
  
  // Do string replacements for {$*} shortcuts
  this.doShortcutStringReplacements = function (paramObj) {
    var replObj = paramObj || {};
    for (var propName in replObj) {
      var prop = replObj[propName];
      if (typeof prop == 'string' && prop.indexOf('{$') > -1) {
        replObj[propName] = windmill.controller.handleVariable(prop);
      }
    }
    return replObj;
  };
};
