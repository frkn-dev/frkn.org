const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE = isLocal ? "http://localhost:8000" : "https://frkn.org";

const API_BASE = isLocal ? "http://localhost:3005" : "https://api.frkn.org";

const PAYMENT_API_BASE = isLocal
  ? "http://localhost:3006"
  : "https://api.frkn.org";

function getUrlRefCode() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("code") ||
    params.get("ref") ||
    params.get("referral") ||
    params.get("referral_code") ||
    null
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trialForm");
  const msg = document.getElementById("message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector("button");

    if (msg) {
      msg.textContent = "Создаём платёж...";
      msg.className = "status-message";
    }

    const formData = new FormData(form);
    const emailRaw = formData.get("email") || "";
    const emailLow = emailRaw.toString().toLowerCase().trim();
    const refCode = getUrlRefCode();

    const protonDomains = [
      "@proton.me",
      "@protonmail.com",
      "@pm.me",
      "@protonmail.ch",
    ];
    if (protonDomains.some((domain) => emailLow.endsWith(domain))) {
      if (msg) {
        msg.textContent =
          "❌ Сорян, на Proton письмо не дойдёт. Используй другую почту.";
        msg.classList.add("error");
      }
      return;
    }

    if (!emailLow) {
      if (msg) {
        msg.textContent = "❌ Введи почту";
        msg.classList.add("error");
      }
      return;
    }

    const emailRe = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/;
    if (!emailRe.test(emailLow)) {
      if (msg) {
        msg.textContent =
          "❌ Похоже, в почте опечатка — проверь адрес. Только латиница, цифры и . _ % + -";
        msg.classList.add("error");
      }
      return;
    }

    if (btn) btn.disabled = true;

    // lite-ключ: 1 ГБ трафика, duration 0 — живёт, пока трафик не кончится
    const payload = {
      duration: 0,
      kind: "lite",
      traffic_gib: 1,
      email: emailLow,
      promocode: null,
      refCode: refCode ? refCode.toUpperCase() : null,
    };

    try {
      const res = await fetch(`${PAYMENT_API_BASE}/payment/platega/key/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        if (data.transactionId) {
          localStorage.setItem("frkn_last_transaction_id", data.transactionId);
        }
        window.location.href = data.url;
        return;
      }

      const errorText = data.error || data.message || "Не удалось создать платёж";
      if (msg) {
        msg.textContent = "❌ " + errorText;
        msg.classList.add("error");
      }
    } catch (err) {
      if (msg) {
        msg.textContent = "❌ Ошибка: " + err.message;
        msg.classList.add("error");
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
