(function(){
    jQuery("#loadMessage").html("Waiting for Testing App...");
  
    windmill.controller.waits._forNotTitleAttach({
      title: "Loading Windmill Testing Framework"
    });
  
  var url = 'js/controller/mozController.js';

  jQuery("#loadMessage").html("Determining your Browser...");
  incProgressBar();
  
	if (browser.isIE){
		url = 'js/controller/ieController.js';
	}
	else if(browser.isSafari){
		url = 'js/controller/safController.js';
	}
	else if (browser.isOpera){
		url = 'js/controller/opController.js';
	}
  
  jQuery("#loadMessage").html("Downloading Browser Specific JS...");
  incProgressBar();
  
  var ctrlScriptTag = document.createElement('script');
  ctrlScriptTag.src = url;
  document.body.appendChild(ctrlScriptTag);
  
  //The tabs cover up the links in IE6, fixing this issue
	if (windmill.browser.isIE6x){
	   document.getElementById('tabs').style.height = '92%';
	}  
})()