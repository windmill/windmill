if(typeof fleegix=="undefined"){
var fleegix={};
}
fleegix.dom=new function(){
var _1=function(s){
if(document.all){
if(document.documentElement&&document.documentElement["client"+s]){
return document.documentElement["client"+s];
}else{
return document.body["client"+s];
}
}else{
return window["inner"+s];
}
};
this.getViewportWidth=function(){
return _1("Width");
};
this.getViewportHeight=function(){
return _1("Height");
};
this.center=function(_3){
var nW=_3.offsetWidth;
var nH=_3.offsetHeight;
var vW=fleegix.dom.getViewportWidth();
var vH=fleegix.dom.getViewportHeight();
_3.style.left=parseInt((vW/2)-(nW/2))+"px";
_3.style.top=parseInt((vH/2)-(nH/2))+"px";
return true;
};
};
fleegix.popup=new function(){
var _8=this;
this.win=null;
this.open=function(_9,_a){
var _b=_a||{};
var _c="";
var _d={"width":"","height":"","location":0,"menubar":0,"resizable":1,"scrollbars":0,"status":0,"titlebar":1,"toolbar":0};
for(var _e in _d){
_c+=_e+"=";
_c+=_b[_e]?_b[_e]:_d[_e];
_c+=",";
}
var _f=_c.length;
if(_f){
_c=_c.substr(0,_f-1);
}
if(!_8.win||_8.win.closed){
_8.win=window.open(_9,"thePopupWin",_c);
}else{
_8.win.focus();
_8.win.document.location=_9;
}
};
this.close=function(){
if(_8.win){
_8.win.window.close();
_8.win=null;
}
};
this.goURLMainWin=function(url){
location=url;
_8.close();
};
};
fleegix.popup.constructor=null;
fleegix.form={};
fleegix.form.serialize=function(f,o){
var h=fleegix.form.toHash(f);
var _14=o||{};
var str="";
var pat=null;
if(_14.stripTags){
pat=/<[^>]*>/g;
}
for(var n in h){
var s="";
var v=h[n];
if(v){
if(typeof v=="string"){
s=_14.stripTags?v.replace(pat,""):v;
str+=n+"="+encodeURIComponent(s);
}else{
var sep="";
if(_14.collapseMulti){
sep=",";
str+=n+"=";
}else{
sep="&";
}
for(var j=0;j<v.length;j++){
s=_14.stripTags?v[j].replace(pat,""):v[j];
s=(!_14.collapseMulti)?n+"="+encodeURIComponent(s):encodeURIComponent(s);
str+=s+sep;
}
str=str.substr(0,str.length-1);
}
str+="&";
}else{
if(_14.includeEmpty){
str+=n+"=&";
}
}
}
str=str.substr(0,str.length-1);
return str;
};
fleegix.form.toHash=function(f){
var h={};
function expandToArr(_1e,val){
if(_1e){
var r=null;
if(typeof _1e=="string"){
r=[];
r.push(_1e);
}else{
r=_1e;
}
r.push(val);
return r;
}else{
return val;
}
}
for(i=0;i<f.elements.length;i++){
elem=f.elements[i];
switch(elem.type){
case "text":
case "hidden":
case "password":
case "textarea":
case "select-one":
h[elem.name]=elem.value||null;
break;
case "select-multiple":
h[elem.name]=null;
for(var j=0;j<elem.options.length;j++){
var o=elem.options[j];
if(o.selected){
h[elem.name]=expandToArr(h[elem.name],o.value);
}
}
break;
case "radio":
if(typeof h[elem.name]=="undefined"){
h[elem.name]=null;
}
if(elem.checked){
h[elem.name]=elem.value;
}
break;
case "checkbox":
if(typeof h[elem.name]=="undefined"){
h[elem.name]=null;
}
if(elem.checked){
h[elem.name]=expandToArr(h[elem.name],elem.value);
}
break;
}
}
return h;
};
fleegix.form.restore=function(_23,str){
var arr=str.split("&");
var d={};
for(var i=0;i<arr.length;i++){
var _28=arr[i].split("=");
var _29=_28[0];
var val=_28[1];
if(typeof d[_29]=="undefined"){
d[_29]=val;
}else{
if(!(d[_29] instanceof Array)){
var t=d[_29];
d[_29]=[];
d[_29].push(t);
}
d[_29].push(val);
}
}
for(var i=0;i<_23.elements.length;i++){
elem=_23.elements[i];
if(typeof d[elem.name]!="undefined"){
val=d[elem.name];
switch(elem.type){
case "text":
case "hidden":
case "password":
case "textarea":
case "select-one":
elem.value=decodeURIComponent(val);
break;
case "radio":
if(encodeURIComponent(elem.value)==val){
elem.checked=true;
}
break;
case "checkbox":
for(var j=0;j<val.length;j++){
if(encodeURIComponent(elem.value)==val[j]){
elem.checked=true;
}
}
break;
case "select-multiple":
for(var h=0;h<elem.options.length;h++){
var opt=elem.options[h];
for(var j=0;j<val.length;j++){
if(encodeURIComponent(opt.value)==val[j]){
opt.selected=true;
}
}
}
break;
}
}
}
return _23;
};
fleegix.form.diff=function(_2f,_30,_31){
var o=_31||{};
var _33=_2f.toString()=="[object HTMLFormElement]"?fleegix.form.toHash(_2f):_2f;
var _34=_30.toString()=="[object HTMLFormElement]"?fleegix.form.toHash(_30):_30;
var _35=[];
var _36=0;
function addDiff(n,hA,hB,_3a){
if(!_35[n]){
_36++;
_35[n]=_3a?[hB[n],hA[n]]:[hA[n],hB[n]];
}
}
function diffSweep(hA,hB,_3d){
for(n in hA){
if(typeof hB[n]=="undefined"){
if(o.intersectionOnly){
continue;
}
addDiff(n,hA,hB,_3d);
}else{
v=hA[n];
if(v instanceof Array){
if(!hB[n]||(hB[n].toString()!=v.toString())){
addDiff(n,hA,hB,_3d);
}
}else{
if(hB[n]!=v){
addDiff(n,hA,hB,_3d);
}
}
}
}
}
diffSweep(_33,_34,false);
diffSweep(_34,_33,true);
return {count:_36,diffs:_35};
};
fleegix.xhr=new function(){
var _3e=null;
function spawnTransporter(_3f){
var i=0;
var t=["Msxml2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","Microsoft.XMLHTTP"];
var _42=null;
if(window.XMLHttpRequest!=null){
_42=new XMLHttpRequest();
}else{
if(window.ActiveXObject!=null){
if(_3e){
_42=new ActiveXObject(_3e);
}else{
for(var i=0;i<t.length;i++){
try{
_42=new ActiveXObject(t[i]);
_3e=t[i];
break;
}
catch(e){
}
}
}
}
}
if(_42){
if(_3f){
return _42;
}else{
fleegix.xhr.transporters.push(_42);
var _43=fleegix.xhr.transporters.length-1;
return _43;
}
}else{
throw ("Could not create XMLHttpRequest object.");
}
}
this.transporters=[];
this.maxTransporters=5;
this.lastReqId=0;
this.requestQueue=[];
this.idleTransporters=[];
this.processingMap={};
this.processingArray=[];
this.syncTransporter=spawnTransporter(true);
this.syncRequest=null;
this.debug=false;
this.processingWatcherId=null;
this.doGet=function(){
var o={};
var _45=null;
var _46=Array.prototype.slice.apply(arguments);
if(typeof _46[0]=="function"){
o.async=true;
_45=_46.shift();
}else{
o.async=false;
}
var url=_46.shift();
if(typeof _46[0]=="object"){
var _48=_46.shift();
for(var p in _48){
o[p]=_48[p];
}
}else{
o.responseFormat=_46.shift()||"text";
}
o.handleSuccess=_45;
o.url=url;
return this.doReq(o);
};
this.doPost=function(){
var o={};
var _4b=null;
var _4c=Array.prototype.slice.apply(arguments);
if(typeof _4c[0]=="function"){
o.async=true;
_4b=_4c.shift();
}else{
o.async=false;
}
var url=_4c.shift();
var _4e=_4c.shift();
if(typeof _4c[0]=="object"){
var _4f=_4c.shift();
for(var p in _4f){
o[p]=_4f[p];
}
}else{
o.responseFormat=_4c.shift()||"text";
}
o.handleSuccess=_4b;
o.url=url;
o.dataPayload=_4e;
o.method="POST";
return this.doReq(o);
};
this.doReq=function(o){
var _52=o||{};
var req=new fleegix.xhr.Request();
var _54=null;
for(var p in _52){
req[p]=_52[p];
}
req.id=this.lastReqId;
this.lastReqId++;
if(req.async){
if(this.idleTransporters.length){
_54=this.idleTransporters.shift();
}else{
if(this.transporters.length<this.maxTransporters){
_54=spawnTransporter();
}
}
if(_54!=null){
this.processReq(req,_54);
}else{
if(req.uber){
this.requestQueue.unshift(req);
}else{
this.requestQueue.push(req);
}
}
return req.id;
}else{
return this.processReq(req);
}
};
this.processReq=function(req,t){
var _58=this;
var _59=null;
var _5a=null;
var url="";
var _5c=null;
if(req.async){
_59=t;
_5a=this.transporters[_59];
this.processingMap[req.id]=req;
this.processingArray.unshift(req);
req.transporterId=_59;
}else{
_5a=this.syncTransporter;
this.syncRequest=req;
}
if(req.preventCache){
var dt=new Date().getTime();
url=req.url.indexOf("?")>-1?req.url+"&preventCache="+dt:req.url+"?preventCache="+dt;
}else{
url=req.url;
}
if(document.all){
_5a.abort();
}
if(req.username&&req.password){
_5a.open(req.method,url,req.async,req.username,req.password);
}else{
_5a.open(req.method,url,req.async);
}
if(req.mimeType&&navigator.userAgent.indexOf("MSIE")==-1){
_5a.overrideMimeType(req.mimeType);
}
if(req.headers.length){
for(var i=0;i<req.headers.length;i++){
var _5f=req.headers[i].split(": ");
_5a.setRequestHeader(_5f[i],_5f[1]);
}
}else{
if(req.method=="POST"){
_5a.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
}
}
_5a.send(req.dataPayload);
if(this.processingWatcherId==null){
this.processingWatcherId=setTimeout(fleegix.xhr.watchProcessing,10);
}
if(!req.async){
var ret=this.handleResponse(_5a,req);
this.syncRequest=null;
if(_58.processingArray.length){
_58.processingWatcherId=setTimeout(fleegix.xhr.watchProcessing,10);
}
return ret;
}
};
this.getResponseByType=function(_61,req){
switch(req.responseFormat){
case "text":
r=_61.responseText;
break;
case "xml":
r=_61.responseXML;
break;
case "object":
r=_61;
break;
}
return r;
};
this.watchProcessing=function(){
var _63=fleegix.xhr;
var _64=_63.processingArray;
var d=new Date().getTime();
if(_63.syncRequest!=null){
return;
}else{
for(var i=0;i<_64.length;i++){
var req=_64[i];
var _68=_63.transporters[req.transporterId];
var _69=((d-req.startTime)>(req.timeoutSeconds*1000));
switch(true){
case (req.aborted||!_68.readyState):
_63.processingArray.splice(i,1);
case _69:
_63.processingArray.splice(i,1);
_63.timeout(req);
break;
case (_68.readyState==4):
_63.processingArray.splice(i,1);
_63.handleResponse.apply(_63,[_68,req]);
break;
}
}
}
clearTimeout(_63.processingWatcherId);
if(_63.processingArray.length){
_63.processingWatcherId=setTimeout(fleegix.xhr.watchProcessing,10);
}else{
_63.processingWatcherId=null;
}
};
this.abort=function(_6a){
var r=this.processingMap[_6a];
var t=this.transporters[r.transporterId];
if(t){
t.onreadystatechange=function(){
};
t.abort();
r.aborted=true;
this.cleanupAfterReq(r);
return true;
}else{
return false;
}
};
this.timeout=function(req){
if(fleegix.xhr.abort.apply(fleegix.xhr,[req.id])){
if(typeof req.handleTimeout=="function"){
req.handleTimeout();
}else{
alert("XMLHttpRequest to "+req.url+" timed out.");
}
}
};
this.handleResponse=function(_6e,req){
var _70=this.getResponseByType(_6e,req);
if(req.handleAll){
req.handleAll(_70,req.id);
}else{
try{
if((_6e.status>199&&_6e.status<300)||_6e.status==304){
if(req.async){
if(!req.handleSuccess){
throw ("No response handler defined "+"for this request");
return;
}else{
req.handleSuccess(_70,req.id);
}
}else{
return _70;
}
}else{
if(!_6e.status){
if(this.debug){
throw ("XMLHttpRequest HTTP status either zero or not set.");
}
}else{
if(req.handleErr){
req.handleErr(_70,req.id);
}else{
this.handleErrDefault(_6e);
}
}
}
}
catch(e){
if(this.debug){
throw (e);
}
}
}
if(req.async){
this.cleanupAfterReq(req);
}
return true;
};
this.cleanupAfterReq=function(req){
delete this.processingMap[req.id];
if(this.requestQueue.length){
var _72=this.requestQueue.shift();
_72.startTime=new Date().getTime();
this.processReq(_72,req.transporterId);
}else{
this.idleTransporters.push(req.transporterId);
}
};
this.handleErrDefault=function(r){
console.log(r);
var _74;
try{
_74=window.open("","errorWin");
_74.document.body.innerHTML=r.responseText;
}
catch(e){
alert("An error occurred, but the error message cannot be"+" displayed because of your browser's pop-up blocker.\n"+"Please allow pop-ups from this Web site.");
}
};
};
fleegix.xhr.constructor=null;
fleegix.xhr.Request=function(){
this.id=0;
this.transporterId=null;
this.url=null;
this.status=null;
this.statusText="";
this.method="GET";
this.async=true;
this.dataPayload=null;
this.readyState=null;
this.responseText=null;
this.responseXML=null;
this.handleSuccess=null;
this.handleErr=null;
this.handleAll=null;
this.handleTimeout=null;
this.responseFormat="text",this.mimeType=null;
this.username="";
this.password="";
this.headers=[];
this.preventCache=false;
this.startTime=new Date().getTime();
this.timeoutSeconds=30;
this.uber=false;
this.aborted=false;
};
fleegix.xhr.Request.prototype.setRequestHeader=function(_75,_76){
this.headers.push(_75+": "+_76);
};
fleegix.event=new function(){
var _77=[];
var _78={};
this.listen=function(){
var _79=arguments[0];
var _7a=arguments[1];
var _7b=_79[_7a]?_79[_7a].listenReg:null;
if(!_7b){
_7b={};
_7b.orig={};
_7b.orig.obj=_79,_7b.orig.methName=_7a;
if(_79[_7a]){
_7b.orig.methCode=_79[_7a];
}
_7b.after=[];
_79[_7a]=function(){
var reg=_79[_7a].listenReg;
var _7d=[];
for(var i=0;i<arguments.length;i++){
_7d.push(arguments[i]);
}
if(reg.orig.methCode){
reg.orig.methCode.apply(reg.orig.obj,_7d);
}
if(_79.attachEvent||_79.nodeType||_79.addEventListener){
var ev=null;
if(!_7d.length){
try{
switch(true){
case !!(_79.ownerDocument):
ev=_79.ownerDocument.parentWindow.event;
break;
case !!(_79.documentElement):
ev=_79.documentElement.ownerDocument.parentWindow.event;
break;
case !!(_79.event):
ev=_79.event;
break;
default:
ev=window.event;
break;
}
}
catch(e){
ev=window.event;
}
}
if(ev){
if(typeof ev.target=="undefined"){
ev.target=ev.srcElement;
}
if(typeof ev.srcElement=="undefined"){
ev.srcElement=ev.target;
}
_7d[0]=ev;
}
}
for(var i=0;i<reg.after.length;i++){
var ex=reg.after[i];
if(!ex.execObj){
var _81=ex.execMethod;
_81.apply(window,_7d);
}else{
execObj=ex.execObj;
execMethod=ex.execMethod;
execObj[execMethod].apply(execObj,_7d);
}
ev=_7d[0];
if(ex.stopPropagation){
if(ev.stopPropagation){
ev.stopPropagation();
}else{
ev.cancelBubble=true;
}
}
if(ex.preventDefault){
if(ev.preventDefault){
ev.preventDefault();
}else{
ev.returnValue=false;
}
}
}
};
_79[_7a].listenReg=_7b;
_77.push(_79[_7a].listenReg);
}
var r={};
var o={};
if(typeof arguments[2]=="function"){
r.execMethod=arguments[2];
o=arguments[3]||{};
}else{
r.execObj=arguments[2];
r.execMethod=arguments[3];
o=arguments[4]||{};
}
for(var x in o){
r[x]=o[x];
}
_7b.after.push(r);
_79[_7a].listenReg=_7b;
};
this.unlisten=function(){
var _85=arguments[0];
var _86=arguments[1];
var _87=_85[_86]?_85[_86].listenReg:null;
var _88=null;
if(!_87){
return false;
}
for(var i=0;i<_87.after.length;i++){
var ex=_87.after[i];
if(typeof arguments[2]=="function"){
if(ex==arguments[2]){
_87.after.splice(i,1);
}
}else{
if(ex[0]==arguments[2]&&ex[1]==arguments[3]){
_87.after.splice(i,1);
}
}
}
_85[_86].listenReg=_87;
};
this.flush=function(){
for(var i=0;i<_77.length;i++){
var reg=_77[i];
removeObj=reg.orig.obj;
removeMethod=reg.orig.methName;
removeObj[removeMethod]=null;
}
};
this.subscribe=function(_8d,obj,_8f){
if(!obj){
return;
}
if(!_78[_8d]){
_78[_8d]={};
_78[_8d].audience=[];
}else{
this.unsubscribe(_8d,obj);
}
_78[_8d].audience.push([obj,_8f]);
};
this.unsubscribe=function(_90,obj){
if(!obj){
_78[_90]=null;
}else{
if(_78[_90]){
var aud=_78[_90].audience;
for(var i=0;i<aud.length;i++){
if(aud[i][0]==obj){
aud.splice(i,1);
}
}
}
}
};
this.publish=function(pub,_95){
if(_78[pub]){
aud=_78[pub].audience;
for(var i=0;i<aud.length;i++){
var _97=aud[i][0];
var _98=aud[i][1];
_97[_98](_95);
}
}
};
this.getSrcElementId=function(e){
var ret=null;
if(e.srcElement){
ret=e.srcElement;
}else{
if(e.target){
ret=e.target;
}
}
if(typeof ret.id=="undefined"){
return null;
}else{
while(!ret.id||ret.nodeType==3){
if(ret.parentNode){
ret=ret.parentNode;
}else{
return null;
}
}
}
return ret.id;
};
};
fleegix.event.constructor=null;
fleegix.event.listen(window,"onunload",fleegix.event,"flush");
fleegix.xml=new function(){
var _9b=this;
this.parse=function(_9c,_9d){
var _9e=new Array;
var _9f;
var _a0=[];
if(_9c.hasChildNodes()){
_9e=_9c.getElementsByTagName(_9d);
_9f=_9e[0];
for(var j=0;j<_9e.length;j++){
_9f=_9e[j];
_a0[j]=_9b.xmlElem2Obj(_9e[j]);
}
}
return _a0;
};
this.xmlElem2Obj=function(_a2){
var ret=new Object();
_9b.setPropertiesRecursive(ret,_a2);
return ret;
};
this.setPropertiesRecursive=function(obj,_a5){
if(_a5.childNodes.length>0){
for(var i=0;i<_a5.childNodes.length;i++){
if(_a5.childNodes[i].nodeType==1&&_a5.childNodes[i].firstChild){
if(_a5.childNodes[i].childNodes.length==1){
obj[_a5.childNodes[i].tagName]=_a5.childNodes[i].firstChild.nodeValue;
}else{
obj[_a5.childNodes[i].tagName]=[];
_9b.setPropertiesRecursive(obj[_a5.childNodes[i].tagName],_a5.childNodes[i]);
}
}
}
}
};
this.cleanXMLObjText=function(_a7){
var _a8=_a7;
for(var _a9 in _a8){
_a8[_a9]=cleanText(_a8[_a9]);
}
return _a8;
};
this.cleanText=function(str){
var ret=str;
ret=ret.replace(/\n/g,"");
ret=ret.replace(/\r/g,"");
ret=ret.replace(/\'/g,"\\'");
ret=ret.replace(/\[CDATA\[/g,"");
ret=ret.replace(/\]]/g,"");
return ret;
};
this.rendered2Source=function(str){
var _ad=str;
_ad=_ad.replace(/</g,"&lt;");
_ad=_ad.replace(/>/g,"&gt;");
return "<pre>"+_ad+"</pre>";
};
this.getXMLDocElem=function(_ae,_af){
var _b0=[];
var _b1=null;
if(document.all){
var _b2=document.getElementById(_ae).innerHTML;
var _b3=new ActiveXObject("Microsoft.XMLDOM");
_b3.loadXML(_b2);
_b1=_b3.documentElement;
}else{
_b0=window.document.body.getElementsByTagName(_af);
_b1=_b0[0];
}
return _b1;
};
};
fleegix.xml.constructor=null;
fleegix.uri=new function(){
var _b4=this;
this.params={};
this.getParamHash=function(str){
var q=str||_b4.getQuery();
var d={};
if(q){
var arr=q.split("&");
for(var i=0;i<arr.length;i++){
var _ba=arr[i].split("=");
var _bb=_ba[0];
var val=_ba[1];
if(typeof d[_bb]=="undefined"){
d[_bb]=val;
}else{
if(!(d[_bb] instanceof Array)){
var t=d[_bb];
d[_bb]=[];
d[_bb].push(t);
}
d[_bb].push(val);
}
}
}
return d;
};
this.getParam=function(_be,str){
var p=null;
if(str){
var h=this.getParamHash(str);
p=h[_be];
}else{
p=this.params[_be];
}
return p;
};
this.setParam=function(_c2,val,str){
var ret=null;
if(str){
var pat=new RegExp("(^|&)("+_c2+"=[^&]*)(&|$)");
var arr=str.match(pat);
if(arr){
ret=str.replace(arr[0],arr[1]+_c2+"="+val+arr[3]);
}else{
ret=str+"&"+_c2+"="+val;
}
}else{
ret=_c2+"="+val;
}
return ret;
};
this.getQuery=function(s){
var l=s?s:location.href;
return l.split("?")[1];
};
this.getBase=function(s){
var l=s?s:location.href;
return l.split("?")[0];
};
this.params=this.getParamHash();
};
fleegix.uri.constructor=null;
fleegix.fx=new function(){
this.fadeOut=function(_cc,_cd){
return doFade(_cc,_cd,"out");
};
this.fadeIn=function(_ce,_cf){
return doFade(_ce,_cf,"in");
};
this.blindUp=function(_d0,_d1){
var o=_d1||{};
o.blindType=o.blindType||"height";
return doBlind(_d0,o,"up");
};
this.blindDown=function(_d3,_d4){
var o=_d4||{};
o.blindType=o.blindType||"height";
return doBlind(_d3,o,"down");
};
this.setCSSProp=function(_d6,p,v){
if(p=="opacity"){
if(document.all){
_d6.style.filter="alpha(opacity="+v+")";
}else{
var d=v/100;
_d6.style.opacity=d;
}
}else{
if(p=="clip"||p.toLowerCase().indexOf("color")>-1){
_d6.style[p]=v;
}else{
_d6.style[p]=document.all?parseInt(v)+"px":v+"px";
}
}
return true;
};
this.hexPat=/^[#]{0,1}([\w]{1,2})([\w]{1,2})([\w]{1,2})$/;
this.hex2rgb=function(str,_db){
var rgb=[];
var h=str.match(this.hexPat);
if(h){
for(var i=1;i<h.length;i++){
var s=h[i];
s=s.length==1?s+s:s;
rgb.push(parseInt(s,16));
}
return _db?rgb:"rgb("+rgb.join()+")";
}else{
throw ("\""+str+"\" not a valid hex value.");
}
};
this.hsv2rgb=function(h,s,v,_e3){
var rgb=[];
if(h==360){
h=0;
}
s/=100;
v/=100;
var r=null;
var g=null;
var b=null;
if(s==0){
r=v;
g=v;
b=v;
}else{
var _e8=h/60;
var i=Math.floor(_e8);
var f=_e8-i;
var p=v*(1-s);
var q=v*(1-(s*f));
var t=v*(1-(s*(1-f)));
switch(i){
case 0:
r=v;
g=t;
b=p;
break;
case 1:
r=q;
g=v;
b=p;
break;
case 2:
r=p;
g=v;
b=t;
break;
case 3:
r=p;
g=q;
b=v;
break;
case 4:
r=t;
g=p;
b=v;
break;
case 5:
r=v;
g=p;
b=q;
break;
}
}
r=Math.round(r*255);
g=Math.round(g*255);
b=Math.round(b*255);
rgb=[r,g,b];
return _e3?rgb:"rgb("+rgb.join()+")";
};
function doFade(_ee,_ef,dir){
var s=dir=="in"?0:100;
var e=dir=="in"?100:0;
var o={props:{opacity:[s,e]},trans:"lightEaseIn"};
for(p in _ef){
o[p]=_ef[p];
}
return new fleegix.fx.Effecter(_ee,o);
}
function doBlind(_f4,_f5,dir){
var o={};
var s=0;
var e=0;
if(_f5.blindType=="clip"){
s=dir=="down"?0:_f4.offsetHeight;
e=dir=="down"?_f4.offsetHeight:0;
s=[0,_f4.offsetWidth,s,0];
e=[0,_f4.offsetWidth,e,0];
o.props={clip:[s,e]};
}else{
if(dir=="down"){
if(_f5.endHeight){
e=_f5.endHeight;
}else{
_f4.style.height="";
var d=document.createElement("div");
d.position="absolute";
d.style.top="-9999999999px";
d.style.left="-9999999999px";
var par=_f4.parentNode;
var ch=par.removeChild(_f4);
d.appendChild(ch);
document.body.appendChild(d);
e=ch.offsetHeight;
_f4=d.removeChild(ch);
var x=document.body.removeChild(d);
_f4.style.height="0px";
par.appendChild(_f4);
}
s=0;
}else{
s=_f4.offsetHeight;
e=0;
}
o.props={height:[s,e]};
}
for(p in _f5){
o[p]=_f5[p];
}
o.trans="lightEaseIn";
return new fleegix.fx.Effecter(_f4,o);
}
};
fleegix.fx.Effecter=function(_fe,_ff){
var self=this;
this.props=_ff.props;
this.trans=_ff.trans||"lightEaseIn";
this.duration=_ff.duration||500;
this.fps=30;
this.startTime=new Date().getTime();
this.timeSpent=0;
this.doOnStart=_ff.doOnStart||null;
this.doAfterFinished=_ff.doAfterFinished||null;
this.autoStart=_ff.autoStart==false?false:true;
if(typeof this.transitions[this.trans]!="function"){
throw ("\""+this.trans+"\" is not a valid transition.");
}
this.start=function(){
self.id=setInterval(function(){
self.doStep.apply(self,[_fe]);
},Math.round(1000/self.fps));
if(typeof _ff.doOnStart=="function"){
self.doOnStart();
}
};
if(this.autoStart){
this.start();
}
return this;
};
fleegix.fx.Effecter.prototype.doStep=function(elem){
var t=new Date().getTime();
var p=this.props;
if(t<(this.startTime+this.duration)){
this.timeSpent=t-this.startTime;
for(var i in p){
fleegix.fx.setCSSProp(elem,i,this.calcCurrVal(i));
}
}else{
for(var i in p){
if(i=="clip"){
fleegix.fx.setCSSProp(elem,i,"rect("+p[i][1].join("px,")+"px)");
}else{
fleegix.fx.setCSSProp(elem,i,p[i][1]);
}
}
clearInterval(this.id);
if(typeof this.doAfterFinished=="function"){
this.doAfterFinished();
}
}
};
fleegix.fx.Effecter.prototype.calcCurrVal=function(key){
var _106=this.props[key][0];
var _107=this.props[key][1];
var _108=this.transitions[this.trans];
if(key.toLowerCase().indexOf("color")>-1){
var _109=fleegix.fx.hex2rgb(_106,true);
var _10a=fleegix.fx.hex2rgb(_107,true);
var _10b=[];
for(var i=0;i<_109.length;i++){
var s=_109[i];
var e=_10a[i];
_10b.push(parseInt(_108(this.timeSpent,s,(e-s),this.duration)));
}
return "rgb("+_10b.join()+")";
}else{
if(key=="clip"){
var _109=_106;
var _10a=_107;
var _10b=[];
for(var i=0;i<_109.length;i++){
var s=_109[i];
var e=_10a[i];
_10b.push(parseInt(_108(this.timeSpent,s,(e-s),this.duration)));
}
return "rect("+_10b.join("px,")+"px)";
}else{
return _108(this.timeSpent,_106,(_107-_106),this.duration);
}
}
};
fleegix.fx.Effecter.prototype.transitions={linear:function(t,b,c,d){
return c*(t/d)+b;
},lightEaseIn:function(t,b,c,d){
return c*(t/=d)*t+b;
},lightEaseOut:function(t,b,c,d){
return -c*(t/=d)*(t-2)+b;
},lightEaseInOut:function(t,b,c,d){
if((t/=d/2)<1){
return c/2*t*t+b;
}
return -c/2*((--t)*(t-2)-1)+b;
},heavyEaseIn:function(t,b,c,d){
return c*(t/=d)*t*t+b;
},heavyEaseOut:function(t,b,c,d){
return c*((t=t/d-1)*t*t+1)+b;
},heavyEaseInOut:function(t,b,c,d){
if((t/=d/2)<1){
return c/2*t*t*t+b;
}
return c/2*((t-=2)*t*t+2)+b;
}};
fleegix.json=new function(){
this.serialize=function(obj){
var str="";
switch(typeof obj){
case "object":
if(obj==null){
return "null";
}else{
if(obj instanceof Array){
for(var i=0;i<obj.length;i++){
if(str){
str+=",";
}
str+=fleegix.json.serialize(obj[i]);
}
return "["+str+"]";
}else{
if(typeof obj.toString!="undefined"){
for(var i in obj){
if(str){
str+=",";
}
str+="\""+i+"\":";
if(typeof obj[i]=="undefined"){
str+="\"undefined\"";
}else{
str+=fleegix.json.serialize(obj[i]);
}
}
return "{"+str+"}";
}
}
}
return str;
break;
case "unknown":
case "undefined":
case "function":
return "\"undefined\"";
break;
case "string":
str+="\""+obj.replace(/(["\\])/g,"\\$1").replace(/\r/g,"").replace(/\n/g,"\\n")+"\"";
return str;
break;
default:
return String(obj);
break;
}
};
};
fleegix.json.constructor=null;
fleegix.cookie=new function(){
this.set=function(name,_12f,_130){
var opts=_130||{};
var exp="";
var t=0;
if(typeof _130=="object"){
var path=opts.path||"/";
var days=opts.days||0;
var _136=opts.hours||0;
var _137=opts.minutes||0;
}else{
var path=optsParam||"/";
}
t+=days?days*24*60*60*1000:0;
t+=_136?_136*60*60*1000:0;
t+=_137?_137*60*1000:0;
if(t){
var dt=new Date();
dt.setTime(dt.getTime()+t);
exp="; expires="+dt.toGMTString();
}else{
exp="";
}
document.cookie=name+"="+_12f+exp+"; path="+path;
};
this.get=function(name){
var _13a=name+"=";
var arr=document.cookie.split(";");
for(var i=0;i<arr.length;i++){
var c=arr[i];
while(c.charAt(0)==" "){
c=c.substring(1,c.length);
}
if(c.indexOf(_13a)==0){
return c.substring(_13a.length,c.length);
}
}
return null;
};
this.create=this.set;
this.destroy=function(name,path){
var opts={};
opts.minutes=-1;
if(path){
opts.path=path;
}
this.set(name,"",opts);
};
};
fleegix.cookie.constructor=null;
fleegix.css=new function(){
this.addClass=function(elem,s){
fleegix.css.removeClass(elem,s);
var c=elem.className;
elem.className=c+=" "+s;
};
this.removeClass=function(elem,s){
var c=elem.className;
var pat="\\b"+s+"\\b";
pat=new RegExp(pat);
c=c.replace(pat,"");
elem.className=c;
};
};