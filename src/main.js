import "./style.css";
import { TapeTransport } from "./transport.js";
import { CassetteAudio } from "./audio.js";
import { flipCassette, ejectCassette } from "./flip.js";
import homeIcon from "./assets/icons/home.webp";
import repositoryIcon from "./assets/icons/repository.webp";
import sponsorIcon from "./assets/icons/sponsor.webp";
import {
  demos,
  readSettings,
  saveSettings,
  getImports,
  storeTape,
  deleteTape,
} from "./library.js";

document.documentElement.dataset.edition =
  import.meta.env.MODE === "selfhost" ? "selfhost" : "demo";

const $ = (s) => document.querySelector(s);
const settings = readSettings(),
  transport = new TapeTransport(settings.positions),
  audio = new CassetteAudio();
const finite = (n, fallback) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.max(0, Math.min(1, n))
    : fallback;
audio.volume = finite(settings.volume, 0.65);
audio.wear = finite(settings.wear, 0.5);
let tapes = [...demos],
  busy = false,
  counterZero = 0,
  lastMode = "",
  toastTimer,
  flipping = false,
  servicePhase = "",
  flipController = null,
  generation = 0,
  playController = null;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const time = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
const cassette = (mini = false) =>
  `<div class="cassette ${mini ? "mini" : ""}"><i class="tape-screw tl"></i><i class="tape-screw tr"></i><i class="tape-screw bl"></i><i class="tape-screw br"></i><div class="tape-label"><div class="label-top"><span class="tape-side">A</span><span>NEO SOUND ARCHIVE</span><span>STEREO</span></div><strong class="tape-title">YOUR NEXT MEMORY</strong><div class="label-rule"></div><div class="tape-window"><div class="spool left-spool"><div class="reel"></div></div><div class="tape-bridge"></div><div class="spool right-spool"><div class="reel"></div></div></div><div class="label-bottom"><span>LOW NOISE / HIGH FEELING</span><b>TYPE I</b></div></div><div class="cassette-foot"><i></i><span>● &nbsp; ▪ &nbsp; ●</span><i></i></div></div>`;

$("#app").innerHTML = `
<header class="site-header"><a class="wordmark" href="./" aria-label="NEO CASSETTE home">NEO<span>CASSETTE</span></a><span class="header-note">ANALOG FEELING. DIGITAL SOUL.</span><nav class="creator-links" aria-label="Creator links"><a href="https://www.yomiplush.dev/" target="_blank" rel="noopener noreferrer" aria-label="YomiPlush website" title="YomiPlush website"><img src="${homeIcon}" width="32" height="32" alt="" decoding="async"></a><a href="https://github.com/yomiplush/neo-cassette-tape-player" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository" title="GitHub repository"><img src="${repositoryIcon}" width="32" height="32" alt="" decoding="async"></a><a href="https://github.com/sponsors/yomiplush" target="_blank" rel="noopener noreferrer" aria-label="Support on GitHub Sponsors" title="Support on GitHub Sponsors"><img src="${sponsorIcon}" width="32" height="32" alt="" decoding="async"></a></nav></header>
<main>
 <section class="intro"><div><div class="eyebrow"><span class="tiny-dot"></span> PERSONAL STEREO / EST. 1985</div><h1>A little imperfection.<br><em>Just right.</em></h1></div><p>Pick a tape. Press play.<br>The hiss. The wobble. The memories.<br><span>A little hiss. A lot of feeling.</span></p></section>
 <section class="listening-space" aria-label="Cassette player">
 <div class="device-area"><div class="device-top"><span>PHONES <span class="jack">●</span></span><div class="top-ridges"></div><span>DC 3V <b>⊖</b></span></div>
 <div class="player" id="player">
  <i class="case-screw tl"></i><i class="case-screw tr"></i><i class="case-screw bl"></i><i class="case-screw br"></i>
  <div class="device-brand"><div class="neo-logo">NEO<span>PORTABLE CASSETTE PLAYER</span></div><div class="model-number">NC-85<span>STEREO</span></div></div>
  <div class="case-topline"><button class="shelf-trigger case-shelf" aria-label="Open tape collection">TAPE BOX <span class="count">03</span></button><span id="door-state">DOOR LATCHED</span></div>
  <div class="door-surround"><div class="door" id="door"><div class="window-top"><span>PRECISION TAPE TRANSPORT</span><span class="direction">▸</span></div><div class="deck-window"><div class="empty-deck"><span>○ &nbsp; ○</span><small>OPEN. INSERT. PLAY.</small></div><div id="loaded-tape">${cassette()}</div><button class="window-latch" data-action="door" aria-label="Toggle cassette window" title="Press the window to open or close"></button></div><div class="door-bottom"><span>FULL AUTO STOP</span><span>↗ OPEN</span></div></div><div class="door-edge"></div></div>
  <div class="readout"><div class="counter-wrap"><span class="micro-label">TAPE COUNTER</span><div class="counter-line"><output id="counter">000</output><button id="reset-counter" aria-label="Reset counter">RESET</button></div></div><div class="signal-wrap"><div class="signal-label"><span class="led" id="led"></span><span id="status" role="status">NO TAPE</span></div><div class="vu-meter" aria-label="Audio level">${"<i></i>".repeat(12)}</div><div class="vu-scale"><span>−20</span><span>−10</span><span>0</span><span>+3</span></div></div></div>
 <div class="deck-actions case-controls"><button data-action="door" aria-label="Open or close door">⏏ <span>OPEN / CLOSE</span></button><button data-action="flip" aria-label="Flip side A/B">↻ <span>FLIP A / B</span></button><button data-action="eject" aria-label="Eject tape">↗ <span>EJECT TAPE</span></button></div>
  <div class="transport-labels"><span>REW</span><span>F.FWD</span><span>STOP</span><span>PLAY</span><span>PAUSE</span></div>
  <div class="transport"><button data-action="rewind" aria-label="Rewind"><span>◀◀</span></button><button data-action="forward" aria-label="Fast forward"><span>▶▶</span></button><button data-action="stop" aria-label="Stop"><span>■</span></button><button data-action="play" class="play-key" aria-label="Play"><span>▶</span></button><button data-action="pause" aria-label="Pause"><span>Ⅱ</span></button></div>
  <div class="device-footer"><span class="stereo-bars">▥</span><span>FEEL THE TAPE.</span><span class="serial">N° 008519</span></div>
 </div><div class="device-bottom"><span>HIGH FIDELITY? &nbsp; NOT QUITE.</span><div class="bottom-ridges"></div></div><div class="device-shadow"></div>

 </div>
 <aside class="liner"><div class="liner-heading"><span>NOW ON DECK</span><span class="live-dot"></span></div><div class="liner-empty" id="liner-empty"><span class="outline-tape">▱</span><h2>What is on your tape?</h2><p>Pick one from the collection.<br>Find a sound for your state of mind.</p><button class="shelf-trigger primary">Choose a tape <span>↗</span></button></div><div id="liner-loaded" hidden><div class="track-category" id="track-category"></div><h2 id="current-title"></h2><p class="liner-subtitle" id="current-subtitle"></p><div class="side-row"><span>SIDE <b id="side-label">A</b></span><span id="track-time">00:00 / 00:00</span></div><div class="position-track"><div id="position-fill"></div></div><div class="track-info"><strong id="track-name"></strong><span id="track-author"></span></div><p class="tape-note">Rewind instead of skipping.<br>Open the door and flip to the other side.</p></div>
 <div class="sound-controls"><div class="control-heading"><h3>THE ANALOG TOUCH</h3><button id="about-open" aria-label="Player instructions">ⓘ</button></div><label class="slider-label" for="volume"><span>VOLUME</span><output id="volume-value">65</output></label><input type="range" id="volume" min="0" max="100" value="${audio.volume * 100}" aria-label="Master volume"><div class="slider-label wear-label"><label for="wear">TAPE WEAR <span>A little wear and tear</span></label><output id="wear-value">50</output></div><input type="range" id="wear" min="0" max="100" value="${audio.wear * 100}" aria-label="Tape wear"><div class="wear-scale"><span>WELL-LOVED</span><span>FOUND IN THE ATTIC</span></div><div class="sound-tags"><span>HISS</span><span>WOW & FLUTTER</span><span>WARMTH</span></div></div>
 </aside></section>
 <section class="bottom-note"><span>01 — PUT THE WORLD ON PAUSE.</span><p>Even the rewinding becomes part of the music.</p><span>DESIGNED FOR SLOW LISTENING.</span></section>
</main><footer class="site-footer"><span>NEO CASSETTE <span>— A SMALL TRIP BACK.</span></span><button id="credits-open">CREDITS & LICENSES ↗</button></footer>
<dialog id="library-dialog" aria-labelledby="library-heading"><div class="dialog-header"><div><div class="eyebrow">THE COLLECTION</div><h2 id="library-heading">Your tape collection<span id="tape-total">03 TAPES</span></h2></div><button class="close-dialog" aria-label="Close tape collection">×</button></div><p class="dialog-intro">Pick a tape for today’s soundtrack.</p><div id="tape-grid" class="tape-grid"></div><button id="import-open" class="import-button"><b>＋</b><span>Make your own mixtape<small>Create sides A / B from audio files</small></span><span>↗</span></button><p class="library-note">DEMO COLLECTION · 6 ORIGINAL TRACKS BY DURU-AI · CC0<br>Imported audio stays in this browser.</p></dialog>
<dialog id="import-dialog" aria-labelledby="import-heading"><form id="import-form"><div class="dialog-header"><div><div class="eyebrow">MAKE A MIXTAPE</div><h2 id="import-heading">Give your music a home.</h2></div><button type="button" class="close-dialog" aria-label="Close import dialog">×</button></div><p class="dialog-intro">One track per side. Turn your audio into a mixtape.</p><label class="form-label">Tape name<input name="title" maxlength="40" placeholder="Example: The way home" required></label><label class="form-label file-label">SIDE A <span>Required</span><input name="sideA" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" required></label><label class="form-label file-label">SIDE B <span>Optional; uses side A when omitted</span><input name="sideB" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"></label><p class="form-hint">Up to 30 MB and 10 minutes per side. Use MP3, WAV, M4A or another browser-supported format. Files are never uploaded.</p><button class="primary import-submit" type="submit">Create tape <span>↗</span></button><p id="import-status" role="status"></p></form></dialog>
<dialog id="about-dialog" aria-labelledby="about-heading"><div class="dialog-header"><div><div class="eyebrow">OWNER'S MANUAL</div><h2 id="about-heading">Enjoy the ritual.</h2></div><button class="close-dialog" aria-label="Close instructions">×</button></div><div class="manual"><p><b>01 / Choose a tape</b>Choose a tape from the collection. The deck stops, opens and loads it automatically.</p><p><b>02 / Press a button</b>▶ plays, Ⅱ pauses, ◀◀ / ▶▶ winds at 12x speed, and ■ stops. The deck clicks to a stop at the end.</p><p><b>03 / Flip the tape</b>Press FLIP to stop, open, turn the tape and close the door. An already open door stays open. Each side remembers its position. Flipping from the end starts the other side at zero. RESET changes only the counter.</p><p><b>04 / Set the wear</b>Hiss, wow and flutter, softened highs, saturation and gentle dropouts remain part of the sound even at minimum wear.</p><p>Keyboard: Space plays/pauses, arrows wind, S stops, E opens/closes, F flips. Your first interaction enables audio. Leaving the page stops playback; resume manually when you return.</p><p class="form-hint">An original fictional deck simulation. Recording and complete emulation of a specific physical machine are not included.</p></div></dialog>
<dialog id="credits-dialog" aria-labelledby="credits-heading"><div class="dialog-header"><div><div class="eyebrow">MADE WITH RESPECT</div><h2 id="credits-heading">Credits & licenses</h2></div><button class="close-dialog" aria-label="Close credits">×</button></div><div class="manual"><p><b>PLAYER / MIT</b>© 2026 YomiPlush. NEO NC-85 is an original design. Reference photos, manufacturer logos and product images are not distributed.</p><p><b>MECHANISMS / CC0 1.0</b>Recordings by stecman, Joseph SARDIN / BigSoundBank and Spring Spring. Edited, filtered and looped. <a href="${import.meta.env.BASE_URL}sfx/credits.json" target="_blank" rel="noopener noreferrer">Sources and edits ↗</a> · <a href="${import.meta.env.BASE_URL}licenses/SFX-CC0.txt" target="_blank" rel="noopener noreferrer">Full CC0 license ↗</a></p><p><b>MUSIC / CC0 1.0</b>Six original demo tracks by DURU-AI / uncle-sheepsky, sourced from their public repository and converted to 128 kbps MP3. Original titles, authors and licensing are retained.</p><p><a href="https://github.com/uncle-sheepsky/duru-ai-cc0-bgm" target="_blank" rel="noopener noreferrer">Music source repository ↗</a><br><a href="${import.meta.env.BASE_URL}licenses/DURU-CC0.txt" target="_blank" rel="noopener noreferrer">Full music CC0 license ↗</a></p><p>Tape names are original collection titles. Original track names appear in the player and collection. Imported music remains the property of its rights holders.</p><p><a href="https://github.com/yomiplush/neo-cassette-tape-player" target="_blank" rel="noopener noreferrer">NEO CASSETTE / GitHub ↗</a></p></div></dialog>
<div class="mobile-dock-shade" aria-hidden="true"></div><div id="toast" role="status" aria-live="polite"></div>`;

// Move the same controls outside the case stacking context on pocket-sized screens.
// No duplicate buttons/listeners: focus and transport state survive orientation changes.
if (import.meta.env.MODE === "selfhost") {
  const media = matchMedia(
      "(max-width: 900px), (max-width: 1100px) and (max-height: 500px)",
    ),
    dock = document.createElement("div");
  dock.className = "transport-dock";
  document.body.append(dock);
  const labels = $(".transport-labels"),
    keys = $(".transport"),
    home = $(".device-footer");
  const place = () => {
    if (media.matches) dock.append(labels, keys);
    else home.before(labels, keys);
  };
  place();
  media.addEventListener("change", place);
}

document.addEventListener(
  "click",
  (e) => {
    const button = e.target.closest("button");
    if (!button || button.disabled || button.matches("[data-action]")) return;
    audio
      .unlock()
      .then(() => audio.sound("click"))
      .catch(() => {});
  },
  true,
);

function message(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
}
function persist() {
  if (
    !saveSettings({
      positions: transport.snapshot(),
      volume: audio.volume,
      wear: audio.wear,
    })
  )
    message(
      "Could not save playback position. Check browser storage.",
    );
}
function renderShelf() {
  $("#tape-total").textContent =
    `${String(tapes.length).padStart(2, "0")} TAPES`;
  $(".count").textContent = String(tapes.length).padStart(2, "0");
  $("#tape-grid").innerHTML = tapes
    .map(
      (t) =>
        `<article class="tape-card" style="--tape-color:${t.color}"><div class="sleeve"><div class="sleeve-number">NEO / ${esc(t.number)}</div>${cassette(true)}<div class="sleeve-caption">A LITTLE HISS. A LOT OF FEELING.</div></div><div class="tape-card-title"><h3>${esc(t.title)}</h3><span>${time(t.sides.A.duration + t.sides.B.duration)}</span></div><p>A · ${esc(t.sides.A.title)}<br>B · ${esc(t.sides.B.title)}</p><div class="card-actions"><button class="load-tape" data-id="${esc(t.id)}">${transport.tape?.id === t.id ? "Loaded" : "Load this tape"} <span>↗</span></button>${t.imported ? `<button class="delete-tape" data-id="${esc(t.id)}" aria-label="${esc(t.title)}: delete">×</button>` : ""}</div></article>`,
    )
    .join("");
  $$("#tape-grid .cassette").forEach((el, i) => {
    el.querySelector(".tape-title").textContent = tapes[i].title;
  });
  $$(".load-tape").forEach(
    (b) =>
      (b.onclick = () =>
        action(async () => {
          transport.stop(); audio.setMode("stopped");
          const tape = tapes.find((t) => t.id === b.dataset.id);
          if (transport.tape?.id === tape.id) {
            $("#library-dialog").close();
            return;
          }
          if (!transport.open) transport.door();
          audio.sound("door");
          render();
          if (transport.tape) transport.eject();
          transport.insert(tape);
          counterZero = 0;
          render();
          $("#library-dialog").close();
          await new Promise((r) => setTimeout(r, 320));
          transport.door();
          audio.sound("door");
          message("Tape loaded. Press ▶ to play.");
          persist();
        })),
  );
  $$(".delete-tape").forEach(
    (b) =>
      (b.onclick = () =>
        action(async () => {
          if (transport.tape?.id === b.dataset.id)
            return message("Eject this tape before deleting it.");
          await deleteTape(b.dataset.id);
          tapes = tapes.filter((t) => t.id !== b.dataset.id);
          delete transport.memory[b.dataset.id];
          persist();
          renderShelf();
          message("Tape removed from the collection.");
        })),
  );
}
function $$(s) {
  return [...document.querySelectorAll(s)];
}
function render() {
  const t = transport.tape,
    mode = transport.mode,
    running = ["playing", "rewinding", "forwarding"].includes(mode);
  $("#player").classList.toggle("door-open", transport.open);
  $("#player").classList.toggle("has-tape", !!t);
  $("#player").classList.toggle("running", running);
  $("#player").classList.toggle(
    "winding",
    mode === "rewinding" || mode === "forwarding",
  );
  $("#player").classList.toggle("reverse", mode === "rewinding");
  $("#loaded-tape").hidden = !t;
  $("#liner-empty").hidden = !!t;
  $("#liner-loaded").hidden = !t;
  const names = {
    stopped: transport.open ? "DOOR OPEN" : "READY",
    playing: "PLAY ▸",
    paused: "PAUSE Ⅱ",
    rewinding: "REW ◂◂",
    forwarding: "FF ▸▸",
  };
  $("#door-state").textContent = transport.open ? "DOOR OPEN" : "DOOR LATCHED";
  $$('[data-action="door"]').forEach(b=>b.setAttribute("aria-expanded", String(transport.open)));
  $("#status").textContent = servicePhase ? servicePhase : flipping
    ? "FLIPPING…"
    : busy
      ? "LOADING…"
      : !t
        ? "NO TAPE"
        : names[mode];
  $("#player").classList.toggle("flipping", flipping);
  $$(".shelf-trigger").forEach((b) => (b.disabled = !!servicePhase || flipping));
  $("#led").classList.toggle("on", mode === "playing");
  $("#counter").textContent = String(
    ((Math.floor((transport.position - counterZero) * 1.8) % 1000) + 1000) %
      1000,
  ).padStart(3, "0");
  for (const [act, active] of Object.entries({
    play: mode === "playing",
    pause: mode === "paused",
    rewind: mode === "rewinding",
    forward: mode === "forwarding",
  }))
    $(`[data-action="${act}"]`).classList.toggle("pressed", active);
  $$("[data-action]").forEach((b) => {
    const a = b.dataset.action;
    b.disabled =
      (busy && !(["stop", "door", "flip", "eject"].includes(a) && playController)) ||
      (["play", "pause", "rewind", "forward"].includes(a) &&
        (!t || transport.open)) ||
      (["flip", "eject"].includes(a) && !t);
  });
  if (t) {
    $("#loaded-tape .cassette").style.setProperty("--tape-color", t.color);
    $("#loaded-tape .tape-title").textContent = t.title;
    $("#loaded-tape .tape-side").textContent = transport.side;
    $("#current-title").textContent = t.title;
    $("#current-subtitle").textContent = t.subtitle;
    $("#track-category").textContent = `${t.number} / ${t.genre}`;
    $("#side-label").textContent = transport.side;
    $("#track-time").textContent =
      `${time(transport.position)} / ${time(transport.duration)}`;
    $("#track-name").textContent = t.sides[transport.side].title;
    $("#track-author").textContent = `${t.author} · ${t.license}`;
    const p = transport.duration ? transport.position / transport.duration : 0;
    $("#position-fill").style.width = `${p * 100}%`;
    $("#player").style.setProperty(
      "--left-pack",
      `${Math.sqrt(1 - p) * 26 + 39}%`,
    );
    $("#player").style.setProperty(
      "--right-pack",
      `${Math.sqrt(p) * 26 + 39}%`,
    );
  }
  $("#volume-value").textContent = String(Math.round(audio.volume * 100));
  $("#wear-value").textContent = String(Math.round(audio.wear * 100));
  const level = audio.level();
  $$(".vu-meter i").forEach((b, i) =>
    b.classList.toggle("lit", i < level * 38),
  );
  if (lastMode !== mode) {
    lastMode = mode;
    document.title = `${mode === "playing" && t ? `${t.title} · ` : ""}NEO CASSETTE — NC-85`;
  }
}
async function action(fn) {
  if (busy) return;
  const operation = ++generation;
  busy = true;
  render();
  try {
    await audio.unlock();
    if (operation === generation && !document.hidden) await fn();
  } catch (e) {
    if (operation === generation) {
      transport.stop();
      audio.setMode("stopped");
      message(e.message || "Could not complete the operation. Please try again.");
    }
  } finally {
    if (operation === generation) {
      busy = false;
      render();
    }
  }
}
async function play() {
  if (!transport.tape || transport.open)
    return message("Load a tape and close the door.");
  if (transport.position >= transport.duration)
    return message("End of tape. Rewind or flip to the other side.");
  const side = transport.tape.sides[transport.side];
  transport.stop();
  audio.setMode("stopped");
  const controller = new AbortController(),
    operation = generation;
  playController = controller;
  render();
  const timer = setTimeout(
    () =>
      controller.abort(
        new Error(
          "Loading timed out. Check your connection and try playing again.",
        ),
      ),
    25000,
  );
  try {
    const buffer = await audio.load(side, controller.signal);
    if (operation !== generation || document.hidden) return;
    if (controller.signal.aborted) throw controller.signal.reason;
    // Decoder duration may differ slightly from MP3 container metadata.
    side.duration = buffer.duration;
    audio.delta();
    transport.play();
    audio.start(buffer, transport.position);
  } finally {
    clearTimeout(timer);
    if (playController === controller) playController = null;
  }
}
async function control(name) {
  // Account for elapsed audio time before changing transport state.
  advance();
  if (name === "play") {
    if (transport.mode !== "playing") await play();
  }
  if (name === "pause") {
    if (transport.mode === "paused") await play();
    else {
      transport.pause();
      audio.setMode(transport.mode);
    }
  }
  if (name === "stop") {
    transport.stop();
    audio.setMode("stopped");
    persist();
  }
  if (name === "rewind" || name === "forward") {
    if (transport.wind(name === "rewind" ? -1 : 1)) {
      audio.setMode(transport.mode);

    }
  }
  if (["door", "flip", "eject"].includes(name)) await service(name);

}
function waitForMechanism(ms, signal) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise(resolve => {
    const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolve(!signal.aborted); };
    const timer = setTimeout(done, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms);
    signal.addEventListener("abort", done, { once: true });
  });
}
async function moveDoor(open, signal) {
  if (transport.open === open) return !signal.aborted;
  transport.door(); audio.sound(open ? "door-open" : "door-close"); render();
  return waitForMechanism(360, signal);
}
function frameTape() {
  const rect = $("#loaded-tape .cassette").getBoundingClientRect();
  const pocket = import.meta.env.MODE === "selfhost" && matchMedia("(max-width: 900px), (max-width: 1100px) and (max-height: 500px)").matches;
  const bottom = pocket ? $(".transport-labels").getBoundingClientRect().top - 12 : innerHeight - 15;
  if (rect.top < 110 || rect.bottom > bottom) window.scrollBy(0, rect.top - Math.max(110, (bottom - rect.height)/2));
}
async function service(name) {
  if (name !== "door" && !transport.tape) return;
  transport.stop(); audio.setMode("stopped"); persist();
  const controller = new AbortController(), signal = controller.signal, wasOpen = transport.open, width = innerWidth;
  flipController = controller; servicePhase = name === "flip" ? "FLIPPING…" : name === "eject" ? "EJECTING…" : "DOOR…";
  const resized = () => { if (innerWidth !== width) controller.abort(); }; window.addEventListener("resize", resized);
  try {
    if (name === "door") { await moveDoor(!wasOpen, signal); return; }
    if (!await moveDoor(true, signal)) return;
    frameTape(); if (signal.aborted) return;
    if (name === "flip") {
      flipping = true; render();
      await flipCassette({element:$("#loaded-tape .cassette"), nextSide:transport.side === "A" ? "B" : "A", signal,
        reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,
        commit:()=>{ if(transport.flip()){counterZero=0;audio.sound("flip");persist();render();} }
      });
      if (!signal.aborted) { audio.sound("seat"); if (!wasOpen) await moveDoor(false, signal); }
    } else {
      render(); await ejectCassette({element:$("#loaded-tape .cassette"),signal,reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,
        commit:()=>{transport.eject();counterZero=0;audio.sound("seat");persist();render();} });
      if(!signal.aborted) message("Tape ejected. Choose your next tape from TAPE BOX.");
    }
  } finally { window.removeEventListener("resize",resized); flipping=false;servicePhase="";flipController=null; }
}
function cancelPlayback() {
  if (!playController) return;
  generation++;
  playController.abort();
  playController = null;
  busy = false;
  transport.stop();
  audio.setMode("stopped");
  render();
}
function dispatch(name) {
  if (["stop","door","flip","eject"].includes(name) && playController) {
    cancelPlayback();
    audio.sound("click");
    persist();
    if(name !== "stop") action(()=>control(name));
  } else
    action(() => {
      audio.sound("click");
      return control(name);
    });
}
$$("[data-action]").forEach(
  (b) => (b.onclick = () => dispatch(b.dataset.action)),
);
$$(".shelf-trigger").forEach(
  (b) =>
    (b.onclick = () => {
      renderShelf();
      $("#library-dialog").showModal();
    }),
);
$$(".close-dialog").forEach(
  (b) => (b.onclick = () => b.closest("dialog").close()),
);
$$("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
$("#about-open").onclick = () => $("#about-dialog").showModal();
$("#credits-open").onclick = () => $("#credits-dialog").showModal();
$("#import-open").onclick = () => {
  $("#library-dialog").close();
  $("#import-dialog").showModal();
};
$("#reset-counter").onclick = () => {
  counterZero = transport.position;
  render();
};
$("#volume").oninput = (e) => {
  audio.setVolume(e.target.value / 100);
  render();
};
$("#volume").onchange = persist;
$("#wear").oninput = (e) => {
  audio.setWear(e.target.value / 100);
  render();
};
$("#wear").onchange = persist;
$("#import-form").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  const form = e.target,
    status = $("#import-status"),
    submit = $(".import-submit");
  busy = true;
  submit.disabled = true;
  status.textContent = "Checking audio…";
  try {
    await audio.unlock();
    const a = form.elements.sideA.files[0],
      b = form.elements.sideB.files[0] || a;
    const id = `import-${Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) => n.toString(16).padStart(2, "0")).join("")}`,
      sides = {};
    for (const [side, file] of [
      ["A", a],
      ["B", b],
    ]) {
      if (!file || file.size > 30 * 1024 * 1024 || file.size === 0)
        throw new Error(
          "Choose a nonempty audio file up to 30 MB per side.",
        );
      let decoded;
      try {
        decoded = await audio.decode(`${id}-${side}`, await file.arrayBuffer());
      } catch {
        throw new Error(
          "Cannot play this audio. Try MP3, WAV, M4A or another supported format.",
        );
      }
      if (decoded.duration > 600)
        throw new Error("Choose audio up to 10 minutes per side.");
      sides[side] = {
        title: file.name.replace(/\.[^.]+$/, ""),
        duration: decoded.duration,
        blob: file,
        key: `${id}-${side}`,
      };
    }
    const title = form.elements.title.value.trim();
    if (!title) throw new Error("Enter a tape name.");
    const tape = {
      id,
      title,
      subtitle: "A mixtape of your own.",
      number: "MY",
      color: "#78668b",
      genre: "PERSONAL MIXTAPE",
      author: "YOUR COLLECTION",
      license: "LOCAL FILE",
      imported: true,
      sides,
    };
    try {
      await storeTape(tape);
    } catch {
      throw new Error(
        "Could not save. Check browser storage and private browsing settings.",
      );
    }
    tapes.push(tape);
    form.reset();
    status.textContent = "";
    $("#import-dialog").close();
    renderShelf();
    $("#library-dialog").showModal();
    message("Your mixtape is ready.");
  } catch (err) {
    status.textContent = err.message;
  } finally {
    busy = false;
    submit.disabled = false;
    render();
  }
};
document.addEventListener("keydown", (e) => {
  if (
    e.target.matches("input,textarea,select") ||
    (e.key === " " && e.target.closest("button,a")) ||
    $("dialog[open]") ||
    e.altKey ||
    e.ctrlKey ||
    e.metaKey
  )
    return;
  const commands = {
    ArrowLeft: "rewind",
    ArrowRight: "forward",
    s: "stop",
    e: "door",
    f: "flip",
    " ": transport.mode === "playing" ? "pause" : "play",
  };
  if (commands[e.key]) {
    e.preventDefault();
    dispatch(commands[e.key]);
  }
});
function advance() {
  const ended = transport.tick(audio.delta());
  if (ended) {
    audio.setMode("stopped");
    message("Click. End of tape.");
    persist();
  }
  return ended;
}
function interrupt() {
  flipController?.abort();
  cancelPlayback();
  advance();
  transport.stop();
  audio.setMode("stopped");
  persist();
  render();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) interrupt();
});
window.addEventListener("pagehide", () => {
  interrupt();
  persist();
});
setInterval(() => {
  advance();
  if (
    audio.ctx &&
    audio.ctx.state !== "running" &&
    transport.mode !== "stopped" &&
    !busy
  ) {
    transport.stop();
    audio.setMode("stopped");
    render();
  }
  if (transport.duration)
    audio.setSpoolPosition(transport.position / transport.duration);
  render();
}, 80);
setInterval(() => {
  if (transport.mode !== "stopped") persist();
}, 2500);
(async () => {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}audio/manifest.json`);
    if (!res.ok) throw new Error();
    const manifest = await res.json();
    for (const t of demos)
      for (const side of Object.values(t.sides)) {
        const entry = manifest.find((m) => m.file === `${side.file}.mp3`);
        if (entry) side.duration = entry.duration;
      }
  } catch {
    message(
      "Could not load the demo collection. Please reload.",
    );
  }
  try {
    tapes.push(...(await getImports()));
  } catch {
    message("Local audio storage is unavailable. Demo tracks are still playable.");
  }
  renderShelf();
  render();
})();
render();
