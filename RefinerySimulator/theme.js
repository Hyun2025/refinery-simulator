/* Appearance only: never reads or changes model inputs, charts or document content. */
(() => {
  const root = document.documentElement;
  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };
  const toggle = document.getElementById("themeToggle");
  const effects = document.getElementById("effectsToggle");
  function apply(value) {
    root.dataset.theme = value === "night" ? "night" : "light";
    if (toggle) {
      toggle.textContent = root.dataset.theme === "night" ? "☀ 밝은 테마" : "☾ 야간 테마";
      toggle.setAttribute("aria-pressed", String(root.dataset.theme === "night"));
    }
  }
  function motion(value) {
    root.dataset.effects = value === "off" ? "off" : "on";
    if (effects) {
      effects.textContent =
        root.dataset.effects === "off" ? "테두리 효과 켜기" : "테두리 효과 끄기";
      effects.setAttribute("aria-pressed", String(root.dataset.effects === "on"));
    }
  }
  apply(read("crudeflow-theme"));
  motion(read("crudeflow-effects"));
  toggle?.addEventListener("click", () => {
    apply(root.dataset.theme === "night" ? "light" : "night");
    save("crudeflow-theme", root.dataset.theme);
  });
  effects?.addEventListener("click", () => {
    motion(root.dataset.effects === "off" ? "on" : "off");
    save("crudeflow-effects", root.dataset.effects);
  });
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let heatTimer;
  function canAnimate() {
    return root.dataset.effects !== "off" && !reducedMotion?.matches && !document.hidden;
  }
  // Restart the cooling effect even when the slider is moved repeatedly.
  document.addEventListener("crudeflow:recalculated", () => {
    if (!canAnimate()) return;
    const boxes = document.querySelectorAll(
      ".analysis-book, .book-page:not([hidden]) > section, #controlPanel",
    );
    clearTimeout(heatTimer);
    boxes.forEach((box) => box.classList.remove("theme-heat"));
    if (boxes.length) void boxes[0].offsetWidth;
    boxes.forEach((box) => box.classList.add("theme-heat"));
    heatTimer = setTimeout(() => boxes.forEach((box) => box.classList.remove("theme-heat")), 2800);
  });
  function resetEffects() {
    if (!canAnimate()) {
      clearTimeout(heatTimer);
      document.querySelectorAll(".theme-heat").forEach((box) => box.classList.remove("theme-heat"));
    }
  }
  effects?.addEventListener("click", resetEffects);
  reducedMotion?.addEventListener("change", resetEffects);
  document.addEventListener("visibilitychange", resetEffects);
})();



(() => {
  const tab = document.getElementById("modelAssumptions");
  if (!tab) return;

  let scheduled = false;

  function updateStickyState() {
    const style = getComputedStyle(tab);
    const stickyTop = parseFloat(style.top);

    const isStuck =
      style.position === "sticky" &&
      Number.isFinite(stickyTop) &&
      window.scrollY > 0 &&
      Math.abs(tab.getBoundingClientRect().top - stickyTop) <= 1;

    tab.classList.toggle("is-stuck", isStuck);
    scheduled = false;
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateStickyState);
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  tab.addEventListener("toggle", scheduleUpdate);

  updateStickyState();
})();
