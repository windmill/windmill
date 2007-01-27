if(typeof fleegix=="undefined"){
var fleegix={};
}
fleegix.json=new function(){
this.serialize=function(_1){
var _2="";
switch(typeof _1){
case "object":
if(_1==null){
return "null";
}else{
if(_1 instanceof Array){
for(var i=0;i<_1.length;i++){
if(_2){
_2+=",";
}
_2+=fleegix.json.serialize(_1[i]);
}
return "["+_2+"]";
}else{
if(typeof _1.toString!="undefined"){
for(var i in _1){
if(_2){
_2+=",";
}
_2+="\""+i+"\":";
_2+=(_1[i]==undefined)?"\"undefined\"":fleegix.json.serialize(_1[i]);
}
return "{"+_2+"}";
}
}
}
return _2;
break;
case "unknown":
case "undefined":
case "function":
return "\"undefined\"";
break;
case "string":
_2+="\""+_1.replace(/(["\\])/g,"\\$1").replace(/\r/g,"").replace(/\n/g,"\\n")+"\"";
return _2;
break;
default:
return String(_1);
break;
}
};
};
fleegix.json.constructor=null;
fleegix.xml=new function(){
var _4=this;
this.parse=function(_5,_6){
var _7=new Array;
var _8;
var _9=[];
if(_5.hasChildNodes()){
_7=_5.getElementsByTagName(_6);
_8=_7[0];
for(var j=0;j<_7.length;j++){
_8=_7[j];
_9[j]=_4.xmlElem2Obj(_7[j]);
}
}
return _9;
};
this.xmlElem2Obj=function(_b){
var _c=new Object();
_4.setPropertiesRecursive(_c,_b);
return _c;
};
this.setPropertiesRecursive=function(_d,_e){
if(_e.childNodes.length>0){
for(var i=0;i<_e.childNodes.length;i++){
if(_e.childNodes[i].nodeType==1&&_e.childNodes[i].firstChild){
if(_e.childNodes[i].childNodes.length==1){
_d[_e.childNodes[i].tagName]=_e.childNodes[i].firstChild.nodeValue;
}else{
_d[_e.childNodes[i].tagName]=[];
_4.setPropertiesRecursive(_d[_e.childNodes[i].tagName],_e.childNodes[i]);
}
}
}
}
};
this.cleanXMLObjText=function(_10){
var _11=_10;
for(var _12 in _11){
_11[_12]=cleanText(_11[_12]);
}
return _11;
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
var _16=str;
_16=_16.replace(/</g,"&lt;");
_16=_16.replace(/>/g,"&gt;");
return "<pre>"+_16+"</pre>";
};
this.getXMLDocElem=function(_17,_18){
var _19=[];
var _1a=null;
if(document.all){
var _1b=document.getElementById(_17).innerHTML;
var _1c=new ActiveXObject("Microsoft.XMLDOM");
_1c.loadXML(_1b);
_1a=_1c.documentElement;
}else{
_19=window.document.body.getElementsByTagName(_18);
_1a=_19[0];
}
return _1a;
};
};
fleegix.xml.constructor=null;
fleegix.xhr=new function(){
function spawnTransporter(_1d){
var i=0;
var t=[function(){
return new XMLHttpRequest();
},function(){
return new ActiveXObject("Msxml2.XMLHTTP");
},function(){
return new ActiveXObject("Microsoft.XMLHTTP");
}];
var _20=null;
while(!_20&&(i<t.length)){
try{
_20=t[i++]();
}
catch(e){
}
}
if(_20){
if(_1d){
return _20;
}else{
fleegix.xhr.transporters.push(_20);
var _21=fleegix.xhr.transporters.length-1;
return _21;
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
var _23=null;
var _24=Array.prototype.slice.apply(arguments);
if(typeof _24[0]=="function"){
o.async=true;
_23=_24.shift();
}else{
o.async=false;
}
var url=_24.shift();
if(typeof _24[0]=="object"){
var _26=_24.shift();
for(var p in _26){
o[p]=_26[p];
}
}else{
o.responseFormat=_24.shift()||"text";
}
o.handleSuccess=_23;
o.url=url;
return this.doReq(o);
};
this.doPost=function(){
var o={};
var _29=null;
var _2a=Array.prototype.slice.apply(arguments);
if(typeof _2a[0]=="function"){
o.async=true;
_29=_2a.shift();
}else{
o.async=false;
}
var url=_2a.shift();
var _2c=_2a.shift();
if(typeof _2a[0]=="object"){
var _2d=_2a.shift();
for(var p in _2d){
o[p]=_2d[p];
}
}else{
o.responseFormat=_2a.shift()||"text";
}
o.handleSuccess=_29;
o.url=url;
o.dataPayload=_2c;
o.method="POST";
return this.doReq(o);
};
this.doReq=function(o){
var _30=o||{};
var req=new fleegix.xhr.Request();
var _32=null;
for(var p in _30){
req[p]=_30[p];
}
req.id=this.lastReqId;
this.lastReqId++;
if(req.async){
if(this.idleTransporters.length){
_32=this.idleTransporters.shift();
}else{
if(this.transporters.length<this.maxTransporters){
_32=spawnTransporter();
}
}
if(_32!=null){
this.processReq(req,_32);
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
var _36=this;
var _37=null;
var _38=null;
var url="";
var _3a=null;
if(req.async){
_37=t;
_38=this.transporters[_37];
this.processingMap[req.id]=req;
this.processingArray.unshift(req);
req.transporterId=_37;
}else{
_38=this.syncTransporter;
this.syncRequest=req;
}
if(req.preventCache){
var dt=new Date().getTime();
url=req.url.indexOf("?")>-1?req.url+"&preventCache="+dt:req.url+"?preventCache="+dt;
}else{
url=req.url;
}
if(document.all){
_38.abort();
}
if(req.username&&req.password){
_38.open(req.method,url,req.async,req.username,req.password);
}else{
_38.open(req.method,url,req.async);
}
if(req.mimeType&&navigator.userAgent.indexOf("MSIE")==-1){
_38.overrideMimeType(req.mimeType);
}
if(req.headers.length){
for(var i=0;i<req.headers.length;i++){
var _3d=req.headers[i].split(": ");
_38.setRequestHeader(_3d[i],_3d[1]);
}
}else{
if(req.method=="POST"){
_38.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
}
}
_38.send(req.dataPayload);
if(this.processingWatcherId==null){
this.processingWatcherId=setTimeout(fleegix.xhr.watchProcessing,10);
}
if(!req.async){
var ret=this.handleResponse(_38,req);
this.syncRequest=null;
if(_36.processingArray.length){
_36.processingWatcherId=setTimeout(fleegix.xhr.watchProcessing,10);
}
return ret;
}
};
this.getResponseByType=function(_3f,req){
switch(req.responseFormat){
case "text":
r=_3f.responseText;
break;
case "xml":
r=_3f.responseXML;
break;
case "object":
r=_3f;
break;
}
return r;
};
this.watchProcessing=function(){
var _41=fleegix.xhr;
var _42=_41.processingArray;
var d=new Date().getTime();
if(_41.syncRequest!=null){
return;
}else{
for(var i=0;i<_42.length;i++){
var req=_42[i];
var _46=_41.transporters[req.transporterId];
var _47=((d-req.startTime)>(req.timeoutSeconds*1000));
switch(true){
case (req.aborted||!_46.readyState):
_41.processingArray.splice(i,1);
case _47:
_41.processingArray.splice(i,1);
_41.timeout(req);
break;
case (_46.readyState==4):
_41.processingArray.splice(i,1);
_41.handleResponse.apply(_41,[_46,req]);
break;
}
}
}
clearTimeout(_41.processingWatcherId);
if(_41.processingArray.length){
_41.processingWatcherId=setTimeout(fleegix.xhr.watchProcessing,10);
}else{
_41.processingWatcherId=null;
}
};
this.abort=function(_48){
var r=this.processingMap[_48];
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
this.handleResponse=function(_4c,req){
var _4e=this.getResponseByType(_4c,req);
if(req.handleAll){
req.handleAll(_4e,req.id);
}else{
try{
if(_4c.status>199&&_4c.status<300){
if(req.async){
if(!req.handleSuccess){
throw ("No response handler defined "+"for this request");
return;
}else{
req.handleSuccess(_4e,req.id);
}
}else{
return _4e;
}
}else{
if(req.handleErr){
req.handleErr(_4e,req.id);
}else{
this.handleErrDefault(_4c);
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
var _50=this.requestQueue.shift();
_50.startTime=new Date().getTime();
this.processReq(_50,req.transporterId);
}else{
this.idleTransporters.push(req.transporterId);
}
};
this.handleErrDefault=function(r){
var _52;
try{
_52=window.open("","errorWin");
_52.document.body.innerHTML=r.responseText;
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
this.handleAll=null;
this.handleSuccess=null;
this.handleErr=null;
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
fleegix.xhr.Request.prototype.setRequestHeader=function(_53,_54){
this.headers.push(_53+": "+_54);
};
fleegix.form={};
fleegix.form.serialize=function(f,o){
var h=fleegix.form.toHash(f);
var _58=o||{};
var str="";
var pat=null;
if(_58.stripTags){
pat=/<[^>]*>/g;
}
for(var n in h){
var s="";
var v=h[n];
if(v){
if(typeof v=="string"){
s=_58.stripTags?v.replace(pat,""):v;
str+=n+"="+encodeURIComponent(s);
}else{
var sep="";
if(_58.collapseMulti){
sep=",";
str+=n+"=";
}else{
sep="&";
}
for(var j=0;j<v.length;j++){
s=_58.stripTags?v[j].replace(pat,""):v[j];
s=(!_58.collapseMulti)?n+"="+encodeURIComponent(s):encodeURIComponent(s);
str+=s+sep;
}
str=str.substr(0,str.length-1);
}
str+="&";
}else{
if(_58.includeEmpty){
str+=n+"=&";
}
}
}
str=str.substr(0,str.length-1);
return str;
};
fleegix.form.toHash=function(f){
var h={};
function expandToArr(_62,val){
if(_62){
var r=null;
if(typeof _62=="string"){
r=[];
r.push(_62);
}else{
r=_62;
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
h[elem.name]=elem.value;
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
fleegix.form.restore=function(_67,str){
var arr=str.split("&");
var d={};
for(var i=0;i<arr.length;i++){
var _6c=arr[i].split("=");
var _6d=_6c[0];
var val=_6c[1];
if(typeof d[_6d]=="undefined"){
d[_6d]=val;
}else{
if(!(d[_6d] instanceof Array)){
var t=d[_6d];
d[_6d]=[];
d[_6d].push(t);
}
d[_6d].push(val);
}
}
for(var i=0;i<_67.elements.length;i++){
elem=_67.elements[i];
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
return _67;
};
fleegix.form.Differ=function(){
this.count=0;
this.diffs={};
};
fleegix.form.Differ.prototype.hasKey=function(k){
return (typeof this.diffs[k]!="undefined");
};
fleegix.form.diff=function(_74,_75){
var hA=_74.toString()=="[object HTMLFormElement]"?fleegix.form.toHash(_74):_74;
var hB=_75.toString()=="[object HTMLFormElement]"?fleegix.form.toHash(_75):_75;
var ret=new fleegix.form.Differ();
function addDiff(n){
ret.count++;
ret.diffs[n]=[hA[n],hB[n]];
}
for(n in hA){
if(typeof hB[n]=="undefined"){
addDiff(n);
}else{
v=hA[n];
if(v instanceof Array){
if(!hB[n]||(hB[n].toString()!=v.toString())){
addDiff(n);
}
}else{
if(hB[n]!=v){
addDiff(n);
}
}
}
}
return ret;
};
fleegix.popup=new function(){
var _7a=this;
this.win=null;
this.open=function(url,_7c){
var _7d=_7c||{};
var str="";
var _7f={"width":"","height":"","location":0,"menubar":0,"resizable":1,"scrollbars":0,"status":0,"titlebar":1,"toolbar":0};
for(var _80 in _7f){
str+=_80+"=";
str+=_7d[_80]?_7d[_80]:_7f[_80];
str+=",";
}
var len=str.length;
if(len){
str=str.substr(0,len-1);
}
if(!_7a.win||_7a.win.closed){
_7a.win=window.open(url,"thePopupWin",str);
}else{
_7a.win.focus();
_7a.win.document.location=url;
}
};
this.close=function(){
if(_7a.win){
_7a.win.window.close();
_7a.win=null;
}
};
this.goURLMainWin=function(url){
location=url;
_7a.close();
};
};
fleegix.popup.constructor=null;
fleegix.event=new function(){
var _83=[];
var _84={};
this.listen=function(){
var _85=arguments[0];
var _86=arguments[1];
var _87=_85[_86]?_85[_86].listenReg:null;
if(!_87){
_87={};
_87.orig={};
_87.orig.obj=_85,_87.orig.methName=_86;
if(_85[_86]){
_87.orig.methCode=_85[_86];
}
_87.after=[];
_85[_86]=function(){
var _88=[];
for(var i=0;i<arguments.length;i++){
_88.push(arguments[i]);
}
fleegix.event.exec(_85[_86].listenReg,_88);
};
_85[_86].listenReg=_87;
_83.push(_85[_86].listenReg);
}
if(typeof arguments[2]=="function"){
_87.after.push(arguments[2]);
}else{
_87.after.push([arguments[2],arguments[3]]);
}
_85[_86].listenReg=_87;
};
this.exec=function(reg,_8b){
if(reg.orig.methCode){
reg.orig.methCode.apply(reg.orig.obj,_8b);
}
if(reg.orig.methName.match(/onclick|ondblclick|onmouseup|onmousedown|onmouseover|onmouseout|onmousemove|onkeyup/)){
_8b[0]=_8b[0]||window.event;
}
for(var i=0;i<reg.after.length;i++){
var ex=reg.after[i];
if(ex.length==0){
var _8e=ex;
_8e(_8b);
}else{
execObj=ex[0];
execMethod=ex[1];
execObj[execMethod].apply(execObj,_8b);
}
}
};
this.unlisten=function(){
var _8f=arguments[0];
var _90=arguments[1];
var _91=_8f[_90]?_8f[_90].listenReg:null;
var _92=null;
if(!_91){
return false;
}
for(var i=0;i<_91.after.length;i++){
var ex=_91.after[i];
if(typeof arguments[2]=="function"){
if(ex==arguments[2]){
_91.after.splice(i,1);
}
}else{
if(ex[0]==arguments[2]&&ex[1]==arguments[3]){
_91.after.splice(i,1);
}
}
}
_8f[_90].listenReg=_91;
};
this.flush=function(){
for(var i=0;i<_83.length;i++){
var reg=_83[i];
removeObj=reg.orig.obj;
removeMethod=reg.orig.methName;
removeObj[removeMethod]=null;
}
};
this.subscribe=function(_97,obj,_99){
if(!obj){
return;
}
if(!_84[_97]){
_84[_97]={};
_84[_97].audience=[];
}else{
this.unsubscribe(_97,obj);
}
_84[_97].audience.push([obj,_99]);
};
this.unsubscribe=function(_9a,obj){
if(!obj){
_84[_9a]=null;
}else{
if(_84[_9a]){
var aud=_84[_9a].audience;
for(var i=0;i<aud.length;i++){
if(aud[i][0]==obj){
aud.splice(i,1);
}
}
}
}
};
this.publish=function(pub,_9f){
if(_84[pub]){
aud=_84[pub].audience;
for(var i=0;i<aud.length;i++){
var _a1=aud[i][0];
var _a2=aud[i][1];
_a1[_a2](_9f);
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
fleegix.fx=new function(){
this.fadeOut=function(_a5,_a6){
return this.doFade(_a5,_a6,"out");
};
this.fadeIn=function(_a7,_a8){
return this.doFade(_a7,_a8,"in");
};
this.doFade=function(_a9,_aa,dir){
var s=dir=="in"?0:100;
var e=dir=="in"?100:0;
var o={startVal:s,endVal:e,props:{opacity:[s,e]},trans:"lightEaseIn"};
for(p in _aa){
o[p]=_aa[p];
}
return new fleegix.fx.Effecter(_a9,o);
};
this.setCSSProp=function(_af,p,v){
if(p=="opacity"){
if(document.all){
_af.style.filter="alpha(opacity="+v+")";
}else{
var d=v/100;
_af.style.opacity=d;
}
}else{
if(p.toLowerCase().indexOf("color")>-1){
_af.style[p]=v;
}else{
_af.style[p]=document.all?parseInt(v)+"px":v+"px";
}
}
return true;
};
this.hexPat=/^[#]{0,1}([\w]{1,2})([\w]{1,2})([\w]{1,2})$/;
this.hexToRGB=function(str,_b4){
var rgb=[];
var h=str.match(this.hexPat);
if(h){
for(var i=1;i<h.length;i++){
var s=h[i];
s=s.length==1?s+s:s;
rgb.push(parseInt(s,16));
}
s="rgb("+rgb.join()+")";
return _b4?rgb:s;
}else{
throw ("\""+str+"\" not a valid hex value.");
}
};
};
fleegix.fx.Effecter=function(_b9,_ba){
var _bb=this;
this.props=_ba.props;
this.trans=_ba.trans||"linear";
this.duration=_ba.duration||500;
this.fps=30;
this.startTime=new Date().getTime();
this.timeSpent=0;
this.doAfter=_ba.doAfter||null;
this.autoStart=_ba.autoStart==false?false:true;
if(typeof this.transitions[this.trans]!="function"){
throw ("\""+this.trans+"\" is not a valid transition.");
}
this.start=function(){
_bb.id=setInterval(function(){
_bb.doStep.apply(_bb,[_b9]);
},Math.round(1000/_bb.fps));
if(typeof _ba.doOnStart=="function"){
_ba.doOnStart();
}
};
if(this.autoStart){
this.start();
}
return this;
};
fleegix.fx.Effecter.prototype.doStep=function(_bc){
var t=new Date().getTime();
if(t<(this.startTime+this.duration)){
this.timeSpent=t-this.startTime;
var p=this.props;
for(var i in p){
fleegix.fx.setCSSProp(_bc,i,this.calcCurrVal(i));
}
}else{
clearInterval(this.id);
if(typeof this.doAfterFinished=="function"){
this.doAfterFinished();
}
}
};
fleegix.fx.Effecter.prototype.calcCurrVal=function(key){
var _c1=this.props[key][0];
var _c2=this.props[key][1];
var _c3=this.transitions[this.trans];
if(key.toLowerCase().indexOf("color")>-1){
var _c4=fleegix.fx.hexToRGB(_c1,true);
var _c5=fleegix.fx.hexToRGB(_c2,true);
var _c6=[];
for(var i=0;i<_c4.length;i++){
var s=_c4[i];
var e=_c5[i];
_c6.push(parseInt(_c3(this.timeSpent,s,(e-s),this.duration)));
}
return "rgb("+_c6.join()+")";
}else{
return _c3(this.timeSpent,_c1,(_c2-_c1),this.duration);
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
fleegix.uri=new function(){
var _e6=this;
this.params={};
this.getParamHash=function(str){
var q=str||_e6.getQuery();
var d={};
if(q){
var arr=q.split("&");
for(var i=0;i<arr.length;i++){
var _ec=arr[i].split("=");
var _ed=_ec[0];
var val=_ec[1];
if(typeof d[_ed]=="undefined"){
d[_ed]=val;
}else{
if(!(d[_ed] instanceof Array)){
var t=d[_ed];
d[_ed]=[];
d[_ed].push(t);
}
d[_ed].push(val);
}
}
}
return d;
};
this.getParam=function(_f0,str){
var p=null;
if(str){
var h=this.getParamHash(str);
p=h[_f0];
}else{
p=this.params[_f0];
}
return p;
};
this.setParam=function(_f4,val,str){
var ret=null;
if(str){
var pat=new RegExp("(^|&)("+_f4+"=[^&]*)(&|$)");
var arr=str.match(pat);
if(arr){
ret=str.replace(arr[0],arr[1]+_f4+"="+val+arr[3]);
}else{
ret=str+"&"+_f4+"="+val;
}
}else{
ret=_f4+"="+val;
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
fleegix.cookie=new function(){
this.set=function(_fe,_ff,_100){
var opts=_100||{};
var exp="";
var t=0;
if(typeof _100=="object"){
var path=opts.path||"/";
var days=opts.days||0;
var _106=opts.hours||0;
var _107=opts.minutes||0;
}else{
var path=optsParam||"/";
}
t+=days?days*24*60*60*1000:0;
t+=_106?_106*60*60*1000:0;
t+=_107?_107*60*1000:0;
if(t){
var dt=new Date();
dt.setTime(dt.getTime()+t);
exp="; expires="+dt.toGMTString();
}else{
exp="";
}
document.cookie=_fe+"="+_ff+exp+"; path="+path;
};
this.get=function(name){
var _10a=name+"=";
var arr=document.cookie.split(";");
for(var i=0;i<arr.length;i++){
var c=arr[i];
while(c.charAt(0)==" "){
c=c.substring(1,c.length);
}
if(c.indexOf(_10a)==0){
return c.substring(_10a.length,c.length);
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

