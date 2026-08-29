(function () {
  const storageKey = "karaChinWorkFeedScroll";
  const feed = document.querySelector(".image-feed");
  const params = new URLSearchParams(window.location.search);
  const shouldResetFeed = params.get("feed") === "top";
  let isRestoring = !shouldResetFeed;
  let restoreCancelled = false;
  let restoreTimer = null;

  if (!feed) {
    return;
  }

  if (shouldResetFeed) {
    localStorage.removeItem(storageKey);
    feed.scrollTop = 0;
    window.history.replaceState(null, "", window.location.pathname);
  }

  function saveFeedPosition() {
    if (isRestoring) {
      return;
    }

    localStorage.setItem(storageKey, String(feed.scrollTop));
  }

  function restoreFeedPosition() {
    if (restoreCancelled) {
      return;
    }

    if (shouldResetFeed) {
      feed.scrollTop = 0;
      isRestoring = false;
      return;
    }

    const savedPosition = Number(localStorage.getItem(storageKey));

    if (Number.isFinite(savedPosition)) {
      feed.scrollTop = savedPosition;
    }
  }

  restoreFeedPosition();
  requestAnimationFrame(restoreFeedPosition);

  [50, 150, 300, 600, 1000, 1800, 3000].forEach((delay) => {
    window.setTimeout(restoreFeedPosition, delay);
  });

  feed.querySelectorAll("img").forEach((image) => {
    if (!image.complete) {
      image.addEventListener("load", restoreFeedPosition, { once: true });
    }
  });

  window.addEventListener("load", restoreFeedPosition, { once: true });
  restoreTimer = window.setTimeout(() => {
    restoreFeedPosition();
    isRestoring = false;
  }, 3200);

  feed.addEventListener("scroll", saveFeedPosition, { passive: true });
  feed.addEventListener("click", saveFeedPosition, true);

  function cancelRestore() {
    restoreCancelled = true;
    isRestoring = false;
  }

  feed.addEventListener("wheel", cancelRestore, { passive: true });
  feed.addEventListener("touchstart", cancelRestore, { passive: true });
  feed.addEventListener("pointerdown", cancelRestore, { passive: true });
  window.addEventListener("pagehide", () => {
    clearTimeout(restoreTimer);
    isRestoring = false;
    saveFeedPosition();
  });

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
