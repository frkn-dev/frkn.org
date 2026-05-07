const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE = isLocal ? "http://localhost:8080" : "https://frkn.org";

const API_BASE = isLocal ? "http://localhost:3000" : "https://api.frkn.org";

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
    const subscription_id = formData.get("id");

    if (!isValidCode(code)) {
      msg.textContent = "❌ Неверный формат ключа";
      return;
    }

    msg.textContent = "Активация...";
    result.style.display = "none";

    const payload = {
      code: code,
      ...(subscription_id ? { subscription_id } : {}),
    };

    const btn = form.querySelector("button");
    btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/key/activate`, {
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

        const key = data.response?.instance?.Key;

        const subId = key?.subscription_id;

        console.log(subId);

        if (key) {
          result.innerHTML = `
            <h3>Твоя подписка</h3>
            <div style="font-size: small;">ID это твой уникальный идентификатор подписки, рекомендуем его записать или сделать скришот</div>
            <p><b>ID:</b> ${subId}</p>


            <div id="countdown" style="margin-bottom: 20px; font-weight: bold; color: #60a5fa;"></div>

            <a href="${BASE}/subscription?id=${subId}"
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

          if (sub.expires) {
            startCountdown(sub.expires);
          }
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

function startCountdown(endTimeStr) {
  const timerElement = document.getElementById("countdown");
  if (!timerElement) return;

  const endTime = new Date(endTimeStr).getTime();

  console.log(endTimeStr);

  const getDaysWord = (n) => {
    const last = n % 10;
    const lastTwo = n % 100;
    if (last === 1 && lastTwo !== 11) return "день";
    if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return "дня";
    return "дней";
  };

  const update = () => {
    const now = new Date().getTime();
    const diff = endTime - now;

    if (diff <= 0) {
      timerElement.textContent = "Срок действия истек";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let timeString = "Осталось: ";
    if (days > 0) {
      timeString += `${days} ${getDaysWord(days)} `;
    }
    timeString += `${hours}ч ${minutes}м ${seconds}с`;

    timerElement.textContent = timeString;
  };

  update();
  setInterval(update, 1000);
}
