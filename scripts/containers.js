document.addEventListener("DOMContentLoaded", () => {
  load("/container/footer.html", "footer-container");
  load("/container/logo.html", "logo-container");
  load("/container/services.html", "services-container");
});

function load(url, id) {
  const el = document.getElementById(id);
  if (!el) return;

  fetch(url)
    .then(res => res.text())
    .then(html => {
      el.innerHTML = html;
    })
    .catch(err => {
      console.error(`Failed to load ${url}:`, err);
    });
}
