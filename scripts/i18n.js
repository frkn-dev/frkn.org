(function () {
  const path = window.location.pathname;
  const langMatch = path.match(/^\/(en|fa)\//);
  const currentLang = langMatch ? langMatch[1] : "ru";

  // Pages that actually have a /fa/ translation
  const FA_PAGES = new Set(["/", "/pay/", "/subscription/"]);

  function hasFaVersion(path) {
    // Normalize path to always end with /
    const normalized = path.endsWith("/") ? path : path + "/";
    return FA_PAGES.has(normalized);
  }

  function getPairUrl(targetLang) {
    if (targetLang === currentLang) return null;

    // Получаем путь без языкового префикса
    const rest = path.replace(/^\/(en|fa)\//, "/");

    if (targetLang === "fa") {
      if (!hasFaVersion(rest)) return null;
      return "/fa" + rest;
    }

    if (targetLang === "en") {
      return "/en" + rest;
    }

    // targetLang === "ru"
    return rest;
  }

  function switchLang(lang) {
    localStorage.setItem("frkn-lang", lang);
    sessionStorage.removeItem("frkn-lang-redirect-count");
    const url = getPairUrl(lang);
    if (url) window.location.href = url;
  }

  function autoRedirect() {
    // Do not auto-redirect on subscription pages: user may intentionally open /en/subscription/ or /subscription/
    if (path.startsWith("/subscription") || path.startsWith("/en/subscription")) {
      return;
    }

    const saved = localStorage.getItem("frkn-lang");
    if (!saved || saved === currentLang) {
      sessionStorage.removeItem("frkn-lang-redirect-count");
      return;
    }

    const redirectCount = parseInt(
      sessionStorage.getItem("frkn-lang-redirect-count") || "0",
      10,
    );
    if (redirectCount >= 2) return;

    const url = getPairUrl(saved);
    if (!url) return;

    sessionStorage.setItem(
      "frkn-lang-redirect-count",
      String(redirectCount + 1),
    );
    window.location.href = url;
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
