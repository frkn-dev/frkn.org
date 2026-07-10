(function () {
  var img = new Image();
  var params = [];

  params.push(
    "page=" + encodeURIComponent(location.pathname + location.search),
  );
  params.push("host=" + encodeURIComponent(location.host));

  if (document.referrer) {
    params.push("ref=" + encodeURIComponent(document.referrer));
  }

  var lang = navigator.language || navigator.userLanguage || "";
  if (lang) {
    params.push("lang=" + encodeURIComponent(lang));
  }

  function getQueryParam(name) {
    var match = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
  }

  [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ].forEach(function (key) {
    var value = getQueryParam(key);
    if (value) {
      params.push(key + "=" + encodeURIComponent(value));
    }
  });

  img.src = "https://media.frkn.org/pixel?" + params.join("&");
})();
