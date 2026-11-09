// Rasterize original material artwork only; native text and controls stay sharp.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage();
const base=process.env.NEO_DEMO_PREVIEW_URL || 'http://127.0.0.1:5173';
await page.goto(base);
await mkdir('public/textures',{recursive:true});
for(const name of ['shell-patina','tape-scuffs','exposed-metal'])for(const scale of [.5,.75]){
  const result=await page.evaluate(async({name,scale})=>{
    const source=new Image();source.src=`/src/assets/${name}.svg`;await source.decode();
    const canvas=document.createElement('canvas');canvas.width=Math.round(source.naturalWidth*scale);canvas.height=Math.round(source.naturalHeight*scale);
    canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/webp',.85).split(',')[1];
  },{name,scale});
  await writeFile(`public/textures/${name}-${scale*100}.webp`,Buffer.from(result,'base64'));
}
await browser.close();
