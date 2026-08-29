(() => {
  const toggle = document.querySelector("[data-work-menu-toggle]");
  const menu = document.querySelector("[data-work-menu]");

  if (!toggle || !menu) return;

  const imageFolder = window.WORK_IMAGE_FOLDER || "work-list/";
  const works = window.WORK_LIST || [];

  works.forEach((work) => {
    const item = document.createElement("article");
    const link = document.createElement("a");
    const image = document.createElement("img");
    const title = document.createElement("span");

    item.className = "feed-item";
    link.href = work.href || "#";
    image.src = work.file.includes("/") ? work.file : `${imageFolder}${work.file}`;
    image.alt = work.alt || work.title || "";
    image.loading = "lazy";
    image.decoding = "async";
    title.textContent = work.title || "";
    link.append(image, title);
    item.append(link);
    menu.append(item);
  });

  function setOpen(open) {
    document.body.classList.toggle("is-work-menu-open", open);
    toggle.classList.toggle("is-current", open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    menu.inert = !open;
  }

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    setOpen(!document.body.classList.contains("is-work-menu-open"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("is-work-menu-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
