#!/usr/bin/env python3
"""Generate en/pay/index.html from pay/index.html (RU), keeping the pages structurally identical.

Run from frkn.org root: python3 tools/gen-en-pay.py
"""
import re
import sys

SRC = "pay/index.html"
DST = "en/pay/index.html"

src = open(SRC, encoding="utf-8").read()

# --- exact, single-line / multi-line replacements (longest first) -------------
PAIRS = [
    # head
    ('<html lang="ru">', '<html lang="en">'),
    ('content="Купить подписку FRKN Рилзопровод"', 'content="Buy FRKN Reelsoprovod subscription"'),
    ('content="Купить подписку на FRKN Рилзопровод"', 'content="Buy a subscription to FRKN Reelsoprovod"'),
    ('<link rel="canonical" href="https://frkn.org/pay/" />', '<link rel="canonical" href="https://frkn.org/en/pay/" />'),
    ('<meta property="og:url" content="https://frkn.org/pay/" />', '<meta property="og:url" content="https://frkn.org/en/pay/" />'),
    ('<title>FRKN Privacy — Тарифы</title>', '<title>FRKN Privacy — Pricing</title>'),
    # css-generated labels
    ('content: "⭐ Выгодно";', 'content: "⭐ Best value";'),
    ('content: "🔥 Популярно";', 'content: "🔥 Popular";'),
    ('content: "Самый популярный";', 'content: "Most popular";'),
    # hero / tabs
    ('<h1 class="hero-title">Выберите тариф</h1>', '<h1 class="hero-title">Choose a plan</h1>'),
    ('Купите ключ активации для получения или продления подписки.<br />\n        Уже есть <a href="/info/activation-keys" class="text-link">ключ</a>?\n        <a href="/activate" class="text-link">Активируй его здесь</a>',
     'Buy an activation key to get or renew your subscription.<br />\n        Already have a\n        <a href="/en/info/activation-keys" class="text-link">key</a>?\n        <a href="/en/activate" class="text-link">Activate it here</a>'),
    ('Безлимитные Тарифы', 'Unlimited plans'),
    ('Купить трафик', 'Buy traffic'),
    # traffic cards
    ('<h3>1 ГБ</h3>', '<h3>1 GB</h3>'),
    ('<h3>5 ГБ</h3>', '<h3>5 GB</h3>'),
    ('<h3>10 ГБ</h3>', '<h3>10 GB</h3>'),
    ('<h3>50 ГБ</h3>', '<h3>50 GB</h3>'),
    ('живёт, пока не кончится', 'lasts until it runs out'),
    ('Зумерам 67₽', 'Zoomers $0.87'),
    ('Зумерам 167₽', 'Zoomers $2.17'),
    ('Зумерам 267₽', 'Zoomers $3.47'),
    ('Зумерам 367₽', 'Zoomers $4.77'),
    ('Миллениалам 69₽', 'Millennials $0.90'),
    ('Миллениалам 169₽', 'Millennials $2.20'),
    ('Миллениалам 269₽', 'Millennials $3.50'),
    ('Миллениалам 369₽', 'Millennials $4.80'),
    # unlimited plans
    ('<span class="unlimited-badge">∞ БЕЗЛИМИТ</span>', '<span class="unlimited-badge">∞ UNLIMITED</span>'),
    ('<div class="card-subtitle">Попробовать Рилзопровод</div>', '<div class="card-subtitle">Try Reelsoprovod</div>'),
    ('<div class="card-subtitle">Для постоянного использования</div>', '<div class="card-subtitle">For long-term use</div>'),
    ('<h3>1 месяц</h3>', '<h3>1 month</h3>'),
    ('<h3>3 месяца</h3>', '<h3>3 months</h3>'),
    ('<h3>6 месяцев</h3>', '<h3>6 months</h3>'),
    ('<h3>12 месяцев</h3>', '<h3>12 months</h3>'),
    ('<h3>3 дня</h3>', '<h3>3 days</h3>'),
    ('<h3>7 дней</h3>', '<h3>7 days</h3>'),
    ('<h3>14 дней</h3>', '<h3>14 days</h3>'),
    ('31 день доступа', '31 days of access'),
    ('90 дней доступа', '90 days of access'),
    ('180 дней доступа', '180 days of access'),
    ('365 дней доступа', '365 days of access'),
    ('3 дня доступа', '3 days of access'),
    ('7 дней доступа', '7 days of access'),
    ('14 дней доступа', '14 days of access'),
    ('<div class="savings-text regular">Обычная цена</div>', '<div class="savings-text regular">Regular price</div>'),
    ('Экономия 200 ₽', 'Save $2.60'),
    ('Экономия 1500 ₽', 'Save $19.50'),
    ('Выбрать тариф', 'Choose plan'),
    ('Выбрать', 'Choose'),
    ('<li>Безлимитный трафик</li>', '<li>Unlimited traffic</li>'),
    ('<li>Высокая скорость</li>', '<li>High speed</li>'),
    ('<li>Любое количество устройств</li>', '<li>Any number of devices</li>'),
    ('Дополнительные варианты', 'More options'),
    # benefits
    ('<h4>Без карты и автосписаний</h4>', '<h4>No card or auto-payments</h4>'),
    ('Платишь один раз — получаешь доступ. Никакой привязки банковской\n              карты, никаких подписок и скрытых списаний.',
     'Pay once — get access. No bank card binding, no subscriptions or hidden charges.'),
    ('<h4>Дни складываются</h4>', '<h4>Days stack up</h4>'),
    ('Продление добавляет дни к текущей подписке, а не обнуляет её. Уже\n              имеющийся срок доступа не сгорает — только прибавляется.',
     "Renewal adds days to your current subscription, not resets it. Existing access time doesn't expire — it only increases."),
    # modal
    ('<h2 id="modal-title">Оформление подписки</h2>', '<h2 id="modal-title">Checkout</h2>'),
    ('<label>Промокод</label>', '<label>Promo code</label>'),
    ('placeholder="Введите промокод"', 'placeholder="Enter promo code"'),
    ('<label>Реферальный код друга</label>', "<label>Friend's referral code</label>"),
    ('placeholder="Введите код друга"', "placeholder=\"Enter friend's code\""),
    ('Применить', 'Apply'),
    ('<label>Email (необязательно)</label>', '<label>Email (optional)</label>'),
    ('placeholder="Для письма с ключом и напоминаний"', 'placeholder="For the key email and reminders"'),
    ('Можно указать позже в Личном Кабинете.', 'You can add it later in your account.'),
    ('<span>Важно: не закрывайте окно до подтверждения оплаты</span>',
     '<span>Important: do not close this window until payment is confirmed</span>'),
    ('<button class="btn-pay" id="planta-pay-btn">Оплата СБП</button>',
     '<button class="btn-pay" id="planta-pay-btn">Pay with SBP</button>'),
    ('<button class="btn-pay" id="final-pay-btn">Оплатить</button>',
     '<button class="btn-pay" id="final-pay-btn">Pay</button>'),
    ('<!-- Planta (СБП) скрыта: основной терминал — Platega. -->',
     '<!-- Planta (SBP) is hidden: Platega is the main terminal. -->'),
    ('Ждем ссылку на оплату от СБП...', 'Waiting for the SBP payment link...'),
    ('Оплата проходит на внешнем сервисе. Мы не храним ваши платёжные\n            данные.',
     'Payment goes through an external service. We do not store your payment data.'),
    ('          <!--\n          <p class="prefer">\n            Предпочитаем СБП — там меньше комиссия, цена для вас та же.\n          </p>\n          -->\n', ''),
    ('<h2 style="margin: 0 0 10px 0">Ошибка</h2>', '<h2 style="margin: 0 0 10px 0">Error</h2>'),
    ('Понятно', 'Got it'),
    # js strings
    ('// --- Конфигурация ---', '// --- Configuration ---'),
    ('// --- DOM элементы ---', '// --- DOM elements ---'),
    ('// --- Вспомогательные функции ---', '// --- Helper functions ---'),
    ('return amount > 0 ? `Экономия ${Math.round(amount)} ₽` : "Обычная цена";',
     'return amount > 0 ? `Save $${amount.toFixed(2)}` : "Regular price";'),
    ('savingsEl.dataset.originalText.includes("Обычная")', 'savingsEl.dataset.originalText.includes("Regular")'),
    ('if (days === 0) return "пакеты трафика";', 'if (days === 0) return "traffic packages";'),
    ('3: "3 дня",', '3: "3 days",'),
    ('7: "7 дней",', '7: "7 days",'),
    ('14: "14 дней",', '14: "14 days",'),
    ('30: "1 месяц",', '30: "1 month",'),
    ('90: "3 месяца",', '90: "3 months",'),
    ('180: "6 месяцев",', '180: "6 months",'),
    ('365: "1 год",', '365: "1 year",'),
    ('return map[days] || `${days} дней`;', 'return map[days] || `${days} days`;'),
    ('// --- Обновление цены за день на КАРТОЧКЕ ---', '// --- Update the per-day price on the card ---'),
    ('// --- Сброс цен на карточках к исходным (без скидки) ---', '// --- Reset card prices to the originals (no discount) ---'),
    ('// --- Применение скидки на карточки (для отображения на странице) ---', '// --- Apply the discount to the cards (page display) ---'),
    ('// --- Обновление отображения в модалке (для ТЕКУЩЕГО заказа) ---', '// --- Update the modal display (for the CURRENT order) ---'),
    ('// Что входит в выбранный тарифный продукт (состав известен scripts/plans.js).',
     '// What the chosen plan includes (the composition is known to scripts/plans.js).'),
    ('// --- Применение промокода к ТЕКУЩЕМУ заказу в модалке ---', '// --- Apply the promo code to the CURRENT order in the modal ---'),
    ('// Сброс скидки', '// Reset the discount'),
    ('// --- Применение реферального кода к ТЕКУЩЕМУ заказу в модалке ---', '// --- Apply the referral code to the CURRENT order in the modal ---'),
    ('// Тестовый режим: пока API не готово, TESTTEST считаем валидным', '// Test mode: while the API is not ready, treat TESTTEST as valid'),
    ('// Подставляем промокод из URL', '// Pre-fill the promo code from the URL'),
    ('// Применяем только если скидка действительно есть на этой карточке', '// Apply only if this card really gets a discount'),
    ('// Если промокода в URL нет — показываем поле и кнопку', '// No promo code in the URL — show the field and the button'),
    ('// 1. Базовые цены за день', '// 1. Base per-day prices'),
    ('// 2. Если в URL есть промокод - применяем скидку на все карточки на странице',
     '// 2. A promo code in the URL — apply the discount to every card on the page'),
    ('// --- Инициализация страницы ---', '// --- Page init ---'),
    ('// Каталог тарифов (scripts/plans.js) может перерисовать карточки —\n      // ждём его, чтобы ₽/день и промо считались по актуальным ценам.',
     '// The plan catalogue (scripts/plans.js) may re-render the cards —\n      // wait for it so per-day prices and promos use the current prices.'),
    ('// --- Обработчики событий ---', '// --- Event handlers ---'),
    ('// Делегирование: карточки тарифов может перерисовать scripts/plans.js.',
     '// Delegation: scripts/plans.js may re-render the plan cards.'),
    ('// Смена тарифного продукта перерисовывает карточки — возвращаем скидку из URL.',
     '// Switching the plan product re-renders the cards — re-apply the URL discount.'),
    ('// --- Открытие модального окна ---', '// --- Open the modal ---'),
    ('// override: {price, alt} — выбранная кликом цена ("зумер"/"миллениал")',
     '// override: {price, alt} — the price picked by the click ("zoomer"/"millennial")'),
    ('// Тарифный продукт. Пакеты трафика (lite) всегда «стандартный» продукт;\n      // у карточек тарифов продукт лежит в DOM (иначе — выбранный чип).',
     '// Plan product. Traffic packs (lite) are always the "standard" product;\n      // plan cards carry the product in the DOM (otherwise — the selected chip).'),
    ('const gbLabel = `${currentOrder.trafficGib} ГБ трафика`;', 'const gbLabel = `${currentOrder.trafficGib} GB of traffic`;'),
    ('≈ ${pricePerDay}₽/день (было ${originalPricePerDay}₽/день', '≈ $${pricePerDay}/day (was $${originalPricePerDay}/day'),
    ('`≈ ${pricePerDay}₽/день`', '`≈ $${pricePerDay}/day`'),
    ('≈ ${pricePerDay}₽/день', '≈ $${pricePerDay}/day'),
    ('`Покупка трафика<br>${trafficGib} ГБ`', '`Buy traffic<br>${trafficGib} GB`'),
    ('`Оформление подписки<br>на ${duration} дней${', '`Checkout<br>${duration} days${'),
    ('"Скрыть дополнительные варианты"', '"Hide more options"'),
    ('"Дополнительные варианты"', '"More options"'),
    ('showError("Выберите тариф сначала");', 'showError("Choose a plan first");'),
    ('throw new Error("Промокод недействителен");', 'throw new Error("Promo code is invalid");'),
    ('throw new Error("Пупупу кажется промокод недействителен");', 'throw new Error("Looks like this promo code is not valid");'),
    ('"Реферальный код применён. Твоему другу будет добавлено 30 дней после оплаты."',
     '"Referral code applied. Your friend gets 30 extra days after your payment."'),
    ('throw new Error("Не удалось проверить реферальный код");', 'throw new Error("Could not validate the referral code");'),
    ('throw new Error("Реферальный код не найден");', 'throw new Error("Referral code not found");'),
    ('refInfo.innerText = "Реферальный код не найден";', 'refInfo.innerText = "Referral code not found";'),
    ('promoInfo.innerText = "Промокод применён";', 'promoInfo.innerText = "Promo code applied";'),
    ('`Промокод не применяется к этому тарифу. Действует на: ${labels}`',
     '`This promo code does not apply to this plan. Valid for: ${labels}`'),
    ('"Промокод не действителен для текущих тарифов"', '"The promo code is not valid for the current plans"'),
    ('showError("Заказ не найден. Попробуйте выбрать тариф заново.");', 'showError("Order not found. Please pick a plan again.");'),
    ("'<span class=\"loading-spinner\"></span> Создаем счет...'", "'<span class=\"loading-spinner\"></span> Creating the invoice...'"),
    ('{ error: "Ошибка сервера" }', '{ error: "Server error" }'),
    ('"Не удалось создать платеж"', '"Could not create the payment"'),
    ('throw new Error("API не вернул ссылку на оплату");', 'throw new Error("The API did not return a payment link");'),
    ('throw new Error("API не вернул ID транзакции");', 'throw new Error("The API did not return a transaction ID");'),
    ('throw new Error("Платеж отменен, попробуйте еще раз");', 'throw new Error("The payment was cancelled, please try again");'),
    ('"СБП не ответил вовремя. Попробуй Мир/Крипта или проверь ID: "',
     '"SBP did not respond in time. Try card/crypto or check the ID: "'),
]

# longest first so shorter strings never eat a longer one
PAIRS.sort(key=lambda p: -len(p[0]))


def flex(pattern: str) -> re.Pattern:
    """Whitespace-flexible regex for one literal snippet."""
    parts = [re.escape(w) for w in pattern.split()]
    return re.compile(r"\s+".join(parts))


for ru, en in PAIRS:
    rx = flex(ru)
    src, n = rx.subn(lambda m: en, src)
    if n == 0:
        sys.exit(f"NOT FOUND: {ru!r}")

# --- hardcoded rouble amounts -> dollars (rate 0.013, same as the currency shim)
RUB_TO_USD = {
    "67": "0.87", "69": "0.90", "167": "2.17", "169": "2.20",
    "267": "3.47", "269": "3.50", "367": "4.77", "369": "4.80",
    "500": "6.50", "1300": "16.90", "4500": "58.50",
    "100": "1.30", "200": "2.60", "300": "3.90", "2700": "35.10",
}
for rub, usd in RUB_TO_USD.items():
    src = re.sub(rf'data-price="{rub}"', f'data-price="{usd}"', src)
    src = re.sub(rf'<div class="cost">{rub}₽</div>', f'<div class="cost">${usd}</div>', src)

# --- template literals: `${x}₽` -> `$${x}`, `₽/день` -> `/day`
src = src.replace("₽/день", "/day")
src = re.sub(r"\$\{([^{}]*)\}₽", r"$${\1}", src)

# --- body class + currency shim before plans.js
src = src.replace('<body class="home-v2 pay-v2">', '<body class="home-v2 pay-v2 pay-v2-en">')
src = src.replace(
    '<script src="/scripts/plans.js?v=9"></script>',
    '<script>\n'
    '      // Catalogue prices are in roubles; this market displays dollars.\n'
    '      window.FRKN_PLAN_CURRENCY = { rate: 0.013, symbol: "$", prefix: true };\n'
    '    </script>\n'
    '    <script src="/scripts/plans.js?v=9"></script>',
)

open(DST, "w", encoding="utf-8").write(src)

left = [(i + 1, l.strip()) for i, l in enumerate(src.split("\n")) if re.search("[А-Яа-яЁё₽]", l)]
print(f"written {DST}: {len(left)} lines still contain cyrillic/roubles")
for n, l in left:
    print(n, "|", l[:160])
