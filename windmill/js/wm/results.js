//Functions for writing status to the UI
/***************************************/
windmill.ui.results = new function () {
    
    //Writing to the performance tab
    this.writePerformance = function(str){
      var resultsDiv = windmill.remote.$("tab3");
      resultsDiv.innerHTML =  str + "<br>" + resultsDiv.innerHTML
    }
    
    this.writeStatus = function(str){
      windmill.remote.$("runningStatus").innerHTML = str;
    }
    
    //Writing to the results tab
    this.writeResult = function(str){
        var resultsDiv = windmill.remote.$("tab4");
        resultsDiv.innerHTML = str + "<br>" + resultsDiv.innerHTML;
        //resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

};