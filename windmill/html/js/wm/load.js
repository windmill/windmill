(function(){
   var url = 'js/controller/mozController.js';

  	if (browser.isIE){
  		url = 'js/controller/ieController.js';
  	}
  	else if(browser.isSafari){
  		url = 'js/controller/safController.js';
  	}
  	else if (browser.isOpera){
  		url = 'js/controller/opController.js';
  	}

	  var ctrlScriptTag = document.createElement('script');
    ctrlScriptTag.src = url;
    document.body.appendChild(ctrlScriptTag);

    windmill.start();
    
    //The tabs cover up the links in IE6, fixing this issue
		if (windmill.browser.isIE6x){
		   document.getElementById('tabs').style.height = '92%';
		}
})()