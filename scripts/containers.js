document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const langMatch = path.match(/^\/(en|fa)\//);
  const suffix = langMatch ? `.${langMatch[1]}` : "";
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
