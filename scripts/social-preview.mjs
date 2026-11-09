import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
await page.goto(process.env.NEO_PREVIEW_URL || 'http://127.0.0.1:5173');
await page.getByRole('button',{name:'テープ棚を開く'}).click();
await page.locator('.load-tape').first().click();
await page.waitForTimeout(4700);
await page.evaluate(() => {
 const player = document.querySelector('#player');
 document.body.replaceChildren();
 document.body.style.cssText='margin:0;width:1200px;height:630px;overflow:hidden;background:#e9e1cb;color:#294b43;position:relative;';
 const copy=document.createElement('div');
 copy.style.cssText='position:absolute;left:60px;top:105px;width:420px;font-family:sans-serif;';
 copy.innerHTML='<div style="font-size:18px;letter-spacing:5px;font-weight:700">NEO CASSETTE / NC-85</div><div style="font-size:60px;line-height:1.4;font-weight:900;margin-top:32px">あの頃の<br>音へ。</div><div style="font-size:19px;line-height:1.9;margin-top:28px">カチッと押して、テープを裏返す。<br>ノイズも、揺らぎも、そのままに。</div><div style="font-size:12px;margin-top:32px;letter-spacing:1px">neo-cassette-tape-player-demo.yomiplush.dev</div>';
 player.style.cssText='position:absolute;top:55px;left:540px;width:570px;transform:rotate(4deg);margin:0;';
 document.body.append(copy,player);
});
await page.screenshot({path:'public/social/neo-cassette.png'});
await browser.close();
