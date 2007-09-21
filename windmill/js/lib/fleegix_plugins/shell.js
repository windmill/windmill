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
};
fleegix.shell.Shell = function (input, output) {
  this.input = input;
  this.output = output;
  this.regIndex = fleegix.shell.registerShell(this);
  fleegix.event.listen(this.input, 'onkeydown', this, 'execCode');
};
fleegix.shell.Shell.prototype = new function () {
  this.history = [];
  this.historyPos = 0;
  this.result = '';
  this.execCode = function (e) {
    var code = this.input.value;
    if (code && e.keyCode == 13) {
      this.result = '';
      this.history.push(code);
      this.historyPos = this.history.length;
      // IE is such a piece of shit
      if (window.execScript) {
        var evalStr = 'try { fleegix.shell.shellRegistry[' +
          this.regIndex + '].result = eval("' + code +
          '"); } catch(e) { fleegix.shell.shellRegistry[' +
          this.regIndex + '].addErr("' + code + '", e); }';
        window.execScript(evalStr);
      }
      // Moz/Safari
      else {
        try {
            this.result = window.eval.call(window, code);
          }
        catch (e) {
          this.addErr(code, e);
        }
      }
      this.result = this.result || code;
      var res = '>>> ' + this.result + '<br/>';
      this.output.innerHTML += res;
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
};