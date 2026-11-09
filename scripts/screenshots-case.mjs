import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844}});
await mkdir('docs/screenshots',{recursive:true});
await page.goto(process.env.NEO_DEMO_PREVIEW_URL || 'http://127.0.0.1:5173');
await page.getByRole('button',{name:'Open tape collection'}).click();
await page.locator('.load-tape').first().click();
await page.waitForTimeout(4700);
for(const skin of ['harbor','silver','midnight','signal','ivory']){
  await page.getByRole('button',{name:'Open settings'}).click();
  await page.locator('#case-skin').selectOption(skin);
  await page.getByRole('button',{name:'Back to the deck'}).click();
  await page.locator('#settings-curtain').waitFor({state:'hidden'});
  await page.screenshot({path:`docs/screenshots/skin-${skin}.png`});
}
await page.getByRole('button',{name:'Rotate player'}).focus();
for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
await page.screenshot({path:'docs/screenshots/case-back.png'});
await page.getByRole('button',{name:'Return player to front'}).click();
await page.getByRole('button',{name:'Open settings'}).click();
await page.waitForTimeout(650);
await page.screenshot({path:'docs/screenshots/settings-curtain.png'});
await browser.close();
