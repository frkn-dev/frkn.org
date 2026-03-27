const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE = isLocal
  ? "http://localhost:5005"
  : "https://api.frkn.org";

const AUTH_BASE = isLocal
  ? "http://localhost:3005"
  : "https://api.frkn.org";

function isValidCode(code) {
  const cleaned = code.replace(/-/g, "").toUpperCase();

  const base32Regex = /^[A-Z2-7]+$/;

  return cleaned.length === 26 && base32Regex.test(cleaned);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("activateKeyForm");
  const msg = document.getElementById("message");
  const result = document.getElementById("result");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const code = formData.get("code");
    const email = formData.get("email");

    if (!isValidCode(code)) {
      msg.textContent = "❌ Неверный формат ключа";
      return;
    }

    msg.textContent = "Активация...";
    result.style.display = "none";

    const payload = {
      code: code,
      ...(email ? { email: email } : {}),
    };

    const btn = form.querySelector("button");
    btn.disabled = true;

    try {
      const res = await fetch(`${AUTH_BASE}/key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (res.ok) {
        msg.textContent = "✅ Ключ активирован";

        const sub = data.response?.instance?.Subscription;

        if (sub) {
          result.innerHTML = `
            <h3>Твоя подписка</h3>
            <div style="font-size: small;">ID это твой уникальный идентификатор подписки, рекомендуем его записать или запомнить</div>
            <p><b>ID:</b> ${sub.id}</p>

            <p><b>Активна до:</b> ${sub.expires_at || "—"}</p>

            <a href="${API_BASE}/sub/info?id=${sub.id}"
            style="display: inline-block;
              padding: 12px 24px;
              background-color: #1d4ed8;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;" target="_blank">
              Перейти к подписке
            </a>`;

          result.style.display = "block";
        }

        form.reset();
      } else {
        msg.textContent = "❌ " + (data.message || "Ошибка");
      }
    } catch (err) {
      msg.textContent = "❌ " + err.message;
    } finally {
      btn.disabled = false;
    }
  });
});
