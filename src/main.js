import "./style.css";
import { TapeTransport } from "./transport.js";
import { CassetteAudio } from "./audio.js";
import { flipCassette } from "./flip.js";
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
<header class="site-header"><a class="wordmark" href="./" aria-label="NEO CASSETTE ホーム">NEO<span>CASSETTE</span></a><span class="header-note">ANALOG FEELING. DIGITAL SOUL.</span><button class="shelf-trigger" aria-label="テープ棚を開く"><span class="shelf-icon">▤</span> テープ棚 <span class="count">03</span></button></header>
<main>
 <section class="intro"><div><div class="eyebrow"><span class="tiny-dot"></span> PERSONAL STEREO / EST. 1985</div><h1>少し不完全な音が、<br><em>ちょうどいい。</em></h1></div><p>テープを選ぶ。ボタンを押す。<br>ノイズも、揺らぎも、あの頃のまま。<br><span>A little hiss. A lot of feeling.</span></p></section>
 <section class="listening-space" aria-label="カセットプレイヤー">
 <div class="device-area"><div class="device-top"><span>PHONES <span class="jack">●</span></span><div class="top-ridges"></div><span>DC 3V <b>⊖</b></span></div>
 <div class="player" id="player">
  <i class="case-screw tl"></i><i class="case-screw tr"></i><i class="case-screw bl"></i><i class="case-screw br"></i>
  <div class="device-brand"><div class="neo-logo">NEO<span>PORTABLE CASSETTE PLAYER</span></div><div class="model-number">NC-85<span>STEREO</span></div></div>
  <div class="door-surround"><div class="door" id="door"><div class="window-top"><span>PRECISION TAPE TRANSPORT</span><span class="direction">▸</span></div><div class="deck-window"><div class="empty-deck"><span>○ &nbsp; ○</span><small>OPEN. INSERT. PLAY.</small></div><div id="loaded-tape">${cassette()}</div></div><div class="door-bottom"><span>FULL AUTO STOP</span><span>↗ OPEN</span></div></div><div class="door-edge"></div></div>
  <div class="readout"><div class="counter-wrap"><span class="micro-label">TAPE COUNTER</span><div class="counter-line"><output id="counter">000</output><button id="reset-counter" aria-label="カウンターをリセット">RESET</button></div></div><div class="signal-wrap"><div class="signal-label"><span class="led" id="led"></span><span id="status" role="status">NO TAPE</span></div><div class="vu-meter" aria-label="音量レベル">${"<i></i>".repeat(12)}</div><div class="vu-scale"><span>−20</span><span>−10</span><span>0</span><span>+3</span></div></div></div>
  <div class="transport-labels"><span>REW</span><span>F.FWD</span><span>STOP</span><span>PLAY</span><span>PAUSE</span></div>
  <div class="transport"><button data-action="rewind" aria-label="巻き戻し"><span>◀◀</span></button><button data-action="forward" aria-label="早送り"><span>▶▶</span></button><button data-action="stop" aria-label="停止"><span>■</span></button><button data-action="play" class="play-key" aria-label="再生"><span>▶</span></button><button data-action="pause" aria-label="一時停止"><span>Ⅱ</span></button></div>
  <div class="device-footer"><span class="stereo-bars">▥</span><span>FEEL THE TAPE.</span><span class="serial">N° 008519</span></div>
 </div><div class="device-bottom"><span>HIGH FIDELITY? &nbsp; NOT QUITE.</span><div class="bottom-ridges"></div></div><div class="device-shadow"></div>
 <div class="deck-actions"><button data-action="door" aria-label="蓋を開閉">⏏ <span>OPEN / CLOSE</span></button><button data-action="flip" aria-label="A/B面を裏返す">↻ <span>FLIP A / B</span></button><button data-action="eject" aria-label="テープを取り出す">↗ <span>EJECT TAPE</span></button></div>
 </div>
 <aside class="liner"><div class="liner-heading"><span>NOW ON DECK</span><span class="live-dot"></span></div><div class="liner-empty" id="liner-empty"><span class="outline-tape">▱</span><h2>どのテープにする？</h2><p>棚から一本、選んでみてください。<br>今日の気分に合う音があるはず。</p><button class="shelf-trigger primary">テープを選ぶ <span>↗</span></button></div><div id="liner-loaded" hidden><div class="track-category" id="track-category"></div><h2 id="current-title"></h2><p class="liner-subtitle" id="current-subtitle"></p><div class="side-row"><span>SIDE <b id="side-label">A</b></span><span id="track-time">00:00 / 00:00</span></div><div class="position-track"><div id="position-fill"></div></div><div class="track-info"><strong id="track-name"></strong><span id="track-author"></span></div><p class="tape-note">曲を飛ばす代わりに、巻き戻す。<br>反対の面は、蓋を開けて裏返して。</p></div>
 <div class="sound-controls"><div class="control-heading"><h3>THE ANALOG TOUCH</h3><button id="about-open" aria-label="プレイヤーの使い方">ⓘ</button></div><label class="slider-label" for="volume"><span>VOLUME</span><output id="volume-value">65</output></label><input type="range" id="volume" min="0" max="100" value="${audio.volume * 100}" aria-label="マスター音量"><div class="slider-label wear-label"><label for="wear">TAPE WEAR <span>テープのくたびれ具合</span></label><output id="wear-value">50</output></div><input type="range" id="wear" min="0" max="100" value="${audio.wear * 100}" aria-label="テープの劣化量"><div class="wear-scale"><span>WELL-LOVED</span><span>FOUND IN THE ATTIC</span></div><div class="sound-tags"><span>HISS</span><span>WOW & FLUTTER</span><span>WARMTH</span></div></div>
 </aside></section>
 <section class="bottom-note"><span>01 — PUT THE WORLD ON PAUSE.</span><p>巻き戻した時間まで、好きになる。</p><span>DESIGNED FOR SLOW LISTENING.</span></section>
</main><footer class="site-footer"><span>NEO CASSETTE <span>— A SMALL TRIP BACK.</span></span><button id="credits-open">CREDITS & LICENSES ↗</button></footer>
<dialog id="library-dialog" aria-labelledby="library-heading"><div class="dialog-header"><div><div class="eyebrow">THE COLLECTION</div><h2 id="library-heading">あなたのテープ棚<span id="tape-total">03 TAPES</span></h2></div><button class="close-dialog" aria-label="テープ棚を閉じる">×</button></div><p class="dialog-intro">一本選んで、今日のサウンドトラックに。</p><div id="tape-grid" class="tape-grid"></div><button id="import-open" class="import-button"><b>＋</b><span>自分だけのテープを作る<small>音源ファイルから A / B 面を作成</small></span><span>↗</span></button><p class="library-note">DEMO COLLECTION · 6 ORIGINAL TRACKS BY DURU-AI · CC0<br>取り込んだ音源は、このブラウザの中だけに保存されます。</p></dialog>
<dialog id="import-dialog" aria-labelledby="import-heading"><form id="import-form"><div class="dialog-header"><div><div class="eyebrow">MAKE A MIXTAPE</div><h2 id="import-heading">音楽に、居場所を。</h2></div><button type="button" class="close-dialog" aria-label="取り込み画面を閉じる">×</button></div><p class="dialog-intro">A面とB面に一曲ずつ。あなたの音源を一本のテープに。</p><label class="form-label">テープの名前<input name="title" maxlength="40" placeholder="例：帰り道のミックス" required></label><label class="form-label file-label">SIDE A <span>必須</span><input name="sideA" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" required></label><label class="form-label file-label">SIDE B <span>省略するとA面を両面に収録</span><input name="sideB" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"></label><p class="form-hint">各面 30 MB・10分まで。MP3 / WAV / M4A など、ブラウザが再生できる形式。サーバーへの送信はありません。</p><button class="primary import-submit" type="submit">テープを作る <span>↗</span></button><p id="import-status" role="status"></p></form></dialog>
<dialog id="about-dialog" aria-labelledby="about-heading"><div class="dialog-header"><div><div class="eyebrow">OWNER'S MANUAL</div><h2 id="about-heading">少し、手間を楽しもう。</h2></div><button class="close-dialog" aria-label="説明を閉じる">×</button></div><div class="manual"><p><b>01 / テープを選ぶ</b>棚から選ぶと、蓋が開いてテープが入ります。交換は停止してから。</p><p><b>02 / ボタンを押す</b>▶ で再生。Ⅱ で一時停止。◀◀ / ▶▶ は12倍速で巻き取り、■ で停止。終端ではカチッと自動停止します。</p><p><b>03 / 裏返す</b>■ → OPEN → FLIP → CLOSE。A/B面ごとの位置を記憶します。RESET はカウンター表示だけをゼロにします。</p><p><b>04 / くたびれ具合を選ぶ</b>ヒス、音の揺れ、高域の丸み、歪み、軽い音抜けを再現。劣化量が最小でもテープらしさは残ります。</p><p>キーボード：Space 再生 / 一時停止、← / → 巻き取り、S 停止、E 蓋、F 裏返す。スマホでは最初の操作で音声を有効にします。画面を離れると停止し、戻ったら手動で再生できます。</p><p class="form-hint">架空の機種を表現したシミュレーションです。録音機能や実在機の全機能を再現するものではありません。</p></div></dialog>
<dialog id="credits-dialog" aria-labelledby="credits-heading"><div class="dialog-header"><div><div class="eyebrow">MADE WITH RESPECT</div><h2 id="credits-heading">Credits & licenses</h2></div><button class="close-dialog" aria-label="クレジットを閉じる">×</button></div><div class="manual"><p><b>PLAYER / MIT</b>© 2026 YomiPlush. NEO NC-85 は独自のデザインです。参照写真、実在メーカーのロゴ、製品画像は同梱していません。</p><p><b>MUSIC / CC0 1.0</b>6曲のデモ音源は DURU-AI / uncle-sheepsky のオリジナル楽曲。公開リポジトリから取得し、128 kbps MP3 に変換しています。曲名・作者・元の許諾を保持しています。</p><p><a href="https://github.com/uncle-sheepsky/duru-ai-cc0-bgm" target="_blank" rel="noopener noreferrer">音源のソースリポジトリ ↗</a><br><a href="${import.meta.env.BASE_URL}licenses/DURU-CC0.txt" target="_blank" rel="noopener noreferrer">音源の CC0 ライセンス全文 ↗</a></p><p>テープのタイトルは、このプレイヤー独自の編集タイトルです。収録曲の正式タイトルは再生画面と棚に表示しています。取り込み音源の権利は元の権利者に帰属します。</p><p><a href="https://github.com/yomiplush/neo-cassette-tape-player" target="_blank" rel="noopener noreferrer">NEO CASSETTE / GitHub ↗</a></p></div></dialog>
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
      "再生位置を保存できませんでした。ブラウザの保存容量を確認してください。",
    );
}
function renderShelf() {
  $("#tape-total").textContent =
    `${String(tapes.length).padStart(2, "0")} TAPES`;
  $(".count").textContent = String(tapes.length).padStart(2, "0");
  $("#tape-grid").innerHTML = tapes
    .map(
      (t) =>
        `<article class="tape-card" style="--tape-color:${t.color}"><div class="sleeve"><div class="sleeve-number">NEO / ${esc(t.number)}</div>${cassette(true)}<div class="sleeve-caption">A LITTLE HISS. A LOT OF FEELING.</div></div><div class="tape-card-title"><h3>${esc(t.title)}</h3><span>${time(t.sides.A.duration + t.sides.B.duration)}</span></div><p>A · ${esc(t.sides.A.title)}<br>B · ${esc(t.sides.B.title)}</p><div class="card-actions"><button class="load-tape" data-id="${esc(t.id)}">${transport.tape?.id === t.id ? "挿入済み" : "このテープを入れる"} <span>↗</span></button>${t.imported ? `<button class="delete-tape" data-id="${esc(t.id)}" aria-label="${esc(t.title)}を削除">×</button>` : ""}</div></article>`,
    )
    .join("");
  $$("#tape-grid .cassette").forEach((el, i) => {
    el.querySelector(".tape-title").textContent = tapes[i].title;
  });
  $$(".load-tape").forEach(
    (b) =>
      (b.onclick = () =>
        action(async () => {
          if (transport.mode !== "stopped")
            return message("先に ■ STOP を押して、テープを止めてください。");
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
          message("テープをセットしました。▶ で再生。");
          persist();
        })),
  );
  $$(".delete-tape").forEach(
    (b) =>
      (b.onclick = () =>
        action(async () => {
          if (transport.tape?.id === b.dataset.id)
            return message("取り出してから削除してください。");
          await deleteTape(b.dataset.id);
          tapes = tapes.filter((t) => t.id !== b.dataset.id);
          delete transport.memory[b.dataset.id];
          persist();
          renderShelf();
          message("テープを棚から削除しました。");
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
  $("#status").textContent = flipping
    ? "FLIPPING…"
    : busy
      ? "LOADING…"
      : !t
        ? "NO TAPE"
        : names[mode];
  $("#player").classList.toggle("flipping", flipping);
  $$(".shelf-trigger").forEach((b) => (b.disabled = flipping));
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
      (busy && !(a === "stop" && playController)) ||
      (["play", "pause", "rewind", "forward"].includes(a) &&
        (!t || transport.open)) ||
      (["flip", "eject"].includes(a) && (!t || !transport.open));
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
      message(e.message || "操作できませんでした。もう一度お試しください。");
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
    return message("テープを入れて、蓋を閉じてください。");
  if (transport.position >= transport.duration)
    return message("テープの終端です。巻き戻すか、裏返してください。");
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
          "読み込みがタイムアウトしました。接続を確認して、もう一度再生してください。",
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
      audio.sound("squeak");
    }
  }
  if (name === "door") {
    if (transport.door()) audio.sound("door");
    else message("先に ■ STOP を押すと、蓋が開きます。");
  }
  if (name === "flip") {
    if (!transport.tape || !transport.open) return;
    const tapeBounds = $("#loaded-tape .cassette").getBoundingClientRect();
    const pocket =
      import.meta.env.MODE === "selfhost" &&
      matchMedia(
        "(max-width: 900px), (max-width: 1100px) and (max-height: 500px)",
      ).matches;
    const availableHeight = pocket
      ? $(".transport-labels").getBoundingClientRect().top - 12
      : innerHeight - 15;
    if (tapeBounds.top < 100 || tapeBounds.bottom > availableHeight) {
      window.scrollBy(
        0,
        tapeBounds.top -
          Math.max(100, (availableHeight - tapeBounds.height) / 2),
      );
    }
    flipping = true;
    const controller = new AbortController();
    flipController = controller;
    render();
    const resized = () => controller.abort();
    window.addEventListener("resize", resized);
    try {
      await flipCassette({
        element: $("#loaded-tape .cassette"),
        nextSide: transport.side === "A" ? "B" : "A",
        signal: controller.signal,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        commit: () => {
          if (transport.flip()) {
            counterZero = 0;
            audio.sound("flip");
            persist();
            render();
          }
        },
      });
      if (!controller.signal.aborted) audio.sound("seat");
    } finally {
      window.removeEventListener("resize", resized);
      flipping = false;
      flipController = null;
    }
  }
  if (name === "eject") {
    if (transport.eject()) {
      audio.sound("door");
      counterZero = 0;
      persist();
      message("テープを取り出しました。棚から次の一本を。");
    }
  }
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
  if (name === "stop" && playController) {
    cancelPlayback();
    audio.sound("click");
    persist();
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
  status.textContent = "音源を確認しています…";
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
          "各面は 0 バイトより大きく、30 MB 以下の音源を選んでください。",
        );
      let decoded;
      try {
        decoded = await audio.decode(`${id}-${side}`, await file.arrayBuffer());
      } catch {
        throw new Error(
          "再生できない音源です。MP3 / WAV / M4A など別の形式を試してください。",
        );
      }
      if (decoded.duration > 600)
        throw new Error("各面10分までの音源を選んでください。");
      sides[side] = {
        title: file.name.replace(/\.[^.]+$/, ""),
        duration: decoded.duration,
        blob: file,
        key: `${id}-${side}`,
      };
    }
    const title = form.elements.title.value.trim();
    if (!title) throw new Error("テープの名前を入力してください。");
    const tape = {
      id,
      title,
      subtitle: "あなただけの、一本。",
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
        "保存できませんでした。ブラウザの保存容量やプライベートモードを確認してください。",
      );
    }
    tapes.push(tape);
    form.reset();
    status.textContent = "";
    $("#import-dialog").close();
    renderShelf();
    $("#library-dialog").showModal();
    message("あなただけのテープができました。");
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
    audio.sound("click");
    message("カチッ。テープの端まで来ました。");
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
      "デモ音源の一覧を読み込めませんでした。再読み込みをお試しください。",
    );
  }
  try {
    tapes.push(...(await getImports()));
  } catch {
    message("取り込み音源の保存機能を利用できません。デモ曲は再生できます。");
  }
  renderShelf();
  render();
})();
render();
