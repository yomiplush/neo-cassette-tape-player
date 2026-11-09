import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const site = (env.VITE_SITE_URL || (mode === "selfhost" ? "" : "https://neo-cassette-tape-player-demo.yomiplush.dev")).replace(/\/$/, "");
  const description = "カチッと押して、テープを裏返す。ノイズも、揺らぎも、あの頃のまま。ブラウザで楽しむ80年代のカセットプレイヤー。";
  const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const meta = (property, content) => `<meta ${property.startsWith("twitter:") ? "name" : "property"}="${property}" content="${escape(content)}">`;
  return {
    base: "./",
    build: { outDir: mode === "selfhost" ? "dist-selfhost" : "dist" },
    plugins: [{ name: "social-preview", transformIndexHtml(html) {
      const tags = [
        meta("og:type", "website"), meta("og:locale", "ja_JP"),
        meta("og:site_name", "NEO CASSETTE"),
        meta("og:title", "NEO CASSETTE — あの頃の音へ。"),
        meta("og:description", description),
        meta("twitter:card", "summary_large_image"),
        meta("twitter:title", "NEO CASSETTE — あの頃の音へ。"),
        meta("twitter:description", description),
      ];
      if (site) tags.push(`<link rel="canonical" href="${escape(site)}/">`, meta("og:url", `${site}/`),
        meta("og:image", `${site}/social/neo-cassette.png`),
        meta("og:image:width", "1200"), meta("og:image:height", "630"),
        meta("og:image:type", "image/png"),
        meta("og:image:alt", "使い込まれた青いNEO NC-85カセットプレイヤー"),
        meta("twitter:image", `${site}/social/neo-cassette.png`),
        meta("twitter:image:alt", "使い込まれた青いNEO NC-85カセットプレイヤー"));
      return html.replace("</head>", `${tags.join("\n")}\n</head>`);
    } }],
  };
});
