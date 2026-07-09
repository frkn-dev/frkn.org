(function () {
  var img = new Image();
  var params = [];
  params.push('page=' + encodeURIComponent(location.pathname + location.search));
  if (document.referrer) {
    params.push('ref=' + encodeURIComponent(document.referrer));
  }
  img.src = 'https://media.frkn.org/pixel?' + params.join('&');
})();
