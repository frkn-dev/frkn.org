(() => {
  const root = document.querySelector("#trust");
  if (!root) return;
  const details = root.querySelector("details");
  const grid = root.querySelector(".trust-grid");
  const pager = root.querySelector(".trust-pager");
  const pageEl = root.querySelector(".trust-page");
  const prev = root.querySelector(".trust-prev");
  const next = root.querySelector(".trust-next");
  const size = Number(grid.dataset.pageSize || 6);
  let photos = [];
  let page = 0;

  function render() {
    const pages = Math.max(1, Math.ceil(photos.length / size));
    page = Math.max(0, Math.min(page, pages - 1));
    const slice = photos.slice(page * size, page * size + size);
    grid.replaceChildren(
      ...slice.map((name) => {
        const a = document.createElement("a");
        a.className = "trust-item";
        a.href = "/Images/pets/" + name;
        const img = document.createElement("img");
        img.src = a.href + "?v=4";
        img.alt = "";
        a.append(img);
        return a;
      }),
    );
    pageEl.textContent = page + 1 + " / " + pages;
    prev.disabled = page === 0;
    next.disabled = page >= pages - 1;
    pager.hidden = pages <= 1;
  }

  prev.addEventListener("click", () => {
    page -= 1;
    render();
  });
  next.addEventListener("click", () => {
    page += 1;
    render();
  });

  if (location.hash === "#trust" && details) details.open = true;

  if (details) {
    details.addEventListener("toggle", () => {
      if (details.open) {
        details.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  fetch("/Images/pets/manifest.json?v=4")
    .then((r) => r.json())
    .then((list) => {
      photos = list;
      render();
    });
})();
