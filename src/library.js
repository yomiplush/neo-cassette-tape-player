const base = import.meta.env.BASE_URL;
export const demos = [
  {
    id: "neon",
    title: "AFTER HOURS",
    subtitle: "The city sleeps. The tape keeps turning.",
    color: "#d2683c",
    number: "01",
    genre: "ARCADE / ELECTRONIC",
    sides: {
      A: { title: "Rhythm", file: "hyak-ep1-rhythm", duration: 160 },
      B: { title: "Suika", file: "hyak-ep3-suika", duration: 160 },
    },
  },
  {
    id: "orbit",
    title: "OUTER SIGNAL",
    subtitle: "Small signals from a distant orbit.",
    color: "#547e76",
    number: "02",
    genre: "SPACE / SYNTH",
    sides: {
      A: { title: "Blackhole", file: "hyak-ep4-blackhole", duration: 158 },
      B: { title: "Galaxy", file: "hyak-ep6-galaxy", duration: 160 },
    },
  },
  {
    id: "daylight",
    title: "SUNDAY RADIO",
    subtitle: "For an afternoon with nothing to do.",
    color: "#bd9148",
    number: "03",
    genre: "CODE / GROOVE",
    sides: {
      A: { title: "2048", file: "hyak-ep5-2048", duration: 160 },
      B: { title: "Music from Code", file: "duru-ai-ep2-music", duration: 120 },
    },
  },
].map((t) => ({
  ...t,
  author: "DURU-AI",
  license: "CC0 1.0",
  sides: Object.fromEntries(
    Object.entries(t.sides).map(([s, v]) => [
      s,
      { ...v, url: `${base}audio/${v.file}.mp3` },
    ]),
  ),
}));
export function readSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("neo-cassette") || "{}");
    return s && typeof s === "object" ? s : {};
  } catch {
    return {};
  }
}
export function saveSettings(data) {
  try {
    localStorage.setItem("neo-cassette", JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
let database;
function db() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const req = indexedDB.open("neo-cassette-library", 1);
      req.onupgradeneeded = () =>
        req.result.createObjectStore("tapes", { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return database;
}
async function transaction(mode, action) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("tapes", mode),
      req = action(tx.objectStore("tapes"));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const getImports = () =>
  transaction("readonly", (store) => store.getAll());
export const storeTape = (tape) =>
  transaction("readwrite", (store) => store.put(tape));
export const deleteTape = (id) =>
  transaction("readwrite", (store) => store.delete(id));
