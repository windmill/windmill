$ = function(v){
  return document.getElementById(v);
};

var erase = function(){
  fleegix.fx.fadeOut($('messages'));
};

var writeClicked = function(){
  $('messages').style.opacity = 0;
  $('messages').innerHTML = 'Clicked the DIV and recorded it!';
  fleegix.fx.fadeIn($('messages'));
  setTimeout('erase()', 2000);
};

var writeTxtChanged = function(){
  if ($('textFieldOne').value != ''){
    $('messages').style.opacity = 0;
    $('messages').innerHTML = 'Changed text and recorded it!';
    fleegix.fx.fadeIn($('messages'));
    setTimeout('erase()', 2000);
  }

}

var init = function(){
  var s = $('sub');
  s.style.opacity = 0;
  fleegix.fx.fadeIn(s);
  
  if (navigator.userAgent.indexOf('Safari/41') > -1) {
    document.body.style.backgroundColor = '#7cb3c0';
    $('main').style.borderColor = '#16323b';
  }
  
  var d = $('recordedClickId');
  fleegix.event.listen(d, 'onclick', writeClicked);
  var t = $('btnSub');
  fleegix.event.listen(t, 'onclick', writeTxtChanged);
};

