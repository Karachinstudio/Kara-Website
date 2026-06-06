const siteRootUrl = new URL("./", document.currentScript.src);
const clickEffectSources = Array.from(
  { length: 7 },
  (_, index) => new URL(
    `ginger-cat-dance-web/click${String(index + 4).padStart(2, "0")}.webm`,
    siteRootUrl
  ).href
);
const activeClickEffects = [];
const maxActiveClickEffects = 3;

function removeClickEffect(effect) {
  const effectIndex = activeClickEffects.indexOf(effect);

  if (effectIndex !== -1) {
    activeClickEffects.splice(effectIndex, 1);
  }

  effect.pause();
  effect.removeAttribute("src");
  effect.load();
  effect.remove();
}

function playClickEffect(x, y) {
  while (activeClickEffects.length >= maxActiveClickEffects) {
    removeClickEffect(activeClickEffects[0]);
  }

  const effect = document.createElement("video");
  const size = Math.min(280, Math.max(150, window.innerWidth * 0.22));

  effect.src = clickEffectSources[Math.floor(Math.random() * clickEffectSources.length)];
  effect.autoplay = true;
  effect.muted = true;
  effect.playsInline = true;
  effect.disablePictureInPicture = true;
  effect.style.cssText = [
    "position:fixed",
    `left:${x}px`,
    `top:${y}px`,
    `width:${size}px`,
    "height:auto",
    "z-index:10000",
    "pointer-events:none",
    "transform:translate(-50%,-50%)",
    "object-fit:contain",
    "background:white"
  ].join(";");

  effect.addEventListener("ended", () => removeClickEffect(effect), { once: true });
  effect.addEventListener("error", () => removeClickEffect(effect), { once: true });
  document.body.append(effect);
  activeClickEffects.push(effect);

  effect.play().catch(() => {
    removeClickEffect(effect);
  });
}

async function copyText(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

document.addEventListener("click", async (event) => {
  const link = event.target.closest("[data-copy-email]");

  if (!link) {
    return;
  }

  event.preventDefault();

  const email = link.dataset.copyEmail;
  const originalText = link.textContent;

  try {
    await copyText(email);
    link.textContent = "copied";
  } catch {
    link.textContent = email;
  }

  window.setTimeout(() => {
    link.textContent = originalText;
  }, 1200);
});

document.addEventListener("pointerdown", (event) => {
  if (
    document.body.classList.contains("home-page") ||
    event.button !== 0 ||
    event.target.closest(
      "a, button, input, select, textarea, label, summary, iframe, audio, video, [role='button']"
    )
  ) {
    return;
  }

  playClickEffect(event.clientX, event.clientY);
});

document.querySelectorAll(".single-gallery-figure").forEach((figure) => {
  const mediaItems = figure.querySelectorAll("img, video");

  function updateLoadingState(media) {
    if (media.hidden || !media.getAttribute("src")) {
      return;
    }

    const isReady = media.tagName === "IMG"
      ? media.complete && media.naturalWidth > 0
      : media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

    figure.classList.toggle("is-loading", !isReady);
  }

  mediaItems.forEach((media) => {
    media.addEventListener("load", () => {
      figure.classList.remove("is-loading");
    });
    media.addEventListener("loadeddata", () => {
      figure.classList.remove("is-loading");
    });
    media.addEventListener("error", () => {
      figure.classList.remove("is-loading");
    });

    new MutationObserver(() => {
      updateLoadingState(media);
    }).observe(media, {
      attributes: true,
      attributeFilter: ["src", "hidden"]
    });

    updateLoadingState(media);
  });
});
