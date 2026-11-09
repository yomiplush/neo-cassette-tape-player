# NEO CASSETTE — NC-85

**少し不完全な音が、ちょうどいい。**

スマホのブラウザで動く、80年代をイメージしたオリジナルのカセットプレイヤー。サーバー処理・アカウント・外部音楽サービスは不要です。アプリ本体は **MIT**、同梱の6曲は **CC0 1.0** です。

![NEO NC-85](docs/screenshots/desktop.png)

## できること

- FLIPでテープが浮き上がり、厚みを見せながら180度反転して戻る専用アニメーション。動きを減らす設定にも対応。
- 角の塗装剥げ・日焼け・擦り傷・くすんだネジ・古いシールなど、使い込まれた筐体とテープ。質感は独自SVGで制作。
- 専用のテープ棚から挿し替え。3本のデモテープに、A/B面それぞれ異なる曲を収録。
- 再生、一時停止、停止、12倍速の早送り・巻き戻し、蓋の開閉、取り出し、手動のA/B面反転。
- 再生位置に応じたリール回転・テープ巻量、機械式風カウンターとリセット、端まで来ると自動停止。
- ヒス、ワウ・フラッター、帯域制限、飽和歪み、軽いドロップアウト。ボタンを押すたびに二段のカチカチ音。巻き取り中はモーター・歯車の脈動・軋み・擦れが連続し、巻量によって音程も変化します。すべてブラウザ内で合成。
- 劣化量とマスター音量の調整。劣化量を最小にしてもテープの音色は残ります。
- 自分の音源からテープを作成。名前・A/B面を指定し、IndexedDBに保存。ファイルをサーバーへ送信しません。
- テープ・面ごとの位置と音量・劣化設定を保存。テープ自体は再読み込み後に棚から選び直します。
- キーボード操作、ダイアログのフォーカス制御、動きを減らす設定への対応。

## 起動・ビルド

Node.js **22.12以上**（または20.19以上）を使用してください。推奨はNode 22 LTSです。

```bash
npm ci
npm run dev
```

表示されたURLを開きます。同じLANのスマホからは、開発PCのLAN IPと表示ポートを使用できます。

```bash
npm run build
npm run preview
```

公開ファイルは `dist/` に出力されます。Viteの相対パス設定によりサブディレクトリへの配置にも対応します。`file://` で直接開かず、HTTPサーバーを使用してください。

## Cloudflare Pages に手動デプロイ

このリポジトリを Pages の Git integration に接続し、以下を設定します。

| 設定 | 値 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | リポジトリルート |
| Environment variable | `NODE_VERSION=22` |

設定項目の参考：[Cloudflare Pages のビルド設定](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[Node.js バージョンの指定](https://developers.cloudflare.com/pages/configuration/build-image/)。

APIキー、Workers、データベース、サーバー用の環境変数は不要です。ビルド済み `dist/` をアップロードする Direct Upload でも配置できます。本作業では公開デプロイは行っていません。

## DEMO と Self-hosted の2種類

共通の音声・カセット処理を使い、用途別にビルドを分けています。既定の `npm run build` とCloudflare Pagesの設定は変更していません。

| 配布 | ビルド | 出力 | 特徴 |
| --- | --- | --- | --- |
| DEMO / Pages | `npm run build` または `npm run build:demo` | `dist/` | 作品紹介とプレイヤーの元のレイアウト |
| Self-hosted | `npm run build:selfhost` | `dist-selfhost/` | プレイヤー中心、スマホで操作キーを下部固定、横持ち用の2カラム配置 |

どちらもウェザリング、FLIPアニメーション、機械音の改善を含みます。別々のブランチに複製せず、同じソースの配布プロファイルとして管理します。

## セルフホスト版の起動

Docker + Compose v2以降が使える環境では：

```bash
git clone https://github.com/yomiplush/neo-cassette-tape-player.git
cd neo-cassette-tape-player
docker compose up -d --build
```

PCで `http://localhost:8080`、同じLANのスマホで `http://サーバーのLANアドレス:8080` を開きます。ポート変更は `NEO_PORT=8090 docker compose up -d --build`。終了は `docker compose down`。

Dockerfileは既定で **Self-hosted版** をビルドします。nginxで静的配信し、圧縮・音源のキャッシュ・ヘルスチェックを設定済みです。更新は `git pull` の後に `docker compose up -d --build` を実行してください。

Dockerを使わない場合は：

```bash
npm ci
npm run build:selfhost
npm run preview:selfhost -- --port 8080
```

継続運用では任意の静的Webサーバーで **`dist-selfhost/`** を公開してください。開発時は `npm run dev:selfhost`、DEMOは `npm run dev` です。HTTPSのリバースプロキシの後ろでも利用できます。スマホのLAN HTTPでも取り込み処理が動くよう、secure context専用の `randomUUID` に依存していません。

**音源の保存先はどちらも端末内のブラウザです。** Self-hosted版はサーバーへのアップロードや端末間同期を追加するものではありません。利用端末・ブラウザ・アクセス元URLを変えると別の保存領域になります。デモ6曲はサーバーから配信します。通常のビルド時に外部から音源を取得しません。

スマホ向けには、320px幅・小さい縦画面・横持ちを対象に、44px以上の操作キー、セーフエリア、スクロール中も使える操作部、回転時の再配置、画面に収まるテープ棚と取り込み画面を用意しています。FLIP時はテープが見える位置に画面を合わせます。途中で画面を離れたり向きを変えたりしたときも操作ロックを解除します。

<img src="docs/screenshots/selfhost-mobile.png" alt="Self-hosted版のスマホ画面" width="320">

Docker単独の場合は `docker build -t neo-cassette .`、`docker run --rm -p 8080:80 neo-cassette`。DEMO用のコンテナを明示的に作る場合は `docker build --build-arg PLAYER_EDITION=demo -t neo-cassette-demo .` です。

## 使い方

1. **テープ棚 → このテープを入れる**。蓋が開き、テープが入り、閉じます。
2. **▶** で再生。**Ⅱ** で一時停止・再開、**■** で停止。停止しても位置は戻りません。
3. **◀◀ / ▶▶** は12倍速の巻き取り。押し続ける必要はありません。**■** で停止します。巻き取り中は音楽ではなくモーター・ヒス・軋みが鳴ります。
4. 反対側を聴くときは **■ → OPEN → FLIP → CLOSE → ▶**。
5. **EJECT** は蓋が開いているときに使えます。再生・巻き取り・一時停止中は先に **■** を押してください。
6. **RESET** はカウンター表示だけをゼロにします。音源の位置は変わりません。
7. 自分の音源は **テープ棚 → 自分だけのテープを作る**。各面30MB・10分まで。B面省略時はA面の曲を両面に収録。取り出した後、棚の **×** で削除できます。

キーボード：`Space` 再生/一時停止、`←` 巻き戻し、`→` 早送り、`S` 停止、`E` 蓋、`F` 裏返す。フォームやダイアログを操作中はショートカットを抑止します。

## 音声とブラウザについて

最初の操作でAudioContextを有効にします。クリアな音へのバイパスは設けていません。実在の特定機種の回路測定に基づくエミュレータではなく、カセットらしい聴感を作るシミュレーションです。録音・テープへの書き込み・ノイズリダクション規格の再現はありません。

- 音楽：入力ゲイン → 65Hzハイパス → tanh飽和 → 3.5–7.3kHzローパス → LFO変調ディレイ → ドロップアウト → 再生エンベロープ。
- 巻き取りは3つの発振器・17.5Hzの歯車変調・帯域ノイズを重ね、巻量と方向で音程を変化。停止では素早くフェードアウト。独立した高域ノイズとモーター音を加算し、機械音とともにマスター音量 → 出力リミッターへ。
- 約0.73Hzのワウ、7.6Hzのフラッター。4.2秒ごとに軽い音抜け。最小劣化でも非ゼロの帯域制限・ノイズ・変調を維持。
- デコード済みキャッシュは最大2音源、合計80MiBを超える場合は古い音源を破棄します。ただし単一音源は再生に必要な全体をデコードするため、長いファイルほど一時的なメモリ使用量が増えます。
- タブ切り替え・画面ロックでは停止する設計です。バックグラウンド再生は保証しません。読み込み中の **■** はキャンセル、通信待ちは25秒でタイムアウトします。
- MP3/WAV/M4A等の対応はブラウザのデコーダー次第です。SafariではOGG等が使えない場合があります。
- 取り込み音源は端末間で同期しません。サイトデータ削除・ブラウザの容量整理で消える可能性があります。元の音源ファイルは手元に保管してください。

## 音源・ライセンス

アプリのソースは [MIT](LICENSE)。デモ音源は **MITへの変更を行わず、原作者のCC0 1.0を保持**しています。MITアプリへの同梱が可能なパブリックドメイン提供音源を選びました。

取得元は [uncle-sheepsky/duru-ai-cc0-bgm](https://github.com/uncle-sheepsky/duru-ai-cc0-bgm)、固定コミット `c801be93348701ac65442769b1841e9ccba67c4e`。6曲とも同リポジトリで **original / pure（外部サンプルなしのコード合成）** と明記された曲です。

| テープ | 面 | 収録ファイル | 時間 |
| --- | --- | --- | --- |
| AFTER HOURS | A | hyak-ep1-rhythm | 2:40 |
| AFTER HOURS | B | hyak-ep3-suika | 2:40 |
| OUTER SIGNAL | A | hyak-ep4-blackhole | 2:38 |
| OUTER SIGNAL | B | hyak-ep6-galaxy | 2:40 |
| SUNDAY RADIO | A | hyak-ep5-2048 | 2:40 |
| SUNDAY RADIO | B | duru-ai-ep2-music | 2:00 |

テープ名は本アプリ独自の編集タイトルです。原作者のREADME・CC0全文・生成コードは `vendor/duru-ai/`、配信するCC0全文は `public/licenses/` に同梱。取得元と変換後のSHA-256は `public/audio/manifest.json` に記録しています。容量節約のため元の320kbpsから128kbps MP3へ変換し、再生時の劣化は音声エンジンで加えます。音源合計は約15MBです。

再取得・再変換する場合のみ、GitとPythonとffmpegを用意して実行します：

```bash
git clone https://github.com/uncle-sheepsky/duru-ai-cc0-bgm.git /tmp/duru-ai
cd /tmp/duru-ai
git checkout c801be93348701ac65442769b1841e9ccba67c4e
# 本リポジトリへ戻ってから：
python scripts/prepare-audio.py /tmp/duru-ai
```

実在メーカーの名称・ロゴ・商品画像、参照写真は配布物に含めていません。外部Webフォント、CDN、解析タグも使用しません。開発依存関係の許諾は `THIRD_PARTY_NOTICES.md` を参照してください。

## 検証

```bash
npm test
npx playwright install chromium
npm run test:browser
npm run test:selfhost
npm run build:demo
npm run build:selfhost
```

FLIPの反転と操作ロック/動きの軽減、連続巻き取り音の実レンダリング、Self-hosted版の320–1024px縦横画面・固定キー・ダイアログ、トランスポートの境界・位置記憶、モバイルの挿入/再生/巻き取り/反転/取り出し、音源取り込み/保存/削除、不正ファイル、6曲の実デコード、画面幅320–1440px、ロード中のキャンセル/画面離脱、Web Audioの実レンダリングを確認します。ブラウザ自動テストはChromiumです。実機iPhone/Androidでの実聴・OS割り込みの網羅検証は別途必要です。

GitHub Actions 用の設定例は `docs/ci-check.example.yml` に同梱しています。必要ならご自身で `.github/workflows/check.yml` へコピーして有効にしてください。今回使用したGitHub接続には workflow 権限がないため、自動実行は有効化していません。

## 構成

- `src/transport.js` — 音声やDOMに依存しないトランスポート
- `src/flip.js` — 二面の立体反転、表示位置と後処理
- `src/assets/` — 独自の筐体・テープのウェザリングSVG
- `src/audio.js` — Web Audio、音源キャッシュ、カセット効果と機械音
- `src/library.js` — デモ定義、設定保存、IndexedDB
- `src/main.js` — UIと操作、読み込みキャンセル、ライフサイクル
- `src/style.css` — 独自デザイン、スマホ表示、動きの軽減
- `compose.yml` / `deploy/nginx.conf` — Self-hosted版の静的配信
- `public/audio/` — 同梱デモ、ハッシュと時間のマニフェスト
