var EXPORTED_SYMBOLS = ["RemoteNode", "EventNode"];

Components.utils.import("resource://windmill/castile/json2.js")

var uuidgen = Components.classes["@mozilla.org/uuid-generator;1"]
    .getService(Components.interfaces.nsIUUIDGenerator);


var doRequest = function (method, url, body) {
  if (body == undefined) {
    var body = null;
  }
  var XMLHttpRequest = utils.getMethodInWindows('XMLHttpRequest');
  var req = new XMLHttpRequest();  
  req.open(method, url, false, username, password);
  req.setRequestHeader('User-Agent', 'windmill2');
  req.setRequestHeader('Content-Type', "application/json")
  req.send(body);
  if (req.status != 200) {
    throw "Request to delicious fails, status code "+req.status+". Message: "+String(req.responseText);
  }
  return req.responseText;
}


var RemoteNode = function (obj) {
  this.uri = obj.uri;
  this.ns = obj.namespace;
  this.description = obj;
}
RemoteNode.prototype.describe = function (name, depth) {
  if (depth == undefined) {
    var depth = 0;
  }
  var rURI = this.uri + '/' + this.ns + '/ror/describe/' + name + "?depth=" + String(depth);
  return JSON.parse(doRequest("GET", rURI));
}
RemoteNode.prototype.callFunction = function (name, args, kwargs) {
  var rURI = this.uri + '/' + this.ns + '/ror/callFunction/' + name;
  var body  = {"args":args, "kwargs":kwargs};
  return JSON.parse(doRequest("POST", rURI, JSON.stringify(body)));
}
RemoteNode.prototype.createInstance = function (name, args, kwargs) {
  var rURI = this.uri + '/' + this.ns + '/ror/createInstance/' + name;
  var body  = {"args":args, "kwargs":kwargs};
  return JSON.parse(doRequest("POST", rURI, JSON.stringify(body)));
}
RemoteNode.prototype.setAttribute = function (name, attr, obj, reference) {
  if (reference == undefined) {
    var reference = false;
  }
  var rURI = this.uri + '/' + this.ns + '/ror/setAttribute/' + name;
  var body = {"attribute":attr, "value":obj, "reference":reference};
  return JSON.parse(doRequest("POST", rURI, JSON.stringify(body)));
}
RemoteNode.prototype.setItem = function (name, attr, obj, reference) {
  if (reference == undefined) {
    var reference = false;
  }
  var rURI = this.uri + '/' + this.ns + '/ror/setItem/' + name;
  var body = {"attribute":attr, "value":obj, "reference":reference};
  return JSON.parse(doRequest("POST", rURI, JSON.stringify(body)));
}
RemoteNode.prototype.addListener = function (namespace) {
  var rURI = this.uri + '/listeners';
  return JSON.parse(doRequest("POST", rURI, JSON.stringify({"namespace":namespace})));
}
RemoteNode.prototype.fireEvent = function (e, obj) {
  var rURI = this.uri + e;
  doRequest("PUT", rURI, JSON.stringify(obj));
}


var EventNode = function (ns) {
  this.ns = ns;
  this.uri = null;
  this.nodes = {};
  this.objectMap = {"castileRegistry":{}};
  this.listeners = {};
}
EventNode.prototype.init = function (uri) {
  this.register(uri);
  this.uri = this.nodes[uri].uri + '/' + this.ns;
  // TODO: set this.description to a proper description object
}
EventNode.prototype.register = function (uri) {
  var obj = JSON.parse(doReqest("POST", 'TODO:: PATH TO REGISTER',
                                JSON.stringify(this.description)));
  var node = new RemoteNode(obj);
  this.nodes[uri] = node;
  this.nodes[obj.namespace] = node;
}
EventNode.prototype.add_object = function (name, obj) {
  this.objectMap[name] = obj;
}
EventNode.prototype.describe = function (name) {
  // TODO
}
EventNode.prototype.fireEvent = function (e, obj) {
  var firedListeners = [];
  var e = e.split('.');
  var event = null;
  for each(ev in e) {
    if (event == null) {
      var event = ev;
    } else {
      var event = event + '.' + ev
    }
    if (this.listeners[event] != undefined) {
      for each(listener in this.listeners[event]) {
        if (!arrays.inArray(firedListeners, )) {
          listener.fireEvent(e, obj);
          firedListeners.push(listener);  
        }
      }
    }
  } 
}
EventNode.prototype.addListener = function (e, listener) {
  if (this.listeners[e] == undefined) {
    this.listeners[e] = [];
  }
  this.listeners[e].push(listener);
}
EventNode.prototype.setItem = function (name, attribute, obj, reference) {
  if (!reference) {
    this.getObject(name)[attribute] = obj;
  } else {
    this.getObject(name)[attribute] = this.getObject(obj);
  }
}
EventNode.prototype.setAttribute = EventNode.prototype.setItem;
EventNode.prototype.getObject = function (name) {
  return eval("this.objectMap."+name);
}
EventNode.prototype.callFunction = function (name, args) {
  var r = this.getObject(name).call(args); // TODO: I don't think this is actually how you do this.
  var uuid = uuidgen.generateUUID().toString();
  this.objectMap.castileRegistry[uuid] = r;
  return "castileRegistry['"+uuid+"']";
}
EventNode.prototype.createInstance = function (name, args) {
  var r = new this.getObject(name).call(args); // TODO: I don't think this is actually how you do this.
  var uuid = uuidgen.generateUUID().toString();
  this.objectMap.castileRegistry[uuid] = r;
  return "castileRegistry['"+uuid+"']";
}
