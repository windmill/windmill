var parseString = function(str, s){
  var arr = str.split('.');
  var win = windmill.testWindow;
  if (s){ win = s;}
      
  var parseRecurse = function (n) {
    p = !n ? win : p[n];
    return arr.length ? parseRecurse(arr.shift()) : p;
  };
  return parseRecurse();
};