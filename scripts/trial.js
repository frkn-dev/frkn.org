const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const AUTH_BASE = isLocal
  ? "http://localhost:3005"
  : "https://api.frkn.org";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trialForm");
  const msg = document.getElementById("message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Сбрасываем классы и ставим статус отправки
    if (msg) {
      msg.textContent = "Отправка...";
      msg.className = "status-message";
    }

    const formData = new FormData(form);
    const promo = formData.get("code");

    const payload = {
      email: formData.get("email"),
      ...(promo ? { referred_by: promo } : {}),
    };

    try {
      const res = await fetch(`${AUTH_BASE}/trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === 200) {
        if (msg) {
          msg.textContent = "Ваша заявка принята! Проверьте e-mail.";
          msg.classList.add("success");
        }
        form.reset();
      } else {
        if (msg) {
          msg.textContent = "❌ " + (data.message || "Ошибка доступа");
          msg.classList.add("error");
        }
      }
    } catch (err) {
      if (msg) {
        msg.textContent = "❌ Ошибка сети: " + err.message;
        msg.classList.add("error");
      }
    }
  });
});
