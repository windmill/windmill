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
var i=0;
var t=[function(){
return new XMLHttpRequest();
},function(){
return new ActiveXObject("Msxml2.XMLHTTP");
},function(){
return new ActiveXObject("Microsoft.XMLHTTP");
}];
this.trans=null;
this.lastReqId=0;
while(!this.trans&&(i<t.length)){
try{
this.trans=t[i++]();
}
catch(e){
}
}
if(!this.trans){
throw ("Could not create XMLHttpRequest object.");
}
this.doGet=function(){
var o={};
var _20=null;
var _21=Array.prototype.slice.apply(arguments);
if(typeof _21[0]=="function"){
o.async=true;
_20=_21.shift();
}else{
o.async=false;
}
var url=_21.shift();
var _23=_21.shift()||"text";
o.handleResp=_20;
o.url=url;
o.responseFormat=_23;
return this.doReq(o);
};
this.doPost=function(){
var o={};
var _25=null;
var _26=Array.prototype.slice.apply(arguments);
if(typeof _26[0]=="function"){
o.async=true;
_25=_26.shift();
}else{
o.async=false;
}
var url=_26.shift();
var _28=_26.shift();
var _29=_26.shift()||"text";
o.handleResp=_25;
o.url=url;
o.dataPayload=_28;
o.responseFormat=_29;
o.method="POST";
return this.doReq(o);
};
this.doReq=function(o){
var _2b=o||{};
var req=new fleegix.xhr.Request();
var _2d=this.trans;
var _2e=null;
function handleErrDefault(r){
var _30;
try{
_30=window.open("","errorWin");
_30.document.body.innerHTML=r.responseText;
}
catch(e){
alert("An error occurred, but the error message cannot be"+" displayed because of your browser's pop-up blocker.\n"+"Please allow pop-ups from this Web site.");
}
}
for(var p in _2b){
req[p]=_2b[p];
}
this.lastReqId++;
req.id=this.lastReqId;
if(req.username&&req.password){
_2d.open(req.method,req.url,req.async,req.username,req.password);
}else{
_2d.open(req.method,req.url,req.async);
}
if(req.mimeType&&navigator.userAgent.indexOf("MSIE")==-1){
_2d.overrideMimeType(req.mimeType);
}
if(req.headers.length){
for(var i=0;i<req.headers.length;i++){
var _33=req.headers[i].split(": ");
_2d.setRequestHeader(_33[i],_33[1]);
}
}else{
if(req.method=="POST"){
_2d.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
}
}
_2d.onreadystatechange=function(){
if(_2d.readyState==4){
switch(req.responseFormat){
case "text":
_2e=_2d.responseText;
break;
case "xml":
_2e=_2d.responseXML;
break;
case "object":
_2e=_2d;
break;
}
if(_2d.status>199&&_2d.status<300){
if(req.async){
if(!req.handleResp){
throw ("No response handler defined "+"for this request");
return;
}else{
req.handleResp(_2e,req.id);
}
}
}else{
if(req.handleErr){
req.handleErr(_2e);
}else{
handleErrDefault(_2d);
}
}
}
};
_2d.send(req.dataPayload);
if(req.async){
return req.id;
}else{
return _2e;
}
};
this.abort=function(){
if(this.trans){
this.trans.onreadystatechange=function(){
};
this.trans.abort();
}
};
this.handleErrDefault=function(r){
};
};
fleegix.xhr.constructor=null;
fleegix.xhr.Request=function(){
this.reqId=0;
this.url=null;
this.status=null;
this.statusText="";
this.method="GET";
this.async=true;
this.dataPayload=null;
this.readyState=null;
this.responseText=null;
this.responseXML=null;
this.handleResp=null;
this.responseFormat="text",this.mimeType=null;
this.username="";
this.password="";
this.headers=[];
};
fleegix.xhr.Request.prototype.setRequestHeader=function(_35,_36){
this.headers.push(_35+": "+_36);
};
fleegix.form={};
fleegix.form.serialize=function(f,o){
var h=fleegix.form.toHash(f);
var _3a=o||{};
var str="";
var pat=null;
if(_3a.stripTags){
pat=/<[^>]*>/g;
}
for(var n in h){
var s="";
var v=h[n];
if(v){
if(typeof v=="string"){
s=_3a.stripTags?v.replace(pat,""):v;
str+=n+"="+encodeURIComponent(s);
}else{
var sep="";
if(_3a.collapseMulti){
sep=",";
str+=n+"=";
}else{
sep="&";
}
for(var j=0;j<v.length;j++){
s=_3a.stripTags?v[j].replace(pat,""):v[j];
s=(!_3a.collapseMulti)?n+"="+encodeURIComponent(s):encodeURIComponent(s);
str+=s+sep;
}
str=str.substr(0,str.length-1);
}
str+="&";
}else{
if(_3a.includeEmpty){
str+=n+"=&";
}
}
}
str=str.substr(0,str.length-1);
return str;
};
fleegix.form.toHash=function(f){
var h={};
function expandToArr(_44,val){
if(_44){
var r=null;
if(typeof _44=="string"){
r=[];
r.push(_44);
}else{
r=_44;
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
fleegix.form.restore=function(_49,str){
var arr=str.split("&");
var d={};
for(var i=0;i<arr.length;i++){
var _4e=arr[i].split("=");
var _4f=_4e[0];
var val=_4e[1];
if(typeof d[_4f]=="undefined"){
d[_4f]=val;
}else{
if(!(d[_4f] instanceof Array)){
var t=d[_4f];
d[_4f]=[];
d[_4f].push(t);
}
d[_4f].push(val);
}
}
for(var i=0;i<_49.elements.length;i++){
elem=_49.elements[i];
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
return _49;
};
fleegix.form.Differ=function(){
this.count=0;
this.diffs={};
};
fleegix.form.Differ.prototype.hasKey=function(k){
return (typeof this.diffs[k]!="undefined");
};
fleegix.form.diff=function(_56,_57){
var hA=_56.toString()=="[object HTMLFormElement]"?fleegix.form.toHash(_56):_56;
var hB=_57.toString()=="[object HTMLFormElement]"?fleegix.form.toHash(_57):_57;
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
var _5c=this;
this.win=null;
this.open=function(url,_5e){
var _5f=_5e||{};
var str="";
var _61={"width":"","height":"","location":0,"menubar":0,"resizable":1,"scrollbars":0,"status":0,"titlebar":1,"toolbar":0};
for(var _62 in _61){
str+=_62+"=";
str+=_5f[_62]?_5f[_62]:_61[_62];
str+=",";
}
var len=str.length;
if(len){
str=str.substr(0,len-1);
}
if(!_5c.win||_5c.win.closed){
_5c.win=window.open(url,"thePopupWin",str);
}else{
_5c.win.focus();
_5c.win.document.location=url;
}
};
this.close=function(){
if(_5c.win){
_5c.win.window.close();
_5c.win=null;
}
};
this.goURLMainWin=function(url){
location=url;
_5c.close();
};
};
fleegix.popup.constructor=null;
fleegix.event=new function(){
var _65=[];
var _66={};
this.listen=function(){
var _67=arguments[0];
var _68=arguments[1];
var _69=_67[_68]?_67[_68].listenReg:null;
if(!_69){
_69={};
_69.orig={};
_69.orig.obj=_67,_69.orig.methName=_68;
if(_67[_68]){
_69.orig.methCode=_67[_68];
}
_69.after=[];
_67[_68]=function(){
var _6a=[];
for(var i=0;i<arguments.length;i++){
_6a.push(arguments[i]);
}
fleegix.event.exec(_67[_68].listenReg,_6a);
};
_67[_68].listenReg=_69;
_65.push(_67[_68].listenReg);
}
if(typeof arguments[2]=="function"){
_69.after.push(arguments[2]);
}else{
_69.after.push([arguments[2],arguments[3]]);
}
_67[_68].listenReg=_69;
};
this.exec=function(reg,_6d){
if(reg.orig.methCode){
reg.orig.methCode.apply(reg.orig.obj,_6d);
}
if(reg.orig.methName.match(/onclick|ondblclick|onmouseup|onmousedown|onmouseover|onmouseout|onmousemove|onkeyup/)){
_6d[0]=_6d[0]||window.event;
}
for(var i=0;i<reg.after.length;i++){
var ex=reg.after[i];
if(ex.length==0){
var _70=ex;
_70(_6d);
}else{
execObj=ex[0];
execMethod=ex[1];
execObj[execMethod].apply(execObj,_6d);
}
}
};
this.unlisten=function(){
var _71=arguments[0];
var _72=arguments[1];
var _73=_71[_72]?_71[_72].listenReg:null;
var _74=null;
if(!_73){
return false;
}
for(var i=0;i<_73.after.length;i++){
var ex=_73.after[i];
if(typeof arguments[2]=="function"){
if(ex==arguments[2]){
_73.after.splice(i,1);
}
}else{
if(ex[0]==arguments[2]&&ex[1]==arguments[3]){
_73.after.splice(i,1);
}
}
}
_71[_72].listenReg=_73;
};
this.flush=function(){
for(var i=0;i<_65.length;i++){
var reg=_65[i];
removeObj=reg.orig.obj;
removeMethod=reg.orig.methName;
removeObj[removeMethod]=null;
}
};
this.subscribe=function(_79,obj,_7b){
if(!obj){
return;
}
if(!_66[_79]){
_66[_79]={};
_66[_79].audience=[];
}else{
this.unsubscribe(_79,obj);
}
_66[_79].audience.push([obj,_7b]);
};
this.unsubscribe=function(_7c,obj){
if(!obj){
_66[_7c]=null;
}else{
if(_66[_7c]){
var aud=_66[_7c].audience;
for(var i=0;i<aud.length;i++){
if(aud[i][0]==obj){
aud.splice(i,1);
}
}
}
}
};
this.publish=function(pub,_81){
if(_66[pub]){
aud=_66[pub].audience;
for(var i=0;i<aud.length;i++){
var _83=aud[i][0];
var _84=aud[i][1];
_83[_84](_81);
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
fleegix.uri=new function(){
var _87=this;
this.params={};
this.getParamHash=function(){
var _88=_87.getQuery();
var arr=[];
var _8a=[];
var ret=null;
var pat=/(\S+?)=(\S+?)&/g;
if(_88){
_88+="&";
while(arr=pat.exec(_88)){
_8a[arr[1]]=arr[2];
}
}
return _8a;
};
this.getParam=function(_8d){
return _87.params[_8d];
};
this.getQuery=function(){
return location.href.split("?")[1];
};
this.params=this.getParamHash();
};
fleegix.uri.constructor=null;
fleegix.ui=new function(){
this.getWindowHeight=function(){
if(document.all){
if(document.documentElement&&document.documentElement.clientHeight){
return document.documentElement.clientHeight;
}else{
return document.body.clientHeight;
}
}else{
return window.innerHeight;
}
};
this.getWindowWidth=function(){
if(document.all){
if(document.documentElement&&document.documentElement.clientWidth){
return document.documentElement.clientWidth;
}else{
return document.body.clientWidth;
}
}else{
return window.innerWidth;
}
};
};
fleegix.ui.constructor=null;
fleegix.cookie=new function(){
this.set=function(_8e,_8f,_90){
var _91=_90||{};
var exp="";
var t=0;
var _94=_91.path||"/";
var _95=_91.days||0;
var _96=_91.hours||0;
var _97=_91.minutes||0;
t+=_95?_95*24*60*60*1000:0;
t+=_96?_96*60*60*1000:0;
t+=_97?_97*60*1000:0;
if(t){
var dt=new Date();
dt.setTime(dt.getTime()+t);
exp="; expires="+dt.toGMTString();
}else{
exp="";
}
document.cookie=_8e+"="+_8f+exp+"; path="+_94;
};
this.get=function(_99){
var _9a=_99+"=";
var arr=document.cookie.split(";");
for(var i=0;i<arr.length;i++){
var c=arr[i];
while(c.charAt(0)==" "){
c=c.substring(1,c.length);
}
if(c.indexOf(_9a)==0){
return c.substring(_9a.length,c.length);
}
}
return null;
};
this.create=this.set;
this.destroy=function(_9e,_9f){
var _a0={};
_a0.minutes=-1;
if(_9f){
_a0.path=_9f;
}
this.set(_9e,"",_a0);
};
};
fleegix.cookie.constructor=null;

