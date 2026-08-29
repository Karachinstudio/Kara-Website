(function () {
  const storageKey = "karaChinWorkFeedScroll";
  const feed = document.querySelector(".image-feed");
  const params = new URLSearchParams(window.location.search);
  const shouldResetFeed = params.get("feed") === "top";

  if (!feed) {
    return;
  }

  if (shouldResetFeed) {
    localStorage.removeItem(storageKey);
    feed.scrollTop = 0;
    window.history.replaceState(null, "", window.location.pathname);
  }

  function saveFeedPosition() {
    localStorage.setItem(storageKey, String(feed.scrollTop));
  }

  function restoreFeedPosition() {
    if (shouldResetFeed) {
      feed.scrollTop = 0;
      return;
    }

    const savedPosition = Number(localStorage.getItem(storageKey));

    if (Number.isFinite(savedPosition)) {
      feed.scrollTop = savedPosition;
    }
  }

  restoreFeedPosition();
  requestAnimationFrame(restoreFeedPosition);

  feed.addEventListener("scroll", saveFeedPosition, { passive: true });
  feed.addEventListener("click", saveFeedPosition, true);

  const workLink = document.querySelector(".site-nav a.is-current");
  const desktopQuery = window.matchMedia("(min-width: 901px)");

  if (document.body.classList.contains("project-page") && workLink) {
    workLink.setAttribute("aria-expanded", "true");
    workLink.setAttribute("aria-controls", "work-menu");
    feed.id = feed.id || "work-menu";

    workLink.addEventListener("click", (event) => {
      if (
        !desktopQuery.matches ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      const isClosed = document.body.classList.toggle("is-work-menu-closed");
      workLink.setAttribute("aria-expanded", String(!isClosed));
    });
  }
})();
