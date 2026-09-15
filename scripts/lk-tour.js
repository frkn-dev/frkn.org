// Onboarding-тур по личному кабинету. Показывается один раз (localStorage),
// перезапуск — плавающая кнопка «?». Без зависимостей.
(() => {
  const isEn = window.location.pathname.startsWith("/en/");
  const SEEN_KEY = "frkn_lk_tour_seen_v1";

  const I18N = isEn
    ? {
        next: "Next",
        skip: "Skip",
        done: "Got it!",
        helpAria: "Show page tour",
        steps: [
          {
            selector: ".download-btn-link",
            title: "Download the app",
            text: "FRKN Dopamine — our client for all platforms. Start here.",
          },
          {
            selector: "#show-qr-btn",
            title: "Connect via QR",
            text: "Scan the code from the app — the device connects by itself, no manual configs.",
          },
          {
            selector: "#addDeviceBtn",
            title: "Add devices",
            text: "Phone, laptop, TV — create a separate connection for each one here.",
          },
          {
            selector: "#traffic-summary-inline",
            title: "Traffic",
            text: "Usage stats live here. If traffic runs out — top up gigabytes, they never expire.",
          },
          {
            selector: ".apps a[href='/setup'], .apps a[href='/en/setup']",
            title: "Routers and more",
            text: "Setup guides for routers (AmneziaWG) and other devices are in the “How to set up” section.",
          },
        ],
      }
    : {
        next: "Далее",
        skip: "Пропустить",
        done: "Понятно!",
        helpAria: "Показать тур по странице",
        steps: [
          {
            selector: ".download-btn-link",
            title: "Скачай приложение",
            text: "FRKN Dopamine — наш клиент для всех платформ. Начни с него.",
          },
          {
            selector: "#show-qr-btn",
            title: "Подключение по QR",
            text: "Сканируешь код из приложения — устройство подключается само, без ручных конфигов.",
          },
          {
            selector: "#addDeviceBtn",
            title: "Добавить устройство",
            text: "Телефон, ноут, телевизор — здесь создаёшь отдельное подключение для каждого.",
          },
          {
            selector: "#traffic-summary-inline",
            title: "Трафик",
            text: "Здесь видно расход. Если трафик кончится — докупишь гигабайты, они не сгорают.",
          },
          {
            selector: ".apps a[href='/setup'], .apps a[href='/en/setup']",
            title: "Роутеры и другое",
            text: "Инструкции для роутеров (AmneziaWG) и других устройств — в разделе «Как настроить».",
          },
        ],
      };

  const CSS = `
    .lkt-catcher { position: fixed; inset: 0; z-index: 5000; }
    .lkt-spot {
      position: fixed; z-index: 5001; pointer-events: none;
      border-radius: 14px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.4);
      outline: 2px solid var(--accent, #38bdf8);
      transition: top .25s ease, left .25s ease, width .25s ease, height .25s ease;
    }
    .lkt-tip {
      position: fixed; z-index: 5002; width: min(320px, calc(100vw - 32px));
      background: var(--card, #121622); color: var(--text, #e6e8ef);
      border: 1px solid var(--border, #1f263a); border-radius: 16px;
      padding: 18px; box-shadow: 0 12px 40px rgba(0,0,0,.5);
    }
    .lkt-tip h4 { margin: 0 0 8px; font-size: 16px; }
    .lkt-tip p { margin: 0 0 14px; font-size: 14px; color: var(--muted, #9aa1b2); line-height: 1.5; }
    .lkt-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .lkt-counter { font-size: 12px; color: var(--muted, #9aa1b2); }
    .lkt-btns { display: flex; gap: 8px; }
    .lkt-next {
      background: var(--accent, #38bdf8); color: #05060a; border: none;
      padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer;
    }
    .lkt-skip {
      background: transparent; color: var(--muted, #9aa1b2);
      border: 1px solid var(--border, #1f263a); padding: 8px 12px;
      border-radius: 10px; font-size: 13px; cursor: pointer;
    }
    .lkt-help {
      position: fixed; right: 18px; bottom: 18px; z-index: 4000;
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--card, #121622); color: var(--accent, #38bdf8);
      border: 1px solid var(--border, #1f263a); font-size: 20px; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.4);
    }
    .lkt-help:hover { border-color: var(--accent, #38bdf8); }
  `;

  let root = null;
  let spotEl = null;
  let tipEl = null;
  let steps = [];
  let idx = 0;
  let prevOverflow = "";

  function isVisible(el) {
    if (!el) return false;
    if (el.closest(".hidden")) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function collectSteps() {
    return I18N.steps
      .map((s) => ({ ...s, el: document.querySelector(s.selector) }))
      .filter((s) => isVisible(s.el));
  }

  function placeStep() {
    const step = steps[idx];
    const PAD = 8;
    step.el.scrollIntoView({ block: "center", behavior: "auto" });
    const r = step.el.getBoundingClientRect();
    spotEl.style.top = `${r.top - PAD}px`;
    spotEl.style.left = `${r.left - PAD}px`;
    spotEl.style.width = `${r.width + PAD * 2}px`;
    spotEl.style.height = `${r.height + PAD * 2}px`;

    tipEl.querySelector("h4").textContent = step.title;
    tipEl.querySelector("p").textContent = step.text;
    tipEl.querySelector(".lkt-counter").textContent = `${idx + 1} / ${steps.length}`;
    tipEl.querySelector(".lkt-next").textContent =
      idx === steps.length - 1 ? I18N.done : I18N.next;

    // тултип: снизу, если есть место, иначе сверху
    const tipH = tipEl.offsetHeight || 180;
    const below = r.bottom + 14;
    const above = r.top - tipH - 14;
    const top =
      below + tipH < window.innerHeight - 12 ? below : Math.max(12, above);
    let left = r.left;
    left = Math.max(
      12,
      Math.min(left, window.innerWidth - tipEl.offsetWidth - 12),
    );
    tipEl.style.top = `${top}px`;
    tipEl.style.left = `${left}px`;
  }

  function finish() {
    if (root) root.remove();
    root = null;
    document.body.style.overflow = prevOverflow;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch (e) {}
  }

  function start() {
    steps = collectSteps();
    if (!steps.length || root) return;
    idx = 0;

    root = document.createElement("div");
    root.innerHTML = `
      <div class="lkt-catcher"></div>
      <div class="lkt-spot"></div>
      <div class="lkt-tip">
        <h4></h4>
        <p></p>
        <div class="lkt-row">
          <span class="lkt-counter"></span>
          <div class="lkt-btns">
            <button type="button" class="lkt-skip">${I18N.skip}</button>
            <button type="button" class="lkt-next">${I18N.next}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    spotEl = root.querySelector(".lkt-spot");
    tipEl = root.querySelector(".lkt-tip");
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    root.querySelector(".lkt-catcher").addEventListener("click", finish);
    root.querySelector(".lkt-skip").addEventListener("click", finish);
    root.querySelector(".lkt-next").addEventListener("click", () => {
      idx += 1;
      if (idx >= steps.length) {
        finish();
      } else {
        placeStep();
      }
    });

    placeStep();
  }

  function init() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const help = document.createElement("button");
    help.type = "button";
    help.className = "lkt-help";
    help.textContent = "?";
    help.setAttribute("aria-label", I18N.helpAria);
    help.addEventListener("click", start);
    document.body.appendChild(help);

    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch (e) {}
    if (!seen) setTimeout(start, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
