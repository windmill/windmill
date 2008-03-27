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

//Used for getting xpaths for elements in the DOM based on a given node
function getXPath(node, path) {
    path = path || [];

    if(node.parentNode) {
      path = getXPath(node.parentNode, path);
    }

    if(node.previousSibling) {
      var count = 1;
      var sibling = node.previousSibling
      do {
        if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {count++;}
        sibling = sibling.previousSibling;
      } while(sibling);
      if(count == 1) {count = null;}
    } else if(node.nextSibling) {
      var sibling = node.nextSibling;
      do {
        if(sibling.nodeType == 1 && sibling.nodeName == node.nodeName) {
          var count = 1;
          sibling = null;
        } else {
          var count = null;
          sibling = sibling.previousSibling;
        }
      } while(sibling);
    }

    if(node.nodeType == 1) {
      if ($('absXpaths').checked){
        path.push(node.nodeName.toLowerCase() + (node.id ? "[@id='"+node.id+"']" : count > 0 ? "["+count+"]" : ''));
      }
      else{
        path.push(node.nodeName.toLowerCase() + (node.id ? "" : count > 0 ? "["+count+"]" : ''));
      }
    }
    return path;
  };
  
  function getXSPath(node){
    var xpArray = getXPath(node);
    var stringXpath = xpArray.join('/');
    stringXpath = '/'+stringXpath;
    stringXpath = stringXpath.replace('//','/');
    return stringXpath;
}
