(() => {
  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const figure = document.querySelector(".single-gallery-figure");
  const count = document.getElementById("gallery-count");
  const fullscreen = document.querySelector(".fullscreen-gallery");

  if (!figure || !count || !fullscreen || typeof showGalleryImage !== "function" || !Array.isArray(images)) {
    return;
  }

  const dots = document.createElement("div");
  dots.className = "gallery-dots";
  dots.setAttribute("aria-label", "Choose gallery image");

  images.forEach((item, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "gallery-dot";
    dot.setAttribute("aria-label", `Show image ${index + 1}`);
    dot.addEventListener("click", () => {
      beginMediaLoad(figure, visibleMedia());
      showGalleryImage(index);
    });
    dots.append(dot);
  });

  figure.after(dots);

  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let isDragging = false;
  let isHorizontal = false;
  let isAnimating = false;
  let suppressClick = false;
  let tapTimer;
  let fullscreenStartX = 0;
  let fullscreenStartY = 0;
  let fullscreenDeltaX = 0;
  let isFullscreenDragging = false;
  let isFullscreenHorizontal = false;
  let isFullscreenAnimating = false;
  let suppressFullscreenClick = false;
  let fullscreenTapTimer;
  let fullscreenPinchActive = false;
  let fullscreenPinchMedia = null;
  let fullscreenPinchStartDistance = 0;
  let fullscreenPinchStartX = 0;
  let fullscreenPinchStartY = 0;
  let fullscreenPinchBaseScale = 1;
  let fullscreenPinchBaseX = 0;
  let fullscreenPinchBaseY = 0;
  let fullscreenPinchScale = 1;
  let fullscreenPinchX = 0;
  let fullscreenPinchY = 0;
  let fullscreenPanActive = false;
  let fullscreenPanStartX = 0;
  let fullscreenPanStartY = 0;
  let fullscreenPanBaseX = 0;
  let fullscreenPanBaseY = 0;

  function visibleMedia() {
    return figure.querySelector("img:not([hidden]), video:not([hidden])");
  }

  function visibleFullscreenMedia() {
    return fullscreen.querySelector("img:not([hidden]), video:not([hidden])");
  }

  function currentIndex() {
    const match = count.textContent.match(/^(\d+)/);
    return match ? Number(match[1]) - 1 : 0;
  }

  function updateDots() {
    const activeIndex = currentIndex();
    const visibleDotCount = Math.min(images.length, 9);
    const firstVisibleDot = Math.max(
      0,
      Math.min(activeIndex - Math.floor(visibleDotCount / 2), images.length - visibleDotCount)
    );
    const lastVisibleDot = firstVisibleDot + visibleDotCount;

    dots.querySelectorAll(".gallery-dot").forEach((dot, index) => {
      dot.hidden = index < firstVisibleDot || index >= lastVisibleDot;
      dot.classList.toggle("is-active", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  }

  function resetMedia(media) {
    if (!media) return;
    media.style.transition = "";
    media.style.transform = "";
    media.style.opacity = "";

    if (media === fullscreenPinchMedia) {
      resetFullscreenPinch();
    }
  }

  function touchDistance(touches) {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  function touchMidpoint(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  function resetFullscreenPinch() {
    fullscreenPinchActive = false;
    fullscreenPinchMedia = null;
    fullscreenPinchStartDistance = 0;
    fullscreenPinchBaseScale = 1;
    fullscreenPinchBaseX = 0;
    fullscreenPinchBaseY = 0;
    fullscreenPinchScale = 1;
    fullscreenPinchX = 0;
    fullscreenPinchY = 0;
    fullscreenPanActive = false;
  }

  function isFullscreenZoomed() {
    return fullscreenPinchScale > 1.01;
  }

  function clampFullscreenPan(media, scale, x, y) {
    if (scale <= 1) return { x: 0, y: 0 };

    const maxX = Math.max(0, (media.offsetWidth * scale - fullscreen.clientWidth) / 2);
    const maxY = Math.max(0, (media.offsetHeight * scale - fullscreen.clientHeight) / 2);

    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY)
    };
  }

  function applyFullscreenPinch(media) {
    if (fullscreenPinchScale <= 1.01) {
      fullscreenPinchScale = 1;
      fullscreenPinchX = 0;
      fullscreenPinchY = 0;
      media.style.transform = "";
      return;
    }

    media.style.transition = "none";
    media.style.transform =
      `translate3d(${fullscreenPinchX}px, ${fullscreenPinchY}px, 0) scale(${fullscreenPinchScale})`;
  }

  function beginMediaLoad(container, media) {
    container.classList.add("is-media-loading");
    media?.classList.add("is-media-loading");
    updatePlaceholderSize(container, media);
  }

  function finishMediaLoad(container, media) {
    container.classList.remove("is-media-loading");
    media?.classList.remove("is-media-loading");
  }

  function updatePlaceholderSize(container, media) {
    if (!media) return;

    const mediaRect = media.getBoundingClientRect();
    const mediaWidth = media.tagName === "VIDEO" ? media.videoWidth : media.naturalWidth;
    const mediaHeight = media.tagName === "VIDEO" ? media.videoHeight : media.naturalHeight;

    if (!mediaWidth || !mediaHeight) {
      if (mediaRect.width && mediaRect.height) {
        container.style.setProperty("--loading-width", `${mediaRect.width}px`);
        container.style.setProperty("--loading-height", `${mediaRect.height}px`);
      }
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = Math.min(containerWidth / mediaWidth, containerHeight / mediaHeight);

    container.style.setProperty("--loading-width", `${mediaWidth * scale}px`);
    container.style.setProperty("--loading-height", `${mediaHeight * scale}px`);
  }

  function watchMediaLoading(container) {
    const mediaItems = container.querySelectorAll("img, video");

    mediaItems.forEach((media) => {
      const loadedEvent = media.tagName === "VIDEO" ? "loadeddata" : "load";
      media.addEventListener(loadedEvent, () => {
        updatePlaceholderSize(container, media);
        finishMediaLoad(container, media);
      });
      media.addEventListener("error", () => finishMediaLoad(container, media));
    });

    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const media = mutation.target;

        if (mutation.attributeName !== "src" || media.hidden) return;

        beginMediaLoad(container, media);

        if (media.tagName === "IMG" && media.complete && media.naturalWidth) {
          window.requestAnimationFrame(() => finishMediaLoad(container, media));
        }
      });
    }).observe(container, {
      attributes: true,
      attributeFilter: ["src"],
      subtree: true
    });
  }

  function finishSwipe(direction) {
    const outgoing = visibleMedia();
    const distance = figure.clientWidth || window.innerWidth;

    if (!outgoing) return;

    isAnimating = true;
    outgoing.style.transition = "transform 220ms ease-out, opacity 220ms ease-out";
    outgoing.style.transform = `translateX(${direction * -distance}px)`;
    outgoing.style.opacity = "0.65";

    window.setTimeout(() => {
      beginMediaLoad(figure, outgoing);
      showGalleryImage(currentIndex() + direction);
      const incoming = visibleMedia();

      if (!incoming) {
        isAnimating = false;
        return;
      }

      incoming.style.transition = "none";
      incoming.style.transform = `translateX(${direction * distance}px)`;
      incoming.style.opacity = "0.65";
      incoming.getBoundingClientRect();
      incoming.style.transition = "transform 240ms ease-out, opacity 240ms ease-out";
      incoming.style.transform = "translateX(0)";
      incoming.style.opacity = "1";

      window.setTimeout(() => {
        resetMedia(incoming);
        isAnimating = false;
      }, 250);
    }, 220);
  }

  function finishFullscreenSwipe(direction) {
    const outgoing = visibleFullscreenMedia();
    const distance = fullscreen.clientWidth || window.innerWidth;

    if (!outgoing) return;

    isFullscreenAnimating = true;
    outgoing.style.transition = "transform 220ms ease-out, opacity 220ms ease-out";
    outgoing.style.transform = `translateX(${direction * -distance}px)`;
    outgoing.style.opacity = "0.65";

    window.setTimeout(() => {
      beginMediaLoad(fullscreen, outgoing);
      showGalleryImage(currentIndex() + direction);
      const incoming = visibleFullscreenMedia();

      if (!incoming) {
        isFullscreenAnimating = false;
        return;
      }

      incoming.style.transition = "none";
      incoming.style.transform = `translateX(${direction * distance}px)`;
      incoming.style.opacity = "0.65";
      incoming.getBoundingClientRect();
      incoming.style.transition = "transform 240ms ease-out, opacity 240ms ease-out";
      incoming.style.transform = "translateX(0)";
      incoming.style.opacity = "1";

      window.setTimeout(() => {
        resetMedia(incoming);
        isFullscreenAnimating = false;
      }, 250);
    }, 220);
  }

  figure.addEventListener("touchstart", (event) => {
    if (!mobileQuery.matches || isAnimating || event.touches.length !== 1) return;

    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    deltaX = 0;
    isDragging = true;
    isHorizontal = false;
    resetMedia(visibleMedia());
  }, { capture: true, passive: true });

  figure.addEventListener("touchmove", (event) => {
    if (!mobileQuery.matches || !isDragging || event.touches.length !== 1) return;

    deltaX = event.touches[0].clientX - startX;
    const deltaY = event.touches[0].clientY - startY;

    if (!isHorizontal && Math.abs(deltaX) > 8) {
      isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!isHorizontal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const media = visibleMedia();

    if (media) {
      media.style.transition = "none";
      media.style.transform = `translateX(${deltaX}px)`;
    }
  }, { capture: true, passive: false });

  figure.addEventListener("touchend", (event) => {
    if (!mobileQuery.matches || !isDragging) return;

    isDragging = false;

    if (!isHorizontal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 350);

    if (Math.abs(deltaX) >= Math.min(55, figure.clientWidth * 0.16)) {
      finishSwipe(deltaX < 0 ? 1 : -1);
      return;
    }

    const media = visibleMedia();
    if (media) {
      media.style.transition = "transform 180ms ease-out";
      media.style.transform = "translateX(0)";
      window.setTimeout(() => resetMedia(media), 190);
    }
  }, { capture: true, passive: false });

  figure.addEventListener("touchcancel", () => {
    isDragging = false;
    isHorizontal = false;
    resetMedia(visibleMedia());
  }, { capture: true, passive: true });

  figure.addEventListener("pointerdown", (event) => {
    if (
      !mobileQuery.matches ||
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      isAnimating
    ) {
      return;
    }

    startX = event.clientX;
    startY = event.clientY;
    deltaX = 0;
    isDragging = true;
    isHorizontal = false;
    figure.setPointerCapture?.(event.pointerId);
    resetMedia(visibleMedia());
  }, { capture: true });

  figure.addEventListener("pointermove", (event) => {
    if (!mobileQuery.matches || event.pointerType !== "mouse" || !isDragging) return;

    deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!isHorizontal && Math.abs(deltaX) > 8) {
      isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (!isHorizontal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const media = visibleMedia();

    if (media) {
      media.style.transition = "none";
      media.style.transform = `translateX(${deltaX}px)`;
    }
  }, { capture: true });

  figure.addEventListener("pointerup", (event) => {
    if (!mobileQuery.matches || event.pointerType !== "mouse" || !isDragging) return;

    isDragging = false;
    figure.releasePointerCapture?.(event.pointerId);

    if (!isHorizontal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 350);

    if (Math.abs(deltaX) >= Math.min(55, figure.clientWidth * 0.16)) {
      finishSwipe(deltaX < 0 ? 1 : -1);
      return;
    }

    const media = visibleMedia();
    if (media) {
      media.style.transition = "transform 180ms ease-out";
      media.style.transform = "translateX(0)";
      window.setTimeout(() => resetMedia(media), 190);
    }
  }, { capture: true });

  figure.addEventListener("pointercancel", (event) => {
    if (event.pointerType !== "mouse") return;
    isDragging = false;
    isHorizontal = false;
    resetMedia(visibleMedia());
  }, { capture: true });

  figure.addEventListener("click", (event) => {
    if (!mobileQuery.matches) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (suppressClick || isAnimating) return;

    beginMediaLoad(figure, visibleMedia());
    showGalleryImage(currentIndex() + 1);
  }, { capture: true });

  fullscreen.addEventListener("touchstart", (event) => {
    if (mobileQuery.matches && !isFullscreenAnimating && event.touches.length >= 2) {
      const media = visibleFullscreenMedia();

      if (!media || media.tagName !== "IMG" || event.target.closest("button")) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      clearTimeout(fullscreenTapTimer);
      isFullscreenDragging = false;
      isFullscreenHorizontal = false;
      suppressFullscreenClick = true;

      if (fullscreenPinchMedia !== media || !media.style.transform) {
        resetFullscreenPinch();
        fullscreenPinchMedia = media;
      }

      const midpoint = touchMidpoint(event.touches);
      fullscreenPinchActive = true;
      fullscreenPanActive = false;
      fullscreenPinchStartDistance = touchDistance(event.touches);
      fullscreenPinchStartX = midpoint.x;
      fullscreenPinchStartY = midpoint.y;
      fullscreenPinchBaseScale = fullscreenPinchScale;
      fullscreenPinchBaseX = fullscreenPinchX;
      fullscreenPinchBaseY = fullscreenPinchY;
      return;
    }

    if (
      mobileQuery.matches &&
      !isFullscreenAnimating &&
      event.touches.length === 1 &&
      isFullscreenZoomed() &&
      !event.target.closest("button")
    ) {
      const media = visibleFullscreenMedia();

      if (!media || media !== fullscreenPinchMedia) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      clearTimeout(fullscreenTapTimer);
      fullscreenPinchActive = false;
      fullscreenPanActive = true;
      isFullscreenDragging = false;
      isFullscreenHorizontal = false;
      suppressFullscreenClick = true;
      fullscreenPanStartX = event.touches[0].clientX;
      fullscreenPanStartY = event.touches[0].clientY;
      fullscreenPanBaseX = fullscreenPinchX;
      fullscreenPanBaseY = fullscreenPinchY;
      return;
    }

    if (
      !mobileQuery.matches ||
      isFullscreenAnimating ||
      event.touches.length !== 1 ||
      event.target.closest("button")
    ) {
      return;
    }

    fullscreenStartX = event.touches[0].clientX;
    fullscreenStartY = event.touches[0].clientY;
    fullscreenDeltaX = 0;
    isFullscreenDragging = true;
    isFullscreenHorizontal = false;
    resetMedia(visibleFullscreenMedia());
  }, { capture: true, passive: false });

  fullscreen.addEventListener("touchmove", (event) => {
    if (fullscreenPinchActive) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.touches.length < 2 || !fullscreenPinchStartDistance) return;

      const media = fullscreenPinchMedia;

      if (!media) return;

      const midpoint = touchMidpoint(event.touches);
      fullscreenPinchScale = Math.min(
        Math.max(
          fullscreenPinchBaseScale *
            (touchDistance(event.touches) / fullscreenPinchStartDistance),
          1
        ),
        5
      );

      const pan = clampFullscreenPan(
        media,
        fullscreenPinchScale,
        fullscreenPinchBaseX + midpoint.x - fullscreenPinchStartX,
        fullscreenPinchBaseY + midpoint.y - fullscreenPinchStartY
      );
      fullscreenPinchX = pan.x;
      fullscreenPinchY = pan.y;
      applyFullscreenPinch(media);
      return;
    }

    if (fullscreenPanActive) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.touches.length !== 1) return;

      const media = fullscreenPinchMedia;

      if (!media) return;

      const pan = clampFullscreenPan(
        media,
        fullscreenPinchScale,
        fullscreenPanBaseX + event.touches[0].clientX - fullscreenPanStartX,
        fullscreenPanBaseY + event.touches[0].clientY - fullscreenPanStartY
      );
      fullscreenPinchX = pan.x;
      fullscreenPinchY = pan.y;
      applyFullscreenPinch(media);
      return;
    }

    if (!mobileQuery.matches || !isFullscreenDragging || event.touches.length !== 1) return;

    fullscreenDeltaX = event.touches[0].clientX - fullscreenStartX;
    const deltaY = event.touches[0].clientY - fullscreenStartY;

    if (!isFullscreenHorizontal && Math.abs(fullscreenDeltaX) > 8) {
      isFullscreenHorizontal = Math.abs(fullscreenDeltaX) > Math.abs(deltaY);
    }

    if (!isFullscreenHorizontal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const media = visibleFullscreenMedia();

    if (media) {
      media.style.transition = "none";
      media.style.transform = `translateX(${fullscreenDeltaX}px)`;
    }
  }, { capture: true, passive: false });

  fullscreen.addEventListener("touchend", (event) => {
    if (fullscreenPinchActive) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.touches.length >= 2) {
        const midpoint = touchMidpoint(event.touches);
        fullscreenPinchStartDistance = touchDistance(event.touches);
        fullscreenPinchStartX = midpoint.x;
        fullscreenPinchStartY = midpoint.y;
        fullscreenPinchBaseScale = fullscreenPinchScale;
        fullscreenPinchBaseX = fullscreenPinchX;
        fullscreenPinchBaseY = fullscreenPinchY;
        return;
      }

      if (event.touches.length === 1 && isFullscreenZoomed()) {
        fullscreenPinchActive = false;
        fullscreenPanActive = true;
        fullscreenPanStartX = event.touches[0].clientX;
        fullscreenPanStartY = event.touches[0].clientY;
        fullscreenPanBaseX = fullscreenPinchX;
        fullscreenPanBaseY = fullscreenPinchY;
        fullscreenPinchStartDistance = 0;
        return;
      }

      if (event.touches.length === 1) {
        fullscreenPinchStartDistance = 0;
        return;
      }

      fullscreenPinchActive = false;
      fullscreenPanActive = false;
      window.setTimeout(() => {
        suppressFullscreenClick = false;
      }, 350);
      return;
    }

    if (fullscreenPanActive) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.touches.length === 1) {
        fullscreenPanStartX = event.touches[0].clientX;
        fullscreenPanStartY = event.touches[0].clientY;
        fullscreenPanBaseX = fullscreenPinchX;
        fullscreenPanBaseY = fullscreenPinchY;
        return;
      }

      fullscreenPanActive = false;
      window.setTimeout(() => {
        suppressFullscreenClick = false;
      }, 350);
      return;
    }

    if (!mobileQuery.matches || !isFullscreenDragging) return;

    isFullscreenDragging = false;

    if (!isFullscreenHorizontal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    suppressFullscreenClick = true;
    window.setTimeout(() => {
      suppressFullscreenClick = false;
    }, 350);

    if (Math.abs(fullscreenDeltaX) >= Math.min(55, fullscreen.clientWidth * 0.16)) {
      finishFullscreenSwipe(fullscreenDeltaX < 0 ? 1 : -1);
      return;
    }

    const media = visibleFullscreenMedia();
    if (media) {
      media.style.transition = "transform 180ms ease-out";
      media.style.transform = "translateX(0)";
      window.setTimeout(() => resetMedia(media), 190);
    }
  }, { capture: true, passive: false });

  fullscreen.addEventListener("touchcancel", (event) => {
    const wasFullscreenPinching = fullscreenPinchActive;

    if (fullscreenPinchActive) {
      event.stopImmediatePropagation();

      if (event.touches.length) {
        return;
      }

      fullscreenPinchActive = false;
      window.setTimeout(() => {
        suppressFullscreenClick = false;
      }, 350);
    }

    if (fullscreenPanActive) {
      event.stopImmediatePropagation();
      fullscreenPanActive = false;
      window.setTimeout(() => {
        suppressFullscreenClick = false;
      }, 350);
    }

    isFullscreenDragging = false;
    isFullscreenHorizontal = false;

    if (!wasFullscreenPinching) {
      resetMedia(visibleFullscreenMedia());
    }
  }, { capture: true, passive: true });

  fullscreen.addEventListener("click", (event) => {
    if (!mobileQuery.matches || event.target.closest("button")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (suppressFullscreenClick || isFullscreenAnimating) return;

    if (fullscreenTapTimer) {
      window.clearTimeout(fullscreenTapTimer);
      fullscreenTapTimer = null;
      closeFullscreen();
      return;
    }

    fullscreenTapTimer = window.setTimeout(() => {
      fullscreenTapTimer = null;
    }, 280);
  }, true);

  new MutationObserver(updateDots).observe(count, {
    childList: true,
    characterData: true,
    subtree: true
  });

  watchMediaLoading(figure);
  watchMediaLoading(fullscreen);
  updateDots();
})();
