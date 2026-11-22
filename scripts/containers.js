const path = window.location.pathname;
const langMatch = path.match(/^\/(en|fa)\//);
const suffix = langMatch ? `.${langMatch[1]}` : "";
const lang = langMatch ? langMatch[1] : "ru";

injectStatusBadge(lang);
initBgParallax();

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

function initBgParallax() {
  if (!document.body) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const docEl = document.documentElement;

  // ---- orbs parallax (CSS vars) ----
  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;

  function applyOrbs(scrollP) {
    if (reduced) return;
    const sy = scrollP * 90;
    document.body.style.setProperty(
      "--bg-t1",
      `translate3d(${(mx * 130).toFixed(1)}px, ${(-sy + my * 90).toFixed(1)}px, 0)`
    );
    document.body.style.setProperty(
      "--bg-t2",
      `translate3d(${(mx * -60).toFixed(1)}px, ${(-sy * 0.45 + my * -45).toFixed(1)}px, 0)`
    );
  }

  // ---- particles ----
  const canvas = document.createElement("canvas");
  canvas.id = "bg-particles";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    zIndex: "-1",
    pointerEvents: "none",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0;
  let H = 0;
  let dpr = 1;
  let particles = [];
  const worldPad = 360;
  const COLORS = ["56,189,248", "91,124,250", "139,92,246", "14,165,233", "230,232,239"];
  const LINK = 170;

  function seed() {
    const count = Math.min(420, Math.max(70, Math.floor((W * H) / 4000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * (H + worldPad),
      depth: 0.3 + Math.random() * 0.7,
      r: 0.6 + Math.random() * 1.9,
      a: 0.25 + Math.random() * 0.55,
      glow: Math.random() < 0.24,
      vy: 6 + Math.random() * 26,
      sway: 8 + Math.random() * 24,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  let last = performance.now();
  let time = 0;
  let rafId = 0;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    const max = docEl.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;

    mx += (tx - mx) * (1 - Math.exp(-dt * 6));
    my += (ty - my) * (1 - Math.exp(-dt * 6));

    applyOrbs(p);

    ctx.clearRect(0, 0, W, H);

    const worldH = H + worldPad;
    const sx = new Float32Array(particles.length);
    const sy = new Float32Array(particles.length);

for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const rate = 0.12 + 0.6 * pt.depth;
      let yy = pt.y - p * H * rate - time * pt.vy * pt.depth + my * 350 * pt.depth;
      yy = ((yy % worldH) + worldH) % worldH;
      let xx = pt.x + Math.sin(time * 0.5 + pt.phase) * pt.sway * pt.depth + mx * 450 * pt.depth;
      xx = ((xx % W) + W) % W;
      sx[i] = xx;
      sy[i] = yy;
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = sx[i] - sx[j];
        const dy = sy[i] - sy[j];
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const alpha = (1 - Math.sqrt(d2) / LINK) * 0.26;
          ctx.strokeStyle = "rgba(125,185,250," + alpha.toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i]);
          ctx.lineTo(sx[j], sy[j]);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      if (pt.glow) {
        ctx.fillStyle = "rgba(" + pt.color + "," + (pt.a * 0.16).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(sx[i], sy[i], pt.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(" + pt.color + "," + pt.a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(sx[i], sy[i], pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick(now) {
    frame(now);
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  window.addEventListener(
    "pointermove",
    (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  resize();
  if (!reduced) {
    rafId = requestAnimationFrame(tick);
  }
}
