const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE = isLocal ? "http://localhost:8000" : "https://frkn.org";

const API_BASE = isLocal ? "http://localhost:3005" : "https://api.frkn.org";

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
      msg.textContent = "Sending...";
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
          "❌ Sorry, emails to Proton won't be delivered. Use a different email.";
        msg.classList.add("error");
      }
      return;
    }

    if (!emailLow) {
      if (msg) {
        msg.textContent = "❌ Enter your email";
        msg.classList.add("error");
      }
      return;
    }

    if (btn) btn.disabled = true;

    const payload = {
      email: emailLow,
      language: "en",
      trial: true,
      ...(refCode ? { referred_by: refCode.toUpperCase() } : {}),
    };

    try {
      const res = await fetch(`${API_BASE}/account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.subscription_id) {
        if (msg) {
          msg.textContent =
            "✅ Test drive request accepted! Check your email. If needed, check the spam folder too.";

          msg.classList.add("success");
        }
        form.reset();
      } else {
        if (msg) {
          msg.textContent = "❌ " + (data.message || "Access error");
          msg.classList.add("error");
        }
      }
    } catch (err) {
      if (msg) {
        msg.textContent = "❌ Error: " + err.message;
        msg.classList.add("error");
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
