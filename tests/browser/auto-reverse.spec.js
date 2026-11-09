import {test,expect} from '@playwright/test';
function wav(seconds=1.4){
  const samples=Math.round(8000*seconds),b=Buffer.alloc(44+samples*2);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);
  for(let i=0;i<samples;i++)b.writeInt16LE(Math.sin(i*2*Math.PI*330/8000)*5000,44+i*2);
  return b;
}
async function prepare(page){
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings'}).click();
  await expect(page.locator('#deck-model')).toBeVisible();
  await page.locator('#deck-model').selectOption('auto');
  await page.getByRole('button',{name:'Back to the deck'}).click();
  await page.getByRole('button',{name:'Open tape collection'}).click();await page.locator('#import-open').click();
  await page.locator('[name=title]').fill('Two sides');
  await page.locator('[name=sideA]').setInputFiles({name:'side-a.wav',mimeType:'audio/wav',buffer:wav()});
  await page.locator('[name=sideB]').setInputFiles({name:'side-b.wav',mimeType:'audio/wav',buffer:wav(1.7)});
  await page.locator('.import-submit').click();await page.locator('.load-tape').last().click();
  await expect(page.locator('#status')).toHaveText('READY');
}
test('auto-reverse keeps the door shut, plays the other side from zero and stops after two sides',async({page})=>{
  await prepare(page);
  await expect(page.locator('.model-number')).toContainText('NR-88');
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('AUTO REVERSE…');
  await expect(page.getByRole('button',{name:'Play',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#player')).not.toHaveClass(/door-open/);
  await expect(page.locator('.flip-stage')).toHaveCount(0);
  await expect(page.locator('#side-label')).toHaveText('B');
  await expect(page.locator('#status')).toContainText('PLAY');
  await expect(page.locator('#track-time')).toContainText('00:00 /');
  const packs=await page.locator('#player').evaluate(el=>[parseFloat(el.style.getPropertyValue('--left-pack')),parseFloat(el.style.getPropertyValue('--right-pack'))]);
  expect(packs[0]).toBeLessThan(packs[1]);
  await expect(page.locator('#status')).toHaveText('READY');
  await page.waitForTimeout(700);
  await expect(page.locator('#side-label')).toHaveText('B');
  await expect(page.locator('#status')).toHaveText('READY');
});
test('STOP cancels the auto-reverse transition without starting the other side',async({page})=>{
  await prepare(page);await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('AUTO REVERSE…');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('READY');
  await page.waitForTimeout(900);
  await expect(page.locator('#side-label')).toHaveText('A');
  await expect(page.locator('#status')).toHaveText('READY');
});

test('changing hardware cancels pending audio instead of restarting under the new model',async({page})=>{
  let release;
  const gate=new Promise(resolve=>release=resolve);
  await page.route('**/audio/shrine-ethereal-sanctuary.mp3',async route=>{await gate;await route.continue().catch(()=>{});});
  try {
    await page.goto('/');await page.getByRole('button',{name:'Open tape collection'}).click();await page.locator('.load-tape').first().click();await expect(page.locator('#status')).toHaveText('READY');
    await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#status')).toHaveText('LOADING…');
    await page.getByRole('button',{name:'Open settings'}).click();
    await expect(page.locator('#deck-model')).toBeEnabled();
    await page.locator('#deck-model').selectOption('auto');
    await page.getByRole('button',{name:'Back to the deck'}).click();
    release();await page.waitForTimeout(500);
    await expect(page.locator('#status')).toHaveText('READY');
    await expect(page.locator('.device-area')).toHaveAttribute('data-model','auto');
  } finally {release();}
});
