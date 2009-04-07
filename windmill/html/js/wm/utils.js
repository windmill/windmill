/*
Copyright 2006-2007, Open Source Applications Foundation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/***************************************/

windmill.service = new function() {
    //Dynamically build assertNots into the registry for every assert that isn't jum
    this.buildNotAsserts = function() {
        for (var meth in windmill.controller.asserts) {
            if ((meth.charAt(0) != '_') && (!windmill.controller.asserts[meth].jsUnitAssert) && (typeof(windmill.controller.asserts[meth]) != 'object')) {

                var newMethName = meth.replace('assert', '');
                windmill.registry.methods['asserts.assertNot' + newMethName] = {
                    'locator': windmill.registry.methods['asserts.' + meth].locator,
                    'option': windmill.registry.methods['asserts.' + meth].option
                };
            }
        }
    }

    this.getParsedLocation = function(loc) {
        var str = '';
        str += loc.protocol + '//' + loc.hostname;
        str += loc.port ? ':' + loc.port: '';
        return str;
    }

    //Set the URL we are starting out testing
    this.setStartURL = function() {
        windmill.locationObj = windmill.testWin().location;
        var jsonObject = new jsonCall('1.1', 'set_test_url');
        var params_obj = {};
        var loc = window.location;
        params_obj.url = windmill.service.getParsedLocation(loc);
        jsonObject.params = params_obj;
        var jsonString = JSON.stringify(jsonObject)

        var resp = function(str) { return true; }
        result = fleegix.xhr.doPost('/windmill-jsonrpc/', jsonString);
        resp(result);
    };

    //Set the URL we are testing in the python service
    this.setTestURL = function(url) {
        try {
            var jsonObject = new jsonCall('1.1', 'set_test_url');
            var params_obj = {};
            
            params_obj.url = url;
            jsonObject.params = params_obj;
            var jsonString = JSON.stringify(jsonObject)

            var resp = function(str) { return true; }
            result = fleegix.xhr.doPost('/windmill-jsonrpc/', jsonString);
            resp(result);
        }
        catch(er) {}
    };
};

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
        replObj[propName] = handleVariable(prop);
      }
    }
    return replObj;
  };
};
