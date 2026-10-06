(function () {
  var section = document.querySelector(".download-section");
  if (!section) return;

  var API = location.hostname.endsWith(".onion")
    ? location.origin + "/api"
    : "https://api.frkn.org";
  var KEY = "downloads";
  var el = document.getElementById("download-count");
  var n = 0;

  function format(v) {
    try {
      return Number(v).toLocaleString(document.documentElement.lang || undefined);
    } catch (e) {
      return String(v);
    }
  }

  function show(v) {
    n = Number(v) || 0;
    if (!el) return;
    var strong = el.querySelector("strong");
    if (strong) strong.textContent = format(n);
    el.hidden = false;
  }

  function isDownloadLink(a) {
    if (!a || a.tagName !== "A") return false;
    if (a.classList.contains("placeholder")) return false;
    if (a.classList.contains("setup-guide")) return false;
    if (a.classList.contains("download-btn")) return true;
    var href = a.getAttribute("href") || "";
    if (!href || href === "#" || href.indexOf("javascript:") === 0) return false;
    if (a.hasAttribute("download")) return true;
    if (/\.(apk|msi|pkg|dmg|bin|exe|AppImage)(\?|#|$)/i.test(href)) return true;
    if (/testflight\.apple\.com|apps\.apple\.com|play\.google\.com/i.test(href))
      return true;
    return false;
  }

  fetch(API + "/counter?key=" + encodeURIComponent(KEY))
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    })
    .then(function (data) {
      if (data && typeof data.value === "number") show(data.value);
    })
    .catch(function () {});

  section.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest("a");
      if (!isDownloadLink(a) || !section.contains(a)) return;
      show(n + 1);
      fetch(API + "/counter/inc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: KEY }),
        keepalive: true,
      })
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject(r.status);
        })
        .then(function (data) {
          if (data && typeof data.value === "number") show(data.value);
        })
        .catch(function () {});
    },
    true,
  );
})();
