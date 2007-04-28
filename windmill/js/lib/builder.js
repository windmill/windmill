	var $ = function(id) {
		  return document.getElementById(id);
		};
		
	
		function methodSelected() {
			var method = $('methodDD').value;
			
			//Reset values for when the user changes the actions
			$('locator').style.display = 'none';
			$('other').style.display = 'none';
			$('optionValue').value = "";
			$('otherValue').value = "";
			//$('methodDD').value = "";
			$('locatorDD').value = "";
			$('optionDD').value = "";
			
			//Tailor the UI to the method they will be executing
			if (method == 'open') {
				$('other').style.display = 'block';
				$('optionDD').value = "url";
			};
		
			if (method == 'click') {
				$('locator').style.display = 'block';
			};
			if (method == 'wait') {
				$('other').style.display = 'block';
				$('optionDD').value = "seconds";
				
			};
			if (method == 'radio') {
				$('locator').style.display = 'block';
			};
			if (method == 'check') {
				$('locator').style.display = 'block';
			};
			if (method == 'type') {
				$('locator').style.display = 'block';
				$('other').style.display = 'block';
				$('optionDD').value = "text";	
			};
			if (method == 'verify') {
				$('locator').style.display = 'block';
				$('other').style.display = 'block';
				$('optionDD').value = "validator";
				
			};
			if (method == 'select') {
				$('locator').style.display = 'block';
				$('other').style.display = 'block';
				$('optionDD').value = "option";		
			};
			if (method == 'doubleClick') {
				$('locator').style.display = 'block';
			};
			if (method == 'setOptions') {
				$('other').style.display = 'block';
				$('optionDD').value = "stopOnFailure";
			};
			if (method == 'clickLozenge') {
				$('locator').style.display = 'block';
			};
			if (method == 'reWriteAlert') {
				//$('locator').style.display = 'block';
			};
			if (method == 'cosmoDragDrop') {
				$('locator').style.display = 'block';
				$('other').style.display = 'block';
				$('optionDD').value = "destination";
				$('otherValue').value = "{\"id\": \"hourDiv1-1100\"}";
				
			};
			//Set the text to reflect whats been selected
			$('methodName').innerHTML = "How will you be accessing the element you would like to "+method+".";
		}
		function getActionString(){
		    var paramsString = "";
			
			
			if($('methodDD').value == "cosmoDragDrop"){
				var idstring = "\""+$('locatorDD').value+"\": \""+$('optionValue').value+"\"";
				paramsString = "\"dragged\":{"+idstring+"},\""+$('optionDD').value+"\": "+$('otherValue').value;
			}
			else{
				if ($('locatorDD').value != "") {
					paramsString = "\""+$('locatorDD').value+"\": \""+$('optionValue').value+"\"";
				};
				if ($('optionDD').value != "") {
					if ($('locatorDD').value != "") {
						paramsString = paramsString + ",\""+$('optionDD').value+"\": \""+$('otherValue').value+"\"";
					}
					else
					{
						paramsString = paramsString + "\""+$('optionDD').value+"\": \""+$('otherValue').value+"\"";
					
					}
				};
			}
			
			var actionString = "{\"method\": \""+$('methodDD').value+"\", \"params\":{"+paramsString+"}}";
		    return actionString;
		}
		    
		//Create the json string
		function addAction() {
			
			actionString = getActionString();
			$('test').value = $('test').value +actionString+"\n";
			
		
			//fleegix.fx.fadeIn($('messages'));
			$('messages').style.display = "block";
			setTimeout("fleegix.fx.fadeOut($('messages'))",3000);
			$('messages').style.opacity = "1";
			
			return actionString;
		}
		
		//Append action to the recorder
		function addToRecorder(){
		    
		    action = getActionString();
		    $("wmTest").value =  $("wmTest").value + action +'}\n';
        }
		    
		
		function clearTest	() {
			$('test').value = '';	
		};
