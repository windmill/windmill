/*
 * Copyright 2007 Matthew Eernisse (mde@fleegix.org)
 * and Open Source Applications Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
if (typeof fleegix == 'undefined') { var fleegix = {}; }

fleegix.shell = new function () {
  this.shellRegistry = [];
  this.registerShell = function (sh) {
    this.shellRegistry.push(sh);
    return this.shellRegistry.length - 1;
  };
  this.currentShell = null;
  this.inspect = function (obj) {
    return this.currentShell.inspect(obj);
  };
};
fleegix.shell.Shell = function (input, output) {
  this.input = input;
  this.output = output;
  // For now, explorer output hard-coded to go to
  // normal output node
  this.explorer = output;
  this.regIndex = fleegix.shell.registerShell(this);
  this.initScroll = false;
  fleegix.event.listen(this.input, 'onkeydown', this, 'execCode');
  fleegix.shell.currentShell = this;
};
fleegix.shell.Shell.prototype = new function () {
  var brokenEval;
  var _createElem = function (s) {
    return document.createElement(s); };
  var _createText = function (s) {
    return document.createTextNode(s); };
  function createItemEntry(node, name, item, context) {
    var _this = context;
    var str = item + ' ';
    if (_this.explorer && name) {
      str = name + ': ' + str;
    }
    node.innerHTML = str;
    if (_this.explorer && typeof item == 'object') {
      var a = _createElem('a');
      var f = function () { _this.addExplorerEntry(
        _this.inspect(item)); };
      a.href = '#';
      a.appendChild(_createText('[+]'));
      node.appendChild(a);
      fleegix.event.listen(a, 'onclick', f);
    }
    return node;
  }
  function shouldAutoScroll(o) {
    return (o.scrollTop == (o.scrollHeight - o.clientHeight));
  }
  function isFirstAutoScrollSet(init, o) {
    return (!init && (o.scrollHeight > o.clientHeight));
  }
  function appendScriptTag(code) {
    var scr = _createElem('script');
    scr.type = 'text/javascript';
    var head = document.getElementsByTagName("head")[0] ||
      document.documentElement;
    scr.appendChild(_createText(code));
    head.appendChild(scr);
    head.removeChild(scr);
    return true;
  }
  this.history = [];
  this.historyPos = 0;
  this.result = '';
  this.execCode = function (e) {
    var code = this.input.value;
    if (code && e.keyCode == 13) {
      // Test to see if eval works
      if (typeof brokenEval == 'undefined') {
        window.eval.call(window, 'var __EVAL_TEST__ = true;');
        if (typeof window.__EVAL_TEST__ != 'boolean') {
          brokenEval = true;
        }
        else {
          brokenEval = false;
          delete window.__EVAL_TEST__;
        }
      }
      this.result = '';
      this.history.push(code);
      this.historyPos = this.history.length;
      if (brokenEval) {
        var evalStr = 'try { fleegix.shell.shellRegistry[' +
          this.regIndex + '].result = eval("' + code +
          '"); } catch(e) { fleegix.shell.shellRegistry[' +
          this.regIndex + '].addErr("' + code + '", e); }';
        // IE is such a piece of shit
        if (window.execScript) {
          window.execScript(evalStr);
        }
        // Safari 2 sucks too
        else {
          appendScriptTag(evalStr);
        }
      }
      // Browsers with a working eval
      else {
        try {
            this.result = window.eval.call(window, code);
          }
        catch (e) {
          this.addErr(code, e);
        }
      }
      var span = _createElem('span');
      var div = _createElem('div');
      var res = this.result || code;
      span = createItemEntry(span, null, res, this);

      var follow = false;
      // Check if it should be auto-scrolling
      if (shouldAutoScroll(this.output)) {
        var follow = true;
      }

      div.appendChild(_createText('>>>'));
      div.appendChild(span);
      this.output.appendChild(div);

      // Do auto scrolling if currently auto-scrolled, or if
      // setting auto-scroll for the first time
      if (follow ||
        (isFirstAutoScrollSet(this.initScroll, this.output))) {
        this.output.scrollTop = (this.output.scrollHeight - this.output.clientHeight);
        this.initScroll = true;
      }

      this.input.value = '';
    }
    else if (e.keyCode == 38) {
      this.historyPos--;
      this.historyPos = this.historyPos < 0 ? 0 : this.historyPos;
      this.input.value = this.history[this.historyPos];
    }
    else if (e.keyCode == 40) {
      var max = this.history.length - 1;
      this.historyPos++;
      this.historyPos = this.historyPos > max ? max : this.historyPos;
      this.input.value = this.history[this.historyPos];
    }
  };
  this.addErr = function (code, e) {
    this.result = code + '<br/>' + e.message;
  };
  this.addExplorerEntry = function (node) {
    var follow = false;
    // Check if it should be auto-scrolling
    if (shouldAutoScroll(this.output)) {
      var follow = true;
    }
    this.explorer.appendChild(node);
    // Do auto scrolling if currently auto-scrolled, or if
    // setting auto-scroll for the first time
    if (follow ||
      (isFirstAutoScrollSet(this.initScroll, this.output))) {
      this.output.scrollTop = (this.output.scrollHeight - this.output.clientHeight);
      this.initScroll = true;
    }
  };
  this.inspect = function (obj) {
    var _this = this;
    var main = _createElem('div');
    for (var i in obj) {
      var d = _createElem('div');
      var item = obj[i];
      d = createItemEntry(d, i, obj[i], this);
      main.appendChild(d);
    }
    if (!main.hasChildNodes()) {
      main.appendChild(
        _createText('This object has no properties to display.'));
    }
    return main;
  };
};

