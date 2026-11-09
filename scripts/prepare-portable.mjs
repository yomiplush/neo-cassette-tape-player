// Rasterize the existing original case material, without live UI or a running renderer.
import {chromium} from '@playwright/test';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const temp=await mkdtemp(join(tmpdir(),'neo-portable-'));
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.goto(process.env.NEO_PREVIEW_URL || 'http://127.0.0.1:5173');
  await page.locator('#render-quality').selectOption('high');
  await page.addStyleTag({content:'.device-area.fixed-geometry{transform:none!important;top:0!important;left:0!important}.case-object,.case-front{transform:none!important}.case-back,.case-side{display:none!important}.case-front>*{visibility:hidden!important}'});
  await mkdir('public/textures',{recursive:true});
  for(const skin of ['harbor','silver','midnight','signal','ivory']) {
    await page.locator('#case-skin').selectOption(skin);
    const png=join(temp,`${skin}.png`);
    await page.locator('#player').screenshot({path:png});
    execFileSync('ffmpeg',['-v','error','-y','-i',png,'-c:v','libwebp','-quality','72',`public/textures/portable-shell-${skin}.webp`]);
  }
} finally {await browser.close();await rm(temp,{recursive:true,force:true});}
