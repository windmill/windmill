var $ = function (s) { 
  return document.getElementById(s); };
function init() {
  var bullets = $('bulletListContainer');
  fleegix.fx.setCSSProp(bullets, 'opacity', 0);
  bullets.style.display = 'block';
  fleegix.fx.fadeIn(bullets, { duration: 1000 });
  // No conditional comments available, so use JS to do some
  // CSS color corrections for our special 'friend' Safari 2
  if (navigator.userAgent.indexOf('Safari/41') > -1) {
    document.body.style.backgroundColor = '#7cb3c0';
    $('main').style.borderColor = '#16323b';
  }
}

