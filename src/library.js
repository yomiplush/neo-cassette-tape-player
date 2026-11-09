const base = import.meta.env.BASE_URL;
export const demos = [
  {
    id: "shrine-afterglow", title: "SHRINE AFTERGLOW",
    subtitle: "Lantern light, long shadows, a quieter world.",
    color: "#b97a52", number: "01", genre: "SHRINE / ATMOSPHERIC",
    sides: {
      A: { title: "Ethereal Sanctuary", file: "shrine-ethereal-sanctuary", duration: 173.568 },
      B: { title: "Ethereal Sanctuary / Take 2", file: "shrine-ethereal-sanctuary-take-2", duration: 171.797 },
    },
  },
  {
    id: "pillow-radio", title: "PILLOW RADIO",
    subtitle: "Soft corners for slow afternoons.",
    color: "#b88b93", number: "02", genre: "COZY / DAYDREAM",
    sides: {
      A: { title: "Lost Inari", file: "cozy-lost-inari", duration: 173.419 },
      B: { title: "Our Squishy Dreams", file: "cozy-our-squishy-dreams", duration: 173.589 },
    },
  },
  {
    id: "midnight-circuit", title: "MIDNIGHT CIRCUIT",
    subtitle: "Cool lights and a booth past midnight.",
    color: "#648c99", number: "03", genre: "COOL / AFTER DARK",
    sides: {
      A: { title: "Corner Booth", file: "cool-corner-booth", duration: 178.240 },
      B: { title: "Infosec", file: "cool-infosec", duration: 168.085 },
    },
  },
].map((t) => ({
  ...t, author: "MobileAmbience", license: "Creator-supplied",
  sides: Object.fromEntries(Object.entries(t.sides).map(([s,v]) => [s,{...v,url:`${base}audio/${v.file}.mp3`}]))
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
