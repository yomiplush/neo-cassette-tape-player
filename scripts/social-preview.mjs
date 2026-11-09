import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
await page.goto(process.env.NEO_PREVIEW_URL || 'http://127.0.0.1:5173');
await page.getByRole('button',{name:'Open tape collection'}).click();
await page.locator('.load-tape').first().click();
await page.waitForTimeout(4700);
await page.evaluate(() => {
 // A clone has no live viewport observer, so exporting cannot shrink the model.
 const device = document.querySelector('.device-area').cloneNode(true);
 document.body.replaceChildren();
 document.body.style.cssText='margin:0;width:1200px;height:630px;overflow:hidden;background:#e9e1cb;color:#294b43;position:relative;';
 const copy=document.createElement('div');
 copy.style.cssText='position:absolute;left:60px;top:105px;width:420px;font-family:sans-serif;';
 copy.innerHTML='<div style="font-size:18px;letter-spacing:5px;font-weight:700">NEO FIELD STEREO / NC-85</div><div style="font-size:60px;line-height:1.4;font-weight:900;margin-top:32px">Back to<br>the sound.</div><div style="font-size:19px;line-height:1.9;margin-top:28px">Press play. Flip the tape.<br>Keep the hiss. Feel the wobble.</div><div style="font-size:12px;margin-top:32px;letter-spacing:1px">neo-cassette-tape-player-demo.yomiplush.dev</div>';
 device.style.cssText='position:absolute;top:64px;left:650px;width:400px;height:500px;max-width:none;max-height:none;padding:0;transform:rotate(4deg);margin:0;';
 document.body.append(copy,device);
});
await page.screenshot({path:'public/social/neo-cassette.png'});
await browser.close();
