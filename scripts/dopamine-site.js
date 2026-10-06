(function () {
  var app =
    location.hostname === "frkn.app" || location.hostname === "www.frkn.app";
  if (!app) return;

  function pointLogoHome() {
    document.querySelectorAll("#logo-container .logo a").forEach(function (el) {
      el.setAttribute("href", "https://frkn.org/");
    });
  }
  pointLogoHome();
  var logo = document.getElementById("logo-container");
  if (logo) {
    new MutationObserver(pointLogoHome).observe(logo, {
      childList: true,
      subtree: true,
    });
  }

  document.querySelectorAll("[data-ds-home]").forEach(function (el) {
    el.setAttribute(
      "href",
      el.getAttribute("data-ds-home") === "en" ? "/en/" : "/",
    );
  });
  document.querySelectorAll("[data-ds-setup]").forEach(function (el) {
    el.setAttribute(
      "href",
      el.getAttribute("data-ds-setup") === "en" ? "/en/setup/" : "/setup/",
    );
  });
  document.querySelectorAll("[data-ds-label]").forEach(function (el) {
    el.textContent = el.getAttribute("data-ds-label");
  });

  var canon = document.querySelector('link[rel="canonical"]');
  if (canon) {
    var path = location.pathname.endsWith("/")
      ? location.pathname
      : location.pathname + "/";
    if (path === "//") path = "/";
    canon.setAttribute("href", "https://frkn.app" + (path === "/" ? "/" : path));
  }
})();
