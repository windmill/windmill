$ = function(v){
  return document.getElementById(v);
};

var erase = function(){
  fleegix.fx.fadeOut($('messages'));
};

var writeClicked = function(){
  $('messages').style.opacity = 0;
  $('messages').innerHTML = 'Clicked the button and recorded it!';
  fleegix.fx.fadeIn($('messages'));
  setTimeout('erase()', 2000);
};

var writeTxtChanged = function(){
  $('messages').style.opacity = 0;
  $('messages').innerHTML = 'Changed text and recorded it!';
  fleegix.fx.fadeIn($('messages'));
  setTimeout('erase()', 2000);

}

var init = function(){
  var s = $('sub');
  s.style.opacity = 0;
  fleegix.fx.fadeIn(s);
  

  var d = $('recordedClickId');
  fleegix.event.listen(d, 'onclick', writeClicked);
  var t = $('btnSub');
  fleegix.event.listen(t, 'onclick', writeTxtChanged);
};

