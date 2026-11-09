const time = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;

// Static controls are rendered on state transitions; the live path only changes
// the displayed clock, tape packs, reels and meter. No per-tick DOM queries.
export function createPlayerView({ audio, transport }) {
  const nodes = new Map(),
    all = new Map();
  const $ = (s) => {
    if (!nodes.has(s)) nodes.set(s, document.querySelector(s));
    return nodes.get(s);
  };
  const $$ = (s) => {
    if (!all.has(s)) all.set(s, [...document.querySelectorAll(s)]);
    return all.get(s);
  };
  const text = (s, value) => {
    const e = $(s);
    value = String(value);
    if (e.textContent !== value) e.textContent = value;
  };
  const attr = (e, name, value) => {
    value = String(value);
    if (e.getAttribute(name) !== value) e.setAttribute(name, value);
  };
  const style = (e, name, value) => {
    if (e.style.getPropertyValue(name) !== value)
      e.style.setProperty(name, value);
  };
  const player = $("#player");
  let previous = [],
    lastModel = "",
    lastTitle = "";
  return {
    render({
      busy,
      flipping,
      servicePhase,
      playPending,
      portable,
      counterZero,
    }) {
      const t = transport.tape,
        mode = transport.mode;
      const state = [
        t,
        mode,
        transport.open,
        transport.model,
        transport.side,
        busy,
        flipping,
        servicePhase,
        playPending,
        transport.reversePending,
        portable,
        audio.volume,
        audio.wear,
      ];
      if (state.some((value, i) => value !== previous[i])) {
        previous = state;
        const running = ["playing", "rewinding", "forwarding"].includes(mode);
        for (const [name, on] of Object.entries({
          "door-open": transport.open,
          "has-tape": !!t,
          running,
          winding: mode === "rewinding" || mode === "forwarding",
          reverse:
            mode === "rewinding" ||
            (mode === "playing" &&
              transport.model === "auto" &&
              transport.side === "B"),
          flipping,
        }))
          player.classList.toggle(name, on);
        attr(player, "data-direction", transport.side);
        if (lastModel !== transport.model) {
          lastModel = transport.model;
          $(".model-number").innerHTML =
            transport.model === "auto"
              ? "NR-88<span>AUTO REVERSE</span>"
              : "NC-85<span>STEREO</span>";
          text(
            ".back-brand small",
            transport.model === "auto"
              ? "NR-88 / AUTO REVERSE"
              : "NC-85 / PERSONAL STEREO",
          );
          text(
            ".window-top > span:first-child",
            transport.model === "auto"
              ? "BI-DIRECTIONAL TAPE TRANSPORT"
              : "PRECISION TAPE TRANSPORT",
          );
          text(
            '[data-action="flip"] span',
            transport.model === "auto" ? "DIRECTION A / B" : "FLIP A / B",
          );
        }
        $("#loaded-tape").hidden = !t;
        $("#liner-empty").hidden = !!t;
        $("#liner-loaded").hidden = !t;
        $(".playback-summary").hidden = !t;
        text("#door-state", transport.open ? "DOOR OPEN" : "DOOR LATCHED");
        for (const button of $$('[data-action="door"]'))
          attr(button, "aria-expanded", transport.open);
        const names = {
          stopped: transport.open ? "DOOR OPEN" : "READY",
          playing: "PLAY",
          paused: "PAUSE",
          rewinding: "REW",
          forwarding: "FF",
        };
        text(
          "#status",
          servicePhase ||
            (flipping
              ? "FLIPPING…"
              : busy
                ? "LOADING…"
                : !t
                  ? "NO TAPE"
                  : names[mode]),
        );
        for (const button of $$(".shelf-trigger"))
          button.disabled = !!servicePhase || flipping;
        $("#led").classList.toggle("on", mode === "playing");
        for (const [action, active] of Object.entries({
          play:
            mode === "playing" ||
            mode === "paused" ||
            playPending ||
            transport.reversePending ||
            servicePhase === "AUTO REVERSE…",
          pause: mode === "paused",
          rewind: mode === "rewinding",
          forward: mode === "forwarding",
        })) {
          const button = $(`[data-action="${action}"]`);
          button.classList.toggle("pressed", active);
          attr(button, "aria-pressed", active);
        }
        $("#portable-toggle").disabled = busy || flipping;
        for (const button of $$("[data-action]")) {
          const action = button.dataset.action;
          button.disabled =
            (busy &&
              !(
                (["stop", "door", "flip", "eject"].includes(action) &&
                  playPending) ||
                (action === "stop" && servicePhase === "AUTO REVERSE…")
              )) ||
            (["play", "pause", "rewind", "forward"].includes(action) &&
              (!t || transport.open)) ||
            (["flip", "eject"].includes(action) && !t);
        }
        if (t) {
          style($("#loaded-tape .cassette"), "--tape-color", t.color);
          text("#loaded-tape .tape-title", t.title);
          text(
            "#loaded-tape .tape-side",
            transport.model === "auto" ? "A" : transport.side,
          );
          text("#current-title", t.title);
          text("#current-subtitle", t.subtitle);
          text("#track-category", `${t.number} / ${t.genre}`);
          text("#side-label", transport.side);
          text("#track-name", t.sides[transport.side].title);
          text("#track-author", `${t.author} · ${t.license}`);
        }
        text("#volume-value", Math.round(audio.volume * 100));
        text("#wear-value", Math.round(audio.wear * 100));
        const title = `${mode === "playing" && t ? `${t.title} · ` : ""}NEO CASSETTE — NC-85`;
        if (lastTitle !== title) {
          lastTitle = title;
          document.title = title;
        }
      }
      text(
        "#counter",
        String(
          ((Math.floor((transport.position - counterZero) * 1.8) % 1000) +
            1000) %
            1000,
        ).padStart(3, "0"),
      );
      if (t) {
        text(
          "#track-time",
          `${time(transport.position)} / ${time(transport.duration)}`,
        );
        for (const reel of $$("#loaded-tape .reel"))
          style(
            reel,
            "transform",
            portable
              ? `rotate(${(transport.position * 240).toFixed(1)}deg)`
              : "",
          );
        const progress = transport.duration
          ? transport.position / transport.duration
          : 0;
        const p =
          transport.model === "auto" && transport.side === "B"
            ? 1 - progress
            : progress;
        style($("#position-fill"), "width", `${(p * 100).toFixed(2)}%`);
        style(
          player,
          "--left-pack",
          `${(Math.sqrt(1 - p) * 26 + 39).toFixed(2)}%`,
        );
        style(
          player,
          "--right-pack",
          `${(Math.sqrt(p) * 26 + 39).toFixed(2)}%`,
        );
      }
      const level = audio.level();
      $$(".vu-meter i").forEach((bar, i) =>
        bar.classList.toggle("lit", i < level * 38),
      );
    },
  };
}
