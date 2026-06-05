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
