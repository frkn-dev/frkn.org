(function () {
  const path = window.location.pathname;
  const isEn = path.startsWith("/en/");
  const currentLang = isEn ? "en" : "ru";

  function getPairUrl(targetLang) {
    if (targetLang === currentLang) return null;
    if (targetLang === "en") {
      return "/en" + path;
    }
    return path.replace(/^\/en\//, "/");
  }

  function switchLang(lang) {
    localStorage.setItem("frkn-lang", lang);
    const url = getPairUrl(lang);
    if (url) window.location.href = url;
  }

  function autoRedirect() {
    const saved = localStorage.getItem("frkn-lang");
    if (saved && saved !== currentLang) {
      const url = getPairUrl(saved);
      if (url) window.location.href = url;
    }
  }

  function init() {
    autoRedirect();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang-switch]");
      if (!btn) return;
      e.preventDefault();
      const lang = btn.getAttribute("data-lang-switch");
      switchLang(lang);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.frknI18n = { currentLang, getPairUrl, switchLang };
})();
