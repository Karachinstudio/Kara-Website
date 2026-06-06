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
const clickEffectCountKey = "karaClickEffectCount";
const clickEffectThresholdKey = "karaClickEffectThreshold";
let clickEffectInteractionCount = Number(sessionStorage.getItem(clickEffectCountKey)) || 0;
let clickEffectThreshold = Number(sessionStorage.getItem(clickEffectThresholdKey)) || pickClickEffectThreshold();
let lastPointerX = window.innerWidth / 2;
let lastPointerY = window.innerHeight / 2;

sessionStorage.setItem(clickEffectThresholdKey, String(clickEffectThreshold));

function shouldDisableClickEffects() {
  return window.matchMedia("(pointer: coarse), (max-width: 700px)").matches;
}

function pickClickEffectThreshold() {
  return Math.floor(Math.random() * 20) + 1;
}

function countClickEffectInteraction(x, y) {
  if (shouldDisableClickEffects()) {
    return;
  }

  clickEffectInteractionCount += 1;
  sessionStorage.setItem(clickEffectCountKey, String(clickEffectInteractionCount));

  if (clickEffectInteractionCount < clickEffectThreshold) {
    return;
  }

  clickEffectInteractionCount = 0;
  clickEffectThreshold = pickClickEffectThreshold();
  sessionStorage.setItem(clickEffectCountKey, "0");
  sessionStorage.setItem(clickEffectThresholdKey, String(clickEffectThreshold));
  playClickEffect(x, y);
}

function removeClickEffect(effect) {
  const effectIndex = activeClickEffects.indexOf(effect);

  if (effectIndex !== -1) {
    activeClickEffects.splice(effectIndex, 1);
  }

  if (effect.clickSound) {
    effect.clickSound.pause();
    effect.clickSound.removeAttribute("src");
    effect.clickSound.load();
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
  const effectIndex = Math.floor(Math.random() * clickEffectSources.length);
  const sound = new Audio(clickEffectSources[effectIndex].replace(/\.webm$/, ".mp3"));
  const size = Math.min(280, Math.max(150, window.innerWidth * 0.22));

  effect.src = clickEffectSources[effectIndex];
  effect.clickSound = sound;
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
    "visibility:hidden",
    "opacity:0",
    "background:transparent"
  ].join(";");

  effect.addEventListener("playing", () => {
    effect.style.visibility = "visible";
    effect.style.opacity = "1";
  }, { once: true });
  effect.addEventListener("ended", () => removeClickEffect(effect), { once: true });
  effect.addEventListener("error", () => removeClickEffect(effect), { once: true });
  document.body.append(effect);
  activeClickEffects.push(effect);

  sound.volume = 0.72;
  sound.play().catch(() => {});
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
    event.button !== 0 ||
    event.target.closest(
      "form button, .game-sound-toggle, input, select, textarea, label, summary, iframe"
    )
  ) {
    return;
  }

  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  countClickEffectInteraction(lastPointerX, lastPointerY);
});

document.addEventListener("pointermove", (event) => {
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
});

document.addEventListener("keydown", (event) => {
  if (
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.target.closest("input, select, textarea, [contenteditable='true']")
  ) {
    return;
  }

  countClickEffectInteraction(lastPointerX, lastPointerY);
}, { capture: true });

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
