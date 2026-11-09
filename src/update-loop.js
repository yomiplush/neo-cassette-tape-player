// One coalesced timer while work is active; no polling while stopped or paused.
export function createUpdateLoop(
  { update, active, delay },
  clock = globalThis,
) {
  let timer = null,
    running = false,
    paused = false,
    disposed = false;
  const tick = () => {
    timer = null;
    if (paused || disposed) return;
    running = true;
    try {
      update();
    } finally {
      running = false;
    }
    if (!paused && !disposed && active())
      timer = clock.setTimeout(tick, delay());
  };
  const pause = () => {
    paused = true;
    if (timer !== null) clock.clearTimeout(timer);
    timer = null;
  };
  const wake = () => {
    if (!disposed && !paused && !running && timer === null)
      timer = clock.setTimeout(tick, 0);
  };
  return {
    wake,
    pause,
    resume() {
      if (disposed) return;
      paused = false;
      wake();
    },
    dispose() {
      disposed = true;
      pause();
    },
  };
}
