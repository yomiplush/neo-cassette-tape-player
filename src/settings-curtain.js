// A single set of controls moves between the liner and the portrait curtain.
export function setupSettingsCurtain({
  button,
  dialog,
  controls,
  closeButton,
}) {
  const listeners = new AbortController();
  const portrait = matchMedia(
    "(max-width: 1024px) and (orientation: portrait)",
  );
  const usesCurtain = () =>
    portrait.matches || document.documentElement.dataset.portable === "true";
  const home = document.createComment("sound controls home");
  controls.before(home);
  let animation = null,
    revision = 0;
  const duration = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 560;
  const animate = async (opening) => {
    const token = ++revision;
    const from =
      dialog.open && animation
        ? getComputedStyle(dialog).transform
        : opening
          ? "translateY(-105%)"
          : "translateY(0)";
    animation?.cancel();
    if (opening) {
      dialog.showModal();
      button.setAttribute("aria-expanded", "true");
    }
    dialog.dataset.phase = opening ? "lowering" : "lifting";
    animation = dialog.animate(
      [
        { transform: from },
        { transform: opening ? "translateY(0)" : "translateY(-105%)" },
      ],
      {
        duration: duration(),
        easing: opening
          ? "cubic-bezier(.22,.7,.2,1)"
          : "cubic-bezier(.5,0,.75,.3)",
        fill: "both",
      },
    );
    try {
      await animation.finished;
    } catch {
      return;
    }
    if (token !== revision) return;
    animation.cancel();
    animation = null;
    if (opening) {
      dialog.dataset.phase = "open";
      closeButton.focus({ preventScroll: true });
    } else {
      dialog.close();
      dialog.dataset.phase = "closed";
      button.setAttribute("aria-expanded", "false");
      button.focus({ preventScroll: true });
    }
  };
  const close = () => {
    if (dialog.open && dialog.dataset.phase !== "lifting") void animate(false);
  };
  button.addEventListener(
    "click",
    () => {
      if (usesCurtain() && !dialog.open) void animate(true);
    },
    { signal: listeners.signal },
  );
  closeButton.addEventListener("click", close, { signal: listeners.signal });
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      close();
    },
    { signal: listeners.signal },
  );
  const place = () => {
    ++revision;
    animation?.cancel();
    animation = null;
    if (dialog.open) dialog.close();
    button.setAttribute("aria-expanded", "false");
    dialog.dataset.phase = "closed";
    if (usesCurtain())
      dialog.querySelector(".curtain-controls").append(controls);
    else home.after(controls);
  };
  portrait.addEventListener("change", place, { signal: listeners.signal });
  document.addEventListener("portablechange", place, {
    signal: listeners.signal,
  });
  place();
  return {
    dispose() {
      listeners.abort();
      ++revision;
      animation?.cancel();
      animation = null;
    },
  };
}
