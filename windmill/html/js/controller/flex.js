/*
Copyright 2009, Adam Christian (adam.christian@gmail.com) and Slide, Inc.

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

var _f = windmill.controller.flex;
_f.asserts = {};
_f.waits = {};

//find the swf locator if its there and return it
var findSWFLocator = function(paramObj){
  for (prop in paramObj){
    if (prop.indexOf("swf") != -1){
      return prop;
    }
  }
  throw ("Could not find a flex locator in the provided object");
};

//find an opt locator if its there and return it
var findOpt = function(paramObj){
  for (prop in paramObj){
    if (prop.indexOf("opt") != -1){
      return prop;
    }
  }
  throw ("Could not find a flex locator in the provided object");
};

//find any of the provided options for a select and return it
var findSWFOptions = function(paramObj){
  var arr = ["index", "label", "text", "data", "value"];

  for (var z=0; z < arr.length; z++){
      var val = paramObj[arr[z]];
      if (val != undefined){
        return arr[z]; 
      }
  }
  
  throw "We could not find a suitable option for the select";
};

var validate = function(res){
  if (res && res.message){
    throw res;
  }
  if (res == false){
    throw res;
  }
  return true;
};

_f.click = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var res = movie['fp_click'](params);
  validate(res);
};

_f.mouseOver = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf_","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var res = movie['fp_mouseOver'](params);
  validate(res);
};

_f.mouseOut = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf_","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var res = movie['fp_mouseOut'](params);
  validate(res);
};

_f.check = function (paramObj) {
  _f.click(paramObj);
};

_f.radio = function (paramObj) {
  _f.click(paramObj);
};

_f.doubleClick = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var res = movie['fp_click'](params);
    
  validate(res);
};

_f.type = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  params.text = paramObj.text;
  
  var res = movie['fp_type'](params);
    
  validate(res);
};

//breaks when you use a label instead of text
_f.select = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var val = findSWFOptions(paramObj);
  params[val] = paramObj[val];
  var res = movie['fp_select'](params);    
  validate(res);
};

_f.dragDropElemToElem = function (paramObj) {  
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var opt = findOpt(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  params[opt] = paramObj[opt];
  
  var res = movie['fp_dragDropElemToElem'](params);
  validate(res);
};

_f.dragDropToCoords = function (paramObj) {  
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  params['coords'] = paramObj['coords'];
  
  var res = movie['fp_dragDropToCoords'](params);
  validate(res);
};

_f.asserts.assertDisplayObject = function (paramObj){
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  var res = movie['fp_assertDisplayObject'](params);
  validate(res);
};

//breaking
_f.asserts.assertProperty = function (paramObj){
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  var params = {};
  params[loc] = paramObj[prop];
  params.validator = paramObj.validator;
  
  var res = movie['fp_assertProperty'](params);
  validate(res);
};

//breaking
_f.asserts.assertText = function (paramObj){
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  var params = {};
  params[loc] = paramObj[prop];
  params.validator = paramObj.validator;
  
  var res = movie['fp_assertText'](params);
  validate(res);
};

//breaking
_f.asserts.assertTextIn = function (paramObj){
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  var params = {};
  params[loc] = paramObj[prop];
  params.validator = paramObj.validator;
  
  var res = movie['fp_assertTextIn'](params);
  validate(res);
};

_f.waits.forDisplayObject = function (paramObj, obj){
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  var params = {};
  params[loc] = paramObj[prop];
  
  windmill.controller.waits.forDisplayObject({'aid': paramObj.aid, 'movie':movie, 'params':params}, obj);
  return true;
};

_f.waits.forFlash = function (paramObj, obj){
  var movie = lookupNode(paramObj);
  
  windmill.controller.waits.forFlash({'aid': paramObj.aid, 'movie':movie}, obj);
  return true;
};
