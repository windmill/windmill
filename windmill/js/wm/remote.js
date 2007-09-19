/*
Copyright 2006, Open Source Applications Foundation

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

//Functions for interacting with the remote
/***************************************/
windmill.ui.remote = new function () {
    this.selectedElement   = null;

    this.scrollRecorderTextArea = function() {
         var obj=windmill.remote.$("ide");
         obj.scrollTop=obj.scrollHeight;
    }
 
    this.clearIDE = function(){
      input_box=windmill.remote.confirm("Are you sure you want to delete all the data in the IDE?");
      if (input_box==true) {
        fleegix.fx.fadeOut(windmill.remote.$('ideForm'));
        d = function(){ 
        windmill.remote.$('ideForm').innerHTML = '';
        windmill.ui.recorder.recordOff();
        fleegix.fx.fadeIn(windmill.remote.$('ideForm'));  
        }
       setTimeout("d()",800);
      }
     }
     
     this.methodChange = function(id){
         var selected  = windmill.remote.$(id+'method').selectedIndex;
         var methodObj = windmill.remote.$(id+'method');
         var method    = methodObj[selected].value;
         var newAction = this.buildAction(method,{'uuid':id});
         windmill.remote.$(id).innerHTML = newAction.innerHTML;
         
         //safari hack for resizing the suite div to accomodate the new action
         windmill.remote.$(id).style.height = '';
     }
     
     this.setRemoteElem = function(id){
       this.selectedElement = id;
     }
     
     this.addActionAbove = function(uuid){
      var newAction = this.buildAction(null, {});
      var parent = windmill.remote.$(uuid).parentNode;
      parent.insertBefore(newAction, windmill.remote.$(uuid));
      //IE hack
      windmill.remote.$(newAction.id).innerHTML = newAction.innerHTML;
      fleegix.fx.fadeIn(windmill.remote.$(newAction.id));
     }
     this.addActionBelow = function(uuid){
      var newAction = this.buildAction(null,{});      
      var parent = windmill.remote.$(uuid).parentNode;
      parent.insertBefore(newAction, windmill.remote.$(uuid).nextSibling);
      //IE Hack
      windmill.remote.$(newAction.id).innerHTML = newAction.innerHTML;
      fleegix.fx.fadeIn(windmill.remote.$(newAction.id));
     }
     this.deleteAction = function(uuid){
      input_box=windmill.remote.confirm("Are you sure you want to continue deleting?");
      if (input_box==true) {
        fleegix.fx.fadeOut(windmill.remote.$(uuid));
        d = function(){ 
        var pElement = windmill.remote.$(uuid).parentNode;
        pElement.removeChild(windmill.remote.$(uuid));
       }
       setTimeout("d()",800);
      }
     }
     
     this.addAction = function(action){
       var suite = this.getSuite();
       if (typeof(action) == 'undefined'){
         var action = this.buildAction(null,{})
       }
       
       //A hack to make it draw the UI correctly in IE
       suite.appendChild(action);
       windmill.remote.$(action.id).innerHTML = action.innerHTML;
       return action.id;
     }
        
     this.getSuite = function(){
       var suite = windmill.remote.$('recordingSuite'+windmill.ui.recordSuiteNum);
       if (suite == null){
          var ide = windmill.remote.$('ideForm');
          suite = windmill.remote.document.createElement('div');
          suite.id = 'recordingSuite' + windmill.ui.recordSuiteNum;
          if (document.all) {
            var vWidth = windmill.remote.fleegix.dom.getViewportWidth();
            suite.style.width = (vWidth - 20) + 'px';
          }
          else {
            suite.style.width = "100%";
          }
          suite.style.background = "lightblue";
          //suite.style.overflow = 'hidden';
          //suite.style.height='40px';
          suite.style.border = '1px solid black';
          suite.innerHTML = "<div style='width:100%'><table style='width:100%;font:12px arial;'><tr><td><strong>Suite </strong>"+suite.id+
          "</td><td><span align=\"right\" style='top:0px;float:right;'><a href=\"#\" onclick=\"windmill.ui.remote.saveSuite(\'"+suite.id+
          "\')\">[save]</a>&nbsp<a href=\"#\" onclick=\"windmill.ui.remote.deleteAction(\'"+suite.id+
          "\')\">[delete]</a>&nbsp<a href=\"#\" onclick=\"javascript:windmill.xhr.toggleCollapse(\'"+suite.id+
          "\')\">[toggle]</a></span></td></tr></table></div>";
          windmill.remote.$('ideForm').appendChild(suite);
      }
      return suite;
     }

    
    //Send the suite to save to the backend and receive an url for the user to save
    this.saveSuite = function(id){
       var suite = windmill.remote.$(id);
       var testArray = [];

       if (suite.hasChildNodes()){
            for (var j = 1; j < suite.childNodes.length; j++){
                //console.log(suites[i].childNodes[j].id);
                
                var actionObj = {};
                actionObj.suite_name = suite.id;
                actionObj.version = "0.1";
                var si = windmill.remote.$(suite.childNodes[j].id+'method').selectedIndex;
                actionObj.method = windmill.remote.$(suite.childNodes[j].id+'method')[si].value;

                var paramsObj = {};
                paramsObj.uuid = suite.childNodes[j].id;
                
                if (windmill.registry.methods[actionObj.method].locator){
                  var si = windmill.remote.$(suite.childNodes[j].id+'locatorType').selectedIndex;
                  paramsObj[windmill.remote.$(suite.childNodes[j].id+'locatorType')[si].value] = windmill.remote.$(suite.childNodes[j].id+'locator').value;
                }
                if (windmill.registry.methods[actionObj.method].option){
                  var si = windmill.remote.$(suite.childNodes[j].id+'optionType').selectedIndex;
                  paramsObj[windmill.remote.$(suite.childNodes[j].id+'optionType')[si].value] = windmill.remote.$(suite.childNodes[j].id+'option').value;
                }
                actionObj.params = paramsObj;
                //var str = fleegix.json.serialize(actionObj);
                testArray.push(actionObj);
            }
            
         var respRun = function(str){
             //alert(str);
             response = eval('(' + str + ')');
             //window.open(response.result,'Saved Test','width=400,height=600')
             //window.open(response.result);
             window.open(response.result,null,"height=500,width=600,status=no,toolbar=no,menubar=no,location=no,resizable=yes");
             return true;
         }
   
         //Get the language to save these suckers in
         var langSI = windmill.remote.$('suiteSaveFormat').selectedIndex;
         var lang = windmill.remote.$('suiteSaveFormat')[langSI].value;
         
         var json_object = new windmill.xhr.json_call('1.1', 'create_save_file');
         var params_obj = {};
         params_obj.transformer = lang;
         params_obj.suite_name  = id;
         params_obj.tests       = testArray;
         json_object.params     = params_obj;

         var json_string = fleegix.json.serialize(json_object)
         fleegix.xhr.doPost(respRun, '/windmill-jsonrpc/', json_string);
            
        }
        else { windmill.remote.alert('You need test actions to save!'); }
    }
     //This function takes a method and it's params and returns a DOM
     //Element representing that action for the UI
     this.buildAction = function(method, params){
         //if we just want a blank action
         //default to type for now so everything gets displayed
         if (method == null){
            method = 'click';
            params.id = '';
         }
         //If no params were passed
         if ( typeof(params) == 'undefined'){
           var params = {};
         }
         //var action = this.constructAction(method,'','',windmill.registry.methods[method].option,parms[windmill.registry.methods[method].option]);
         var action = windmill.remote.document.createElement('div');
         if (typeof(params.uuid) == 'undefined'){
          var date = new Date();
          action.id = date.getTime();
         }
         else{ action.id = params.uuid; }
         action.style.position   = 'relative';
         action.style.border     = '1px dashed #aaa';
         action.style.background = 'lightyellow';
         action.style.width      = '100%';
         
         //action.style.height = '50px';
         
         //in the case that the method we are passsing in isn't in the registry, we can still display it
         //just without all the interactive UI elements
         if ((windmill.registry.methods[method] == null) || (method == 'complex')){
            var t = windmill.remote.document.createElement('table');
            t.border      = "0";
            t.cellspacing = "1";
            t.cellpadding = "0";
            t.style.font  = "10px arial";
            t.style.width = "100%";  
            //console.log(fleegix.json.serialize(params));
            var r = windmill.remote.document.createElement("tr");
            var c = windmill.remote.document.createElement("td"); 
            c.style.width = '95%';
            //c.innerHTML += '<input type="text" class="texta" size="35" id="'+action.id+'method" value="'+ method +'"/>';
            var i0 = windmill.remote.document.createElement("input");
            i0.type      = 'text';
            i0.id        = action.id+'method';
            i0.className = 'texta';
            i0.size      = '40';
            i0.setAttribute('value', method);
            c.appendChild(i0);
            
            //This makes it look better in IE
            c.innerHTML += '<br>';
            //c.innerHTML += '<input type="text" class="texta" size="55" id="'+action.id+'params" value="'+ fleegix.json.serialize(params).replace( /"/g, '\'' ); +'"/>';
            var i = windmill.remote.document.createElement("input");
            i.type      = 'text';
            i.id        = action.id+'params';
            i.className = 'texta';
            i.size      = '55';

            i.setAttribute('value', fleegix.json.serialize(params));
            
            c.appendChild(i);
            r.appendChild(c);
            var c = windmill.remote.document.createElement("td"); 
            c.innerHTML += '<a onclick="windmill.ui.remote.addActionAbove(\''+action.id+
            '\')" href="#"><img border=0 style="height:16px;width:16px;" src="ide/img/addup.png"></a><br><a onclick="windmill.ui.remote.addActionBelow(\''+action.id+
            '\')" href="#"><img border=0 style="height:16px;width:16px;" src="ide/img/adddown.png"></a>';
            r.appendChild(c);

            var c = windmill.remote.document.createElement("td"); 
            c.innerHTML += '<a alt="Start Playback" href="#"><img border=0 onclick="windmill.ui.playback.sendPlayBack(\''+action.id+
            '\')" style="height:18px;width:18px;" src="ide/img/play.png"></a><a alt="Delete Action" href="#">'+
            '<img border=0 onclick="windmill.ui.remote.deleteAction(\''+action.id+'\')" style="height:18px;width:18px;" '+
            'src="ide/img/trash.png"></a>';
            
            r.appendChild(c);
            t.appendChild(r);
            
            action.appendChild(t);
            return action;
         }
         
         //We need a table to format this
         var t = windmill.remote.document.createElement('table');
         t.border      = "0";
         t.cellspacing = "1";
         t.cellpadding = "0";
         t.style.font  = "10px arial";

         
         var r = windmill.remote.document.createElement("tr");
         var c = windmill.remote.document.createElement("td");         
         
         c.innerHTML += 'Method: ';
         r.appendChild(c);
         //Setup the method drop down
             var s = windmill.remote.document.createElement('select');
             s.className = 'smalloption';
             s.style.font = '13px arial';
             s.id = action.id + 'method';
             //Setup default method
             var o = windmill.remote.document.createElement('option');
                 o.value = method;
                 o.selected = 'selected';
                 o.innerHTML += method;
                 s.appendChild(o);
            
            //Setup methods option  
             for (var m in windmill.registry.methods){
             
                 var o = windmill.remote.document.createElement('option');
                 o.value = m;
                 o.innerHTML += m;
                 s.appendChild(o);
             }
            s.setAttribute("onchange","windmill.ui.remote.methodChange('"+action.id+"');");

             var c = windmill.remote.document.createElement("td");
             c.colSpan = "3";
             c.appendChild(s);
             r.appendChild(c);
    
        var spn = windmill.remote.document.createElement('span');
        spn.style.position  = 'absolute';
        spn.style.left   = '95%';
        spn.style.bottom = '2px';
        spn.style.zindex = '10';
        spn.style.font   = '10px arial';

        spn.innerHTML += '<a alt="Start Playback" href="#"><img border=0 onclick="windmill.ui.playback.sendPlayBack(\''+action.id+
        '\')" style="height:18px;width:18px;" src="ide/img/play.png"></a><a alt="Delete Action" href="#">'+
        '<img border=0 onclick="windmill.ui.remote.deleteAction(\''+action.id+'\')" style="height:18px;width:18px;" '+
        'src="ide/img/trash.png"></a>';
        
        var spn2 = windmill.remote.document.createElement('span');
        spn2.style.position = 'absolute';
        spn2.style.left   = '90%';
        spn2.style.bottom = '3px';
        spn2.style.zindex = '10';
        spn2.style.font   = '10px arial';
        spn2.innerHTML += '<a onclick="windmill.ui.remote.addActionAbove(\''+action.id+
        '\')" href="#"><img border=0 style="height:16px;width:16px;" src="ide/img/addup.png"></a><br><a onclick="windmill.ui.remote.addActionBelow(\''+action.id+
        '\')" href="#"><img border=0 style="height:16px;width:16px;" src="ide/img/adddown.png"></a></span>';
        
        var c = windmill.remote.document.createElement("td"); 
        c.appendChild(spn);
        c.appendChild(spn2);
        r.appendChild(c);
        t.appendChild(r);

         //If this method needs a locator
         if ( windmill.registry.methods[method].locator){
             var r = windmill.remote.document.createElement("tr");
             r.id = action.id+'locatorRow';
             var c = windmill.remote.document.createElement("td"); 
             c.innerHTML += 'Locater: ';
             r.appendChild(c);
             
             var locator = null;
             
             if (params['id']){ locator    = 'id'; }
             if (params['jsid']){ locator  = 'jsid'; }
             if (params['name']){ locator  = 'name'; }
             if (params['link']){ locator  = 'link'; }
             if (params['xpath']){ locator = 'xpath'; }

           
            //Setup second select
             var s1 = windmill.remote.document.createElement('select');
             s1.className = 'smalloption';
             s1.id = action.id+'locatorType';
             
             var o1 = windmill.remote.document.createElement('option');
             o1.selected = 'selected';
             if (locator){ 
               o1.value = locator;
               o1.innerHTML += locator; 
             }
             s1.appendChild(o1);
             
             for(var i=0;i<windmill.registry.locator.length;i++){
               var o1 = windmill.remote.document.createElement('option');
               o1.value = windmill.registry.locator[i];
               o1.innerHTML += windmill.registry.locator[i];
               s1.appendChild(o1);
             }
             
             var c = windmill.remote.document.createElement("td"); 
             c.appendChild(s1);
             r.appendChild(c);

             //Add the text box
              var i0 = windmill.remote.document.createElement('input');
                 i0.name      = 'locValue';
                 i0.className = 'texta';
                 i0.size      = '45';
                 //Dont know why I have to do this.. but it wont work if its not setattrib
                 if (params[locator]){
                   i0.setAttribute('value',params[locator]);
                 }
                 i0.id        = action.id + 'locator';   
                 i0.setAttribute('onFocus', 'windmill.ui.remote.setRemoteElem(\''+i0.id+'\')');

               var c = windmill.remote.document.createElement("td"); 
               c.appendChild(i0);
               r.appendChild(c);
               t.appendChild(r);
             }
            
            //If this method has a option
            if (windmill.registry.methods[method].option != false){
             var r = windmill.remote.document.createElement("tr");
             r.id = action.id+'optionRow';
             var c = windmill.remote.document.createElement("td");  
             c.innerHTML += 'Option: ';
             r.appendChild(c);
             
             //Setup third select
             var s2= windmill.remote.document.createElement('select');
             s2.className = 'smalloption';
             s2.id = action.id+'optionType';
             
             var o2 = windmill.remote.document.createElement('option');
             if (typeof(windmill.registry.methods[method].option) != 'undefined'){
               o2.value = windmill.registry.methods[method].option;
             }
             o2.selected = 'selected';
             o2.innerHTML += windmill.registry.methods[method].option;
             s2.appendChild(o2);
             
             for(var i=0;i<windmill.registry.option.length;i++){
               var o2 = windmill.remote.document.createElement('option');
               o2.value = windmill.registry.option[i];
               o2.innerHTML += windmill.registry.option[i];
               s2.appendChild(o2);
              }
              var c = windmill.remote.document.createElement("td");  
              c.appendChild(s2);
              r.appendChild(c);
              
             //Add the text box
             var i1 = windmill.remote.document.createElement('input');
                 i1.name = 'optValue';
                 i1.className = 'texta';
                 i1.size = '40';
                 if (typeof(params[windmill.registry.methods[method].option]) != 'undefined'){
                   i1.setAttribute("value", params[windmill.registry.methods[method].option]);
                 }
                 i1.id = action.id + 'option';
                 i1.setAttribute('onFocus', 'windmill.ui.remote.setRemoteElem(\''+i1.id+'\')');

             var c = windmill.remote.document.createElement("td");  
             c.appendChild(i1);
             r.appendChild(c);
             t.appendChild(r);
            }
          
           action.appendChild(t);
           //action.innerHTML = t.innerHTML;
           return action; 
     }
};
