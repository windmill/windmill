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

//Functions for writing status to the UI
/***************************************/
windmill.ui.results = new function() {

    //Writing to the performance tab
    this.writePerformance = function(timeObj, params) {
        // var resultsDiv = $("perfOut");
        // resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML
          var newParams = copyObj(params);
          delete newParams.uuid;
          //setup time stuff in params
          newParams.StartTime = timeObj.getStart();
          newParams.EndTime = timeObj.getEnd();
          newParams.RunTime = timeObj.getRun() + " ms";
          
          var resultsDiv = $("perfOut");
          var resDiv = document.createElement('div');
          resDiv.className = "ui-state-highlight ui-corner-all outputEntry";
          resDiv.style.height = "12px";
          // if (windmill.browser.isIE){
          //   resDiv.style.width = "95%";
          // }
       
          resDiv.innerHTML = "<strong>"+timeObj.identifier + "</strong>: "+newParams.RunTime+
            "&nbsp;<a class='moreLink' href='#'>more</a>";
          for (i in newParams){
            var propDiv = document.createElement('div');
            propDiv.style.fontSize = "11px";
            propDiv.innerHTML = "<strong>"+i+"</strong>: "+newParams[i];
            resDiv.appendChild(propDiv);
          }
          //Depending if there are any child nodes yet
          if (jQuery(resultsDiv).children().length == 0){
            resultsDiv.appendChild(resDiv);
          } 
          else {
            resultsDiv.insertBefore(resDiv, jQuery(resultsDiv).children()[0]);
          }
          jQuery(resDiv).click(function() {
              if (resDiv.style.height == "12px"){
                resDiv.style.height = "";
                jQuery(resDiv).html(windmill.helpers.replaceAll(jQuery(resDiv).html(),'more','less'));
              }
              else {
                resDiv.style.height = "12px";
                jQuery(resDiv).html(windmill.helpers.replaceAll(jQuery(resDiv).html(),'less','more'));
              }
          });
    }

    this.writeStatus = function(str) {
        //If the remote hasn't fully loaded, this kills the action
        //that is trying to be run, because this code either stalls or dies
        //this makes sure, and is set by the remote onload
        if (windmill.remoteLoaded == true) {
            var status = $("runningStatus");
            status.innerHTML = '<b>Status:</b> ' + str;
        }
    }

    //Writing to the results tab
    this.writeResult = function(str) {
        var resultsDiv = $("resOut");
        var blk = "<div class='ui-state-highlight ui-corner-all outputEntry'>"+ str + "</div>";
        resultsDiv.innerHTML = blk + resultsDiv.innerHTML;
    }
    
    this.writeAction = function(method, params, result){
      var newParams = copyObj(params);
      delete newParams.uuid;
      
      var resultsDiv = $("resOut");
      var resDiv = document.createElement('div');
      if (params.aid){
        resDiv.id = params.aid+"result";
      }
      // resDiv.className = "outputEntry";
      // resDiv.style.height = "14px";
      // if (windmill.browser.isIE){
      //   resDiv.style.width = "95%";
      // }
      resDiv.style.height = "12px";
      if (result){
        resDiv.className = "ui-state-highlight ui-corner-all outputEntry";
        resDiv.style.border = "1px solid darkgreen";
        resDiv.style.background = "#C7FFCC";
        
      }
      else { 
        resDiv.className = "ui-state-error ui-corner-all outputEntry";
      }

      var props = false;
      for (i in newParams){
        var propDiv = document.createElement('div');
        //propDiv.style.fontSize = "11px";
        propDiv.innerHTML = "<strong>"+i+"</strong>: "+newParams[i];
        resDiv.appendChild(propDiv);
        props = true;
      }
      
      if (props){
        resDiv.innerHTML = "<strong>"+method + 
          "</strong>&nbsp;<a style='color:#000;' class='moreLink' href='#'>more</a>" + 
          resDiv.innerHTML;
      }
      else {
        resDiv.innerHTML = "<strong>"+method + "</strong> " + resDiv.innerHTML;
      }
      
      //Depending if there are any child nodes yet
      if (jQuery(resultsDiv).children().length == 0){
        resultsDiv.appendChild(resDiv);
      } 
      else {
        resultsDiv.insertBefore(resDiv, jQuery(resultsDiv).children()[0]);
      }
      
      jQuery(resDiv).click(function() {
          if (resDiv.style.height == "12px"){
            this.style.height = "";
            jQuery(this).html(windmill.helpers.replaceAll(jQuery(this).html(),'more','less'));
          }
          else {
            this.style.height = "12px";
            jQuery(this).html(windmill.helpers.replaceAll(jQuery(this).html(),'less','more'));
          }
      });
    }
};

//shortcuts
windmill.actOut = windmill.ui.results.writeAction;
windmill.out = windmill.ui.results.writeResult;
windmill.stat = windmill.ui.results.writeStatus;
windmill.perf = windmill.ui.results.writePerformance;