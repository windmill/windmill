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

var _f = windmill.controller.flash;

//find the swf locator if its there and return it
var findSWFLocator = function(paramObj){
  for (prop in paramObj){
    if (prop.indexOf("swf") != -1){
      return prop;
    }
  }
  throw ("Could not find a flash locator in the provided object");
};

//find an opt locator if its there and return it
var findOpt = function(paramObj){
  for (prop in paramObj){
    if (prop.indexOf("opt") != -1){
      return prop;
    }
  }
  throw ("Could not find a flash locator in the provided object");
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

_f.click = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var res = movie['wm_click'](params);
    
  if (res){
    throw (JSON.stringify(res));
  }
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
  
  var res = movie['wm_click'](params);
    
  if (res){
    throw (JSON.stringify(res));
  }
};

_f.type = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  params.text = paramObj.text;
  
  var res = movie['wm_type'](params);
    
  if (res){
    throw (JSON.stringify(res));
  }
};

_f.select = function (paramObj) {
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  
  var val = findSWFOptions(paramObj);
  params[val] = paramObj[val];
    
  var res = movie['wm_type'](params);
    
  if (res){
    throw (JSON.stringify(res));
  }
};


_f.dragDropElemToElem = function (paramObj) {  
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var opt = findOpt(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  params[opt] = paramObj[opt];
  
  var res = movie['wm_dragDropElemToElem'](params);
    
  if (res){
    throw (JSON.stringify(res));
  }
};

_f.dragDropToCoords = function (paramObj) {  
  var movie = lookupNode(paramObj);
  var prop = findSWFLocator(paramObj);
  var loc = prop.replace("swf.","");
  
  var params = {};
  params[loc] = paramObj[prop];
  params['coords'] = paramObj['coords'];
  
  var res = movie['wm_dragDropToCoords'](params);
    
  if (res){
    throw (JSON.stringify(res));
  }
};