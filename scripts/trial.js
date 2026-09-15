// Покупка lite-ключа (1 ГБ) с лендинга: модалка как в /pay, без email.
// Ключ показывается на странице /transaction после оплаты.
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const PAYMENT_API_BASE = isLocal
  ? "http://localhost:3006"
  : "https://api.frkn.org";

const TRIAL_I18N = {
  modalTitle: "Покупка трафика<br>{gb} ГБ",
  gbLabel: "{gb} ГБ трафика — живёт вечно",
  promoLabel: "Промокод",
  promoPlaceholder: "Введите промокод",
  promoApply: "Применить",
  promoApplied: "Промокод применён",
  promoInvalid: "Пупупу кажется промокод недействителен",
  refLabel: "Реферальный код друга",
  refPlaceholder: "Введите код друга",
  refApply: "Применить",
  refApplied:
    "Реферальный код применён. Твоему другу будет добавлено 30 дней после оплаты.",
  refInvalid: "Реферальный код не найден",
  payPlanta: "Оплата СБП",
  payPlatega: "Оплата картой МИР/Криптой",
  creating: "Создаём счёт...",
  waitingPlanta: "Ждём ссылку на оплату от СБП...",
  gatewaysNote:
    "«Оплата СБП» — шлюз Planta, «Оплата картой МИР/Криптой» — шлюз Platega. Мы не храним ваши данные.",
  secureNote: "🔒 Безопасная оплата картой, СБП, криптовалютой",
  keepOpenNote: "⚠️ Не закрывайте это окно до подтверждения оплаты",
  txidNote:
    "‼️ Если платёжная система не вернёт вас на сайт — вставьте ID оплаты в ссылку https://frkn.org/transaction?txid=<Ваш ID оплаты>",
  keyNote: "Ключ покажем на странице сразу после оплаты — без почты.",
  errorTitle: "Ошибка",
  errorOk: "Понятно",
  createFail: "Не удалось создать платёж",
  noUrl: "API не вернул ссылку на оплату",
  noTxid: "API не вернул ID транзакции",
  plantaTimeout:
    "СБП не ответил вовремя. Проверьте статус по ID транзакции: ",
  paymentCancelled: "Платёж отменён, попробуйте ещё раз",
};

function generateTraceId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

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

function getUrlPromoCode() {
  return new URLSearchParams(window.location.search).get("promo") || null;
}

const TRIAL_MODAL_CSS = `
  .tm-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    z-index: 2000;
    justify-content: center;
    align-items: center;
  }
  .tm-overlay.active { display: flex; }
  .tm-content {
    background: var(--card);
    color: var(--text);
    padding: 40px;
    border-radius: 30px;
    width: 90%;
    max-width: 450px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    border: 1px solid var(--border);
  }
  .tm-close {
    position: absolute;
    top: 20px;
    right: 25px;
    font-size: 32px;
    color: #666;
    cursor: pointer;
    transition: color 0.2s;
  }
  .tm-close:hover { color: #fff; }
  .tm-content h2 { margin-top: 0; }
  .tm-form-group { margin-bottom: 20px; }
  .tm-form-group label {
    display: block;
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 8px;
  }
  .tm-promo-wrapper { display: flex; gap: 10px; }
  .tm-form-group input {
    width: 100%;
    padding: 14px;
    background: #1a1f2e;
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    font-size: 16px;
    flex: 1;
  }
  .tm-form-group input:focus { outline: none; border-color: var(--accent); }
  .tm-apply-btn {
    padding: 13px;
    background: var(--accent-2);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tm-apply-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .tm-info {
    margin-top: 8px;
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
    display: none;
  }
  .tm-info.valid { color: #22c55e; }
  .tm-info.invalid { color: #ef4444; }
  .tm-total {
    text-align: center;
    margin: 20px 0;
    padding: 20px;
    background: rgba(14, 165, 233, 0.1);
    border-radius: 16px;
  }
  .tm-total-price { font-size: 42px; font-weight: 800; color: var(--accent); }
  .tm-old-price {
    font-size: 22px;
    text-decoration: line-through;
    color: var(--muted);
    margin-right: 12px;
  }
  .tm-gb-label { font-size: 14px; margin-top: 8px; color: var(--muted); }
  .tm-pay-btn {
    width: 100%;
    padding: 16px;
    background: var(--accent);
    color: #05060a;
    border: none;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 24px rgba(56, 189, 248, 0.35);
  }
  .tm-pay-btn:hover { background: var(--accent-2); transform: translateY(-1px); }
  .tm-pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .tm-pay-btn.tm-secondary {
    margin-top: 10px;
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    box-shadow: none;
  }
  .tm-pay-btn.tm-secondary:hover { background: rgba(56, 189, 248, 0.12); }
  .tm-waiting {
    display: none;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
    margin-top: 12px;
  }
  .tm-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid #fff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: tm-spin 0.6s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  @keyframes tm-spin { to { transform: rotate(360deg); } }
  .tm-note { color: var(--muted); font-size: 12px; text-align: center; margin-top: 15px; }
  .tm-popup {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  }
  .tm-popup.active { display: flex; }
  .tm-popup-content {
    background: var(--card);
    padding: 30px;
    border-radius: 24px;
    text-align: center;
    border: 1px solid #ff453a;
    max-width: 320px;
  }
  .tm-popup-content button {
    background: var(--border);
    color: var(--text);
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 15px;
  }
  @media (max-width: 480px) {
    .tm-content { padding: 24px; border-radius: 20px; }
  }
`;

document.addEventListener("DOMContentLoaded", () => {
  const buyButtons = document.querySelectorAll(".trial-buy-btn");
  if (!buyButtons.length) return;

  const style = document.createElement("style");
  style.textContent = TRIAL_MODAL_CSS;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div id="tm-modal" class="tm-overlay">
      <div class="tm-content">
        <span class="tm-close" id="tm-close">&times;</span>
        <h2 id="tm-title">${TRIAL_I18N.modalTitle}</h2>
        <div class="tm-form-group">
          <label>${TRIAL_I18N.promoLabel}</label>
          <div class="tm-promo-wrapper">
            <input type="text" id="tm-promo" placeholder="${TRIAL_I18N.promoPlaceholder}" />
            <button id="tm-apply-promo" class="tm-apply-btn">${TRIAL_I18N.promoApply}</button>
          </div>
          <div class="tm-info" id="tm-promo-info"></div>
        </div>
        <div class="tm-form-group">
          <label>${TRIAL_I18N.refLabel}</label>
          <div class="tm-promo-wrapper">
            <input type="text" id="tm-ref" placeholder="${TRIAL_I18N.refPlaceholder}" />
            <button id="tm-apply-ref" class="tm-apply-btn">${TRIAL_I18N.refApply}</button>
          </div>
          <div class="tm-info" id="tm-ref-info"></div>
        </div>
        <div class="tm-total" id="tm-total"></div>
        <button class="tm-pay-btn" id="tm-pay-planta">${TRIAL_I18N.payPlanta}</button>
        <button class="tm-pay-btn tm-secondary" id="tm-pay-platega">${TRIAL_I18N.payPlatega}</button>
        <div class="tm-waiting" id="tm-waiting">
          <span class="tm-spinner"></span> ${TRIAL_I18N.waitingPlanta}
        </div>
        <p class="tm-note">${TRIAL_I18N.keyNote}</p>
        <p class="tm-note" style="color:#666;font-size:11px">${TRIAL_I18N.gatewaysNote}</p>
        <p class="tm-note">${TRIAL_I18N.secureNote}</p>
        <p class="tm-note">${TRIAL_I18N.keepOpenNote}</p>
        <p class="tm-note" style="font-size:13px">${TRIAL_I18N.txidNote}</p>
      </div>
    </div>
    <div id="tm-popup" class="tm-popup">
      <div class="tm-popup-content">
        <div style="font-size:40px;margin-bottom:10px">⚠️</div>
        <h2 style="margin:0 0 10px 0">${TRIAL_I18N.errorTitle}</h2>
        <p id="tm-popup-msg" style="color:#aaa"></p>
        <button id="tm-popup-ok">${TRIAL_I18N.errorOk}</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const modal = document.getElementById("tm-modal");
  const popup = document.getElementById("tm-popup");
  const popupMsg = document.getElementById("tm-popup-msg");
  const promoInput = document.getElementById("tm-promo");
  const promoInfo = document.getElementById("tm-promo-info");
  const refInput = document.getElementById("tm-ref");
  const refInfo = document.getElementById("tm-ref-info");
  const totalEl = document.getElementById("tm-total");
  const plantaBtn = document.getElementById("tm-pay-planta");
  const plategaBtn = document.getElementById("tm-pay-platega");
  const waitingEl = document.getElementById("tm-waiting");

  let currentOrder = null;

  function showError(message) {
    popupMsg.innerText = message;
    popup.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
    currentOrder = null;
  }

  async function apiFetch(path, options = {}) {
    return fetch(`${PAYMENT_API_BASE}${path}`, {
      ...options,
      mode: "cors",
      credentials: "omit",
    });
  }

  function updateTotal() {
    if (!currentOrder) return;
    const { price, originalPrice } = currentOrder;
    totalEl.innerHTML =
      price < originalPrice
        ? `<div><span class="tm-old-price">${originalPrice}₽</span><span class="tm-total-price">${price}₽</span><div class="tm-gb-label" style="color:#22c55e">${TRIAL_I18N.gbLabel.replaceAll("{gb}", currentOrder.trafficGib)}</div></div>`
        : `<div><div class="tm-total-price">${price}₽</div><div class="tm-gb-label">${TRIAL_I18N.gbLabel.replaceAll("{gb}", currentOrder.trafficGib)}</div></div>`;
  }

  async function applyPromo(promoCode) {
    if (!currentOrder) return false;
    const promoValue = promoCode?.trim().toUpperCase() || "";
    promoInfo.className = "tm-info";
    if (!promoValue) {
      currentOrder.promo = null;
      currentOrder.price = currentOrder.originalPrice;
      updateTotal();
      promoInput.style.borderColor = "";
      promoInfo.style.display = "none";
      return true;
    }
    try {
      const res = await apiFetch(`/promocode/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: 0,
          kind: "lite",
          traffic_gib: currentOrder.trafficGib,
          alt_price: currentOrder.altPrice,
          promocode: promoValue,
        }),
      });
      if (!res.ok) throw new Error(TRIAL_I18N.promoInvalid);
      const data = await res.json();
      if (data.is_valid && data.discounted_price < data.original_price) {
        currentOrder.promo = promoValue;
        currentOrder.price = data.discounted_price;
        updateTotal();
        promoInput.style.borderColor = "#22c55e";
        promoInfo.style.display = "block";
        promoInfo.classList.add("valid");
        promoInfo.innerText = TRIAL_I18N.promoApplied;
        return true;
      }
      throw new Error(TRIAL_I18N.promoInvalid);
    } catch (err) {
      showError(err.message);
      promoInput.style.borderColor = "#ff4444";
      return false;
    }
  }

  async function applyRef(refCode) {
    if (!currentOrder) return false;
    const refValue = refCode?.trim() || "";
    refInfo.className = "tm-info";
    if (!refValue) {
      currentOrder.referral = null;
      refInput.style.borderColor = "";
      refInfo.style.display = "none";
      return true;
    }
    try {
      const res = await apiFetch(
        `/check/ref_code?code=${encodeURIComponent(refValue)}`,
      );
      if (!res.ok) throw new Error(TRIAL_I18N.refInvalid);
      const data = await res.json();
      if (data.valid) {
        currentOrder.referral = refValue;
        refInput.style.borderColor = "#22c55e";
        refInfo.style.display = "block";
        refInfo.classList.add("valid");
        refInfo.innerText = TRIAL_I18N.refApplied;
        return true;
      }
      throw new Error(TRIAL_I18N.refInvalid);
    } catch (err) {
      currentOrder.referral = null;
      refInput.style.borderColor = "#ff4444";
      refInfo.style.display = "block";
      refInfo.classList.add("invalid");
      refInfo.innerText = TRIAL_I18N.refInvalid;
      return false;
    }
  }

  function openModal(price, altPrice, trafficGib = 1) {
    currentOrder = {
      duration: 0,
      kind: "lite",
      trafficGib: trafficGib,
      price: price,
      originalPrice: price,
      altPrice: altPrice,
      promo: null,
      referral: null,
    };
    document.getElementById("tm-title").innerHTML =
      TRIAL_I18N.modalTitle.replaceAll("{gb}", trafficGib);
    promoInput.value = getUrlPromoCode() || "";
    promoInput.style.borderColor = "";
    promoInfo.style.display = "none";
    promoInfo.className = "tm-info";
    refInput.value = getUrlRefCode() || "";
    refInput.style.borderColor = "";
    refInfo.style.display = "none";
    refInfo.className = "tm-info";
    waitingEl.style.display = "none";
    plantaBtn.disabled = false;
    plategaBtn.disabled = false;
    updateTotal();
    modal.classList.add("active");
    if (promoInput.value) applyPromo(promoInput.value);
    if (refInput.value) applyRef(refInput.value);
  }

  function orderPayload() {
    return {
      duration: 0,
      kind: "lite",
      traffic_gib: currentOrder.trafficGib,
      alt_price: currentOrder.altPrice,
      promocode: currentOrder.promo || null,
      refCode: currentOrder.referral || null,
    };
  }

  async function pollPlantaPaymentUrl(txid) {
    const MAX_ATTEMPTS = 40; // ~2 минуты с интервалом 3 секунды
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const res = await apiFetch(`/payment/check/${txid}`);
      const data = await res.json().catch(() => ({}));
      if (data.paymentUrl) return data.paymentUrl;
      if (data.status === "failed" || data.status === "cancelled") {
        throw new Error(TRIAL_I18N.paymentCancelled);
      }
    }
    throw new Error(TRIAL_I18N.plantaTimeout + txid);
  }

  plategaBtn.onclick = async () => {
    if (!currentOrder) return;
    plategaBtn.disabled = true;
    const originalText = plategaBtn.innerText;
    plategaBtn.innerHTML = `<span class="tm-spinner"></span> ${TRIAL_I18N.creating}`;
    try {
      const res = await apiFetch(`/payment/platega/key/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": generateTraceId(),
        },
        body: JSON.stringify(orderPayload()),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || TRIAL_I18N.createFail);
      }
      const data = await res.json();
      if (data.transactionId) {
        localStorage.setItem("frkn_last_transaction_id", data.transactionId);
      }
      if (data.status === "PENDING" && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(TRIAL_I18N.noUrl);
      }
    } catch (e) {
      showError(e.message);
      plategaBtn.disabled = false;
      plategaBtn.innerText = originalText;
    }
  };

  plantaBtn.onclick = async () => {
    if (!currentOrder) return;
    plantaBtn.disabled = true;
    plategaBtn.disabled = true;
    waitingEl.style.display = "block";
    try {
      const res = await apiFetch(`/payment/planta/key/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trace-Id": generateTraceId(),
        },
        body: JSON.stringify(orderPayload()),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || TRIAL_I18N.createFail);
      }
      const data = await res.json();
      if (!data.transactionId) throw new Error(TRIAL_I18N.noTxid);
      localStorage.setItem("frkn_last_transaction_id", data.transactionId);
      // Прод Планты отдает ссылку сразу в create-ответе.
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      // Иначе qrLink приходит постбэком — поллим /payment/check.
      const paymentUrl = await pollPlantaPaymentUrl(data.transactionId);
      window.location.href = paymentUrl;
    } catch (e) {
      showError(e.message);
      plantaBtn.disabled = false;
      plategaBtn.disabled = false;
      waitingEl.style.display = "none";
    }
  };

  buyButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const price = parseInt(btn.dataset.price, 10);
      const alt = btn.dataset.alt === "true";
      const gb = parseInt(btn.dataset.gb || "1", 10);
      openModal(price, alt, gb);
    }),
  );

  document.getElementById("tm-close").onclick = closeModal;
  document.getElementById("tm-apply-promo").onclick = () =>
    applyPromo(promoInput.value);
  document.getElementById("tm-apply-ref").onclick = () =>
    applyRef(refInput.value);
  promoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyPromo(promoInput.value);
    }
  });
  refInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyRef(refInput.value);
    }
  });
  document.getElementById("tm-popup-ok").onclick = () =>
    popup.classList.remove("active");
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
});
