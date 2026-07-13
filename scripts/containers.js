const path = window.location.pathname;
const langMatch = path.match(/^\/(en|fa)\//);
const suffix = langMatch ? `.${langMatch[1]}` : "";
const lang = langMatch ? langMatch[1] : "ru";

injectStatusBadge(lang);

document.addEventListener("DOMContentLoaded", () => {
  load(`/container/footer${suffix}.html`, "footer-container");
  load(`/container/logo${suffix}.html`, "logo-container");
  load("/container/services.html", "services-container");
});

function load(url, id) {
  const el = document.getElementById(id);
  if (!el) return;

  fetch(url)
    .then((res) => res.text())
    .then((html) => {
      el.innerHTML = html;
    })
    .catch((err) => {
      console.error(`Failed to load ${url}:`, err);
    });
}

function injectStatusBadge(lang) {
  const path = window.location.pathname;
  if (path.startsWith("/subscription") || path.startsWith("/en/subscription")) {
    return;
  }

  if (!document.body) {
    document.addEventListener("DOMContentLoaded", () => injectStatusBadge(lang));
    return;
  }

  if (document.querySelector(".status-badge")) return;

  const labels = {
    ru: "Статус",
    en: "Status",
    fa: "وضعیت",
  };

  const badge = document.createElement("a");
  badge.href = "https://status.frkn.org/";
  badge.target = "_blank";
  badge.rel = "noopener";
  badge.className = "status-badge";
  badge.innerHTML = `<span class="status-dot"></span><span class="status-text">${labels[lang] || labels.ru}</span>`;

  const style = document.createElement("style");
  style.textContent = `
    .status-badge {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(11, 13, 18, 0.9);
      color: #fff;
      border-radius: 999px;
      text-decoration: none;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s, background 0.2s;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    .status-badge:hover {
      transform: translateY(-2px) translateZ(0);
      background: rgba(11, 13, 18, 1);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      transform: translateZ(0);
      animation: status-pulse 2s ease-in-out infinite;
    }
    @keyframes status-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.35); opacity: 0.85; }
    }
    @media (max-width: 480px) {
      .status-badge {
        bottom: 14px;
        right: 14px;
        padding: 7px 12px;
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(badge);
}
