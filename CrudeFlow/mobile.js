/* Move the existing controls rather than duplicate inputs or their listeners. */
(() => {
  const panel = document.getElementById("controlPanel");
  const placeholder = document.createComment("Desktop controls return here");
  panel.before(placeholder);
  const dialog = document.getElementById("mobileControls");
  const body = document.getElementById("mobileControlsBody");
  const open = document.getElementById("mobileControlsOpen");
  const close = document.getElementById("mobileControlsClose");
  const media = window.matchMedia("(max-width:900px)");
  function returnPanel() {
    placeholder.after(panel);
    const tip = document.getElementById("controlHelp");
    if (tip) {
      tip.hidden = true;
      document.body.append(tip);
    }
    document.body.classList.remove("mobile-panel-open");
    open.setAttribute("aria-expanded", "false");
    if (media.matches) open.focus();
  }
  open.addEventListener("click", () => {
    body.append(panel);
    const tip = document.getElementById("controlHelp");
    if (tip) dialog.append(tip);
    dialog.showModal();
    document.body.classList.add("mobile-panel-open");
    open.setAttribute("aria-expanded", "true");
    close.focus();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", returnPanel);
  media.addEventListener("change", () => {
    if (!media.matches && dialog.open) dialog.close();
  });
  document
    .getElementById("mobileDocsOpen")
    .addEventListener("click", () => document.getElementById("docsToggle").click());
  document.getElementById("docsDialog").addEventListener("close", () => {
    if (media.matches) document.getElementById("mobileDocsOpen").focus();
  });
  function updateSummary() {
    const context = document.getElementById("candidateContext");
    const summary = document.getElementById("mobileSummary");
    const mix = context.querySelector("strong");
    const status = context.querySelector("span");
    summary.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = "현재 조합: " + (mix?.textContent || "계산 중");
    const detail = document.createElement("span");
    detail.textContent = status?.textContent || "";
    summary.append(title, detail);
  }
  new MutationObserver(updateSummary).observe(document.getElementById("candidateContext"), {
    childList: true,
    subtree: true,
    characterData: true,
  });
  updateSummary();
})();
