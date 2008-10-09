/*
 * Copyright 2006 Matthew Eernisse (mde@fleegix.org)
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
fleegix.hash = {};
fleegix.hash.Hash = function (d) {
  this.count = 0;
  this.items = {}; // Hash keys and their values
  this.order = []; // Array for sort order
  if (d) { this.defaultValue = d; };
};
fleegix.hash.Hash.prototype = new function () {
  // Private methods
  var getRandomKey = function () {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    var len = 16;
    var str = '';
    var mls = new Date().getTime();
    for (var i = 0; i < len; i++) {
      // In Safari 2 Math.random returns the same random
      // sequence after firing up the browser -- return
      // something randomish
      if (navigator.userAgent.indexOf('Safari/41') > -1) {
        rnum = (((mls / (i + 1)) + mls) % chars.length);
      }
      else {
        var rnum = (Math.random() * chars.length);
      }
      rnum = Math.floor(rnum);
      str += chars.substring(rnum, rnum + 1);
    }
    return str;
  };
  // Interface methods
  this.addItem = function (key, val) {
    if (typeof key != 'string') {
      throw('Hash only allows string keys.');
    }
    return this.setByKey(key, val);
  };
  this.addItemCreateKey = function (val) {
    var key = getRandomKey();
    this.setByKey(key, val);
    return key;
  };
  this.addItemCreateValue = function (key) {
    var val = getRandomKey();
    this.setByKey(key, val);
    return val;
  };
  this.getItem = function (p) {
    if (typeof p == 'string') {
      return this.getByKey(p);
    }
    else if (typeof p == 'number') {
      return this.getByIndex(p);
    }
  };
  this.setItem = function (p, val) {
    if (typeof p == 'string') {
      this.setByKey(p, val);
    }
    else if (typeof p == 'number') {
      this.setByIndex(p, val);
    }
  };
  this.removeItem = function (p) {
    if (typeof p == 'string') {
      this.removeByKey(p);
    }
    else if (typeof p == 'number') {
      this.removeByIndex(p);
    }
  };
  this.getByKey = function (key) {
    return this.items[key];
  };
  this.setByKey = function (key, val) {
    var v = null;
    if (typeof val == 'undefined') {
      v = this.defaultValue;
    }
    else { v = val; }
    if (typeof this.items[key] == 'undefined') {
      this.order[this.count] = key;
      this.count++;
    }
    this.items[key] = v;
    return this.items[key];
  };
  this.removeByKey = function (key) {
    if (typeof this.items[key] != 'undefined') {
      var pos = null;
      delete this.items[key]; // Remove the value
      // Find the key in the order list
      for (var i = 0; i < this.order.length; i++) {
        if (this.order[i] == key) {
          pos = i;
        }
      }
      this.order.splice(pos, 1); // Remove the key
      this.count--; // Decrement the length
    }
  };
  this.getByIndex = function (ind) {
    return this.items[this.order[ind]];
  };
  this.setByIndex = function (ind, val) {
    if (ind < 0 || ind >= this.count) {
      throw('Index out of bounds. Hash length is ' + this.count);
    }
    this.items[this.order[ind]] = val;
  };
  this.removeByIndex = function (pos) {
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      delete this.items[this.order[pos]]
      this.order.splice(pos, 1);
      this.count--;
      return true;
    }
    else {
      return false;
    }
  };
  this.hasKey = function (key) {
    return typeof this.items[key] != 'undefined';
  };
  this.hasValue = function (val) {
    for (var i = 0; i < this.order.length; i++) {
      if (this.items[this.order[i]] == val) {
        return true;
      }
    }
    return false;
  };
  this.getAllKeys = function (str) {
    return this.order.join(str);
  };
  this.replaceKey = function (oldKey, newKey) {
    // If item for newKey exists, nuke it
    if (this.hasKey(newKey)) {
      this.removeItem(newKey);
    }
    this.items[newKey] = this.items[oldKey];
    delete this.items[oldKey];
    for (var i = 0; i < this.order.length; i++) {
      if (this.order[i] == oldKey) {
        this.order[i] = newKey;
      }
    }
  };
  this.insertAtIndex = function (pos, key, val) {
    this.order.splice(pos, 0, key);
    this.items[key] = val;
    this.count++;
    return true;
  };
  this.insertAfterKey = function (refKey, key, val) {
    var pos = this.getPos(refKey);
    this.insertAtPos(pos, key, val);
  };
  this.pop = function () {
    var pos = this.count-1;
    var ret = this.items[this.order[pos]];
    if (typeof ret != 'undefined') {
      this.removeAtPos(pos);
      return ret;
    }
    else {
      return false;
    }
  };
  this.each = function (func, o) {
    var opts = o || {};
    var len = this.order.length;
    var start = opts.start ? opts.start : 0;
    var ceiling = opts.items ? (start + opts.items) : len;
    ceiling = (ceiling > len) ? len : ceiling;
    for (var i = start; i < ceiling; i++) {
      var key = this.order[i];
      var val = this.items[key];
      if (opts.keyOnly) {
        func(key);
      }
      else if (opts.valueOnly) {
        func(val);
      }
      else {
        func(val, key);
      }
    }
    return true;
  };
  this.eachKey = function (func) {
    this.each(func, { keyOnly: true });
  };
  this.eachValue = function (func) {
    this.each(func, { valueOnly: true });
  };
  this.clone = function () {
    var h = new Hash();
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      var val = this.items[key];
      h.setItem(key, val);
    }
    return h;
  };
  this.concat = function (hNew) {
    for (var i = 0; i < hNew.order.length; i++) {
      var key = hNew.order[i];
      var val = hNew.items[key];
      this.setItem(key, val);
    }
  };
  this.sort = function (s) {
    var c = s || fleegix.hash.sorts.ASCENDING_NOCASE;
    var arr = [];
    if (typeof c != 'function') {
      throw('Hash sort requires a valid comparator function.');
    }
    var comp = function (a, b) {
      return c(a.val, b.val);
    }
    for (var i = 0; i < this.order.length; i++) {
      var key = this.order[i];
      arr[i] = { key: key, val: this.items[key] };
    }
    arr.sort(comp);
    this.order = [];
    for (var i = 0; i < arr.length; i++) {
      this.order.push(arr[i].key);
    }
  };
  this.sortByKey = function (s) {
    var comp = s || fleegix.hash.sorts.ASCENDING;
    if (typeof compar != 'function') {
      throw('Hash sort requires a valid comparator function.');
    }
    this.order.sort(comp);
  };
};

// Stock comparators for sorts
fleegix.hash.sorts = {
  ASCENDING: function (a, b) {
    return (a >= b) ?  1 : -1;
  },
  DESCENDING: function (a, b) {
    return (a < b) ?  1 : -1;
  },
  ASCENDING_NOCASE: function (a, b) {
    return (a.toLowerCase() >=
      b.toLowerCase()) ? 1 : -1;
  },
  DESCENDING_NOCASE: function (a, b) {
    return (a.toLowerCase() <
      b.toLowerCase()) ? 1 : -1;
  }
};


