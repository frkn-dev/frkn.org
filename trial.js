document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trialForm");
  const msg = document.getElementById("message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Отправка...";
    const formData = new FormData(form);
    const promo = formData.get("code");

    const payload = {
      email: formData.get("email"),
      ...(promo ? { referred_by: promo } : {}),
    };

    try {
      const res = await fetch("https://api.frkn.org/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === 200) {
        msg.textContent =
          "Ваша заявка принята! Проверьте ваш e-mail или напишите @frkn_support.";
        form.reset();
      } else {
        msg.textContent = "❌ " + (data.message || "Неизвестная ошибка");
      }
    } catch (err) {
      msg.textContent = "❌ Ошибка сервера: " + err.message;
    }
  });
});
