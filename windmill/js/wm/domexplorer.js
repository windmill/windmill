//DOM Explorer Functions
/***************************************/
windmill.ui.domexplorer = new function () {
  
  var domExplorerBorder = null;

    //Reset the border to what it was before the mouse over
    this.resetBorder = function(e){
        e.target.style.border = '';
        e.target.style.border = this.domExplorerBorder;
    }
    
    //Display the id in the remote
    this.setIdInRemote = function(e){
        //console.log  (e);
        if(e.target.id != ""){
            windmill.remote.$("domExp").innerHTML = "ID: "+ e.target.id;  
        }
        else{
            windmill.remote.$("domExp").innerHTML = "Name: "+ e.target.nodeName;  
        }
        this.domExplorerBorder = e.target.style.border;
        e.target.style.border = "1px solid yellow";
    }
    
    this.explorerClick = function(e){
      	windmill.remote.window.focus();
        if (windmill.ui.remote.selectedElement != null){
         windmill.remote.$(windmill.ui.remote.selectedElement).value =  windmill.remote.$("domExp").innerHTML.replace('ID: ','').replace('Name: ','');
        }
    }
    
    //Set the listeners for the dom explorer
    this.domExplorerOn = function(){
        //fleegix.event.listen(windmill.testingApp.document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseover', this, 'setIdInRemote');
        fleegix.event.listen(windmill.testingApp.document, 'onmouseout', this, 'resetBorder');
        fleegix.event.listen(windmill.testingApp.document, 'onclick', this, 'explorerClick');
        
    }
    
    //Remove the listeners for the dom explorer
    this.domExplorerOff = function(){
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseover', this, 'setIdInRemote');
         fleegix.event.unlisten(windmill.testingApp.document, 'onmouseout', this, 'resetBorder');
         fleegix.event.unlisten(windmill.testingApp.document, 'onclick', this, 'explorerClick');
         
         //Reset the selected element
         windmill.ui.remote.selectedElement = null;
    }  
};