//If the user went directly to remote.html
		if (!opener){
			document.location = '/windmill-serv/start.html';
		}
		var $ = function(id) {
		  return document.getElementById(id);
		};
				
		var closeDialog = function(id){
			$(id).style.display = 'none';
			$('gray').style.visibility = 'hidden';
		};
		var openDialog = function(id){
			$(id).style.display = 'block';
			$('gray').style.visibility = 'visible';
		};
		
		var toggleRec = function(){
			if ($('record').src.indexOf("ide/img/record.png")  != -1){
				windmill.ui.recorder.recordOn();
				opener.window.focus();
				$('record').src = 'ide/img/stoprecord.png';
			}
			else{
				windmill.ui.recorder.recordOff();
				$('record').src = 'ide/img/record.png';
			}
		}
		var togglePlay = function(){
			if ($('playback').src.indexOf("ide/img/playback.png")  != -1){
				windmill.xhr.startJsonLoop();
				windmill.ui.playback.sendPlayBack();				
				$('playback').src = 'ide/img/playbackstop.png';
			}
			else{
				$('playback').src = 'ide/img/playback.png';
			}
		}
		var toggleLoop = function(){
			if ($('loopLink').innerHTML.indexOf('Pause') != -1){
				$('loopLink').innerHTML = 'Resume Loop';
				windmill.xhr.togglePauseJsonLoop();
			}
			else{
				$('loopLink').innerHTML = 'Pause Loop';
				windmill.xhr.togglePauseJsonLoop();
			}
			
		}
		var toggleExplore = function(){
			if ($('explorer').src.indexOf("ide/img/xon.png")  != -1){
				$('domExp').style.visibility = 'visible';
				$('domExp').innerHTML = '';
				windmill.ui.domexplorer.domExplorerOn();
				opener.window.focus();
				$('explorer').src = 'ide/img/xoff.png';

			}
			else {
				$('domExp').style.visibility = 'hidden';
				windmill.ui.domexplorer.domExplorerOff();
				$('explorer').src = 'ide/img/xon.png';
				$('domExp').innerHTML = '';

			}
		}
		var toggleAExplore = function(){

			if ($('assertx').src.indexOf("ide/img/axon.png")  != -1){
				$('domExp').style.visibility = 'visible';
				$('domExp').innerHTML = '';
				windmill.ui.assertexplorer.assertExplorerOn();
				opener.window.focus();
				$('assertx').src = 'ide/img/axoff.png';

			}
			else {
				$('domExp').style.visibility = 'hidden';
				windmill.ui.assertexplorer.assertExplorerOff();
				$('assertx').src = 'ide/img/axon.png';
				$('domExp').innerHTML = '';

			}
		}
		
		//Scrolling rules when using the IDE
		//This is a pretty insane hack, description inline
		var scroll = function(){
				//When someone scrolls we are assuming they no longer want it to jump to the bottom
				//So here I am turning the auto scrolling off
				//However if they scroll back to the bottom, we want to turn auto scroll on
				$('autoScroll').checked = false;

				var ide = $('ide');
				var a = ide.scrollTop;
				var b = ide.scrollHeight - ide.offsetHeight + 1;
				var c = a - b;
				
				//If this offset that I get from the above math is less than 4
				//Then they are back at the bottom and we turn auto scroll back on
				if (Math.abs(c) < 4){
					$('autoScroll').checked = true;
				}
				//If not we keep auto scroll off
				else{
					$('autoScroll').checked = false;
				}
		}
		var doSubmit = function(){ return false; }    
    windmill.remote.init = function () {
      interpreterManager.initialize();
  		windmill.Start();
    };