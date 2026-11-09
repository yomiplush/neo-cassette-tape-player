import {test,expect} from '@playwright/test';
async function load(page){await page.goto('/');await page.getByRole('button',{name:'Open tape collection'}).click();await page.locator('.load-tape').first().click();await expect(page.locator('#status')).toHaveText('READY');}

test('installed cassette and viewing aperture are portrait oriented',async({page})=>{
  await load(page);
  // READY can precede the final CSS door-closing frame; inspect the settled pose.
  for(const selector of ['#loaded-tape .cassette','.deck-window']){
    await expect.poll(async()=>{const b=await page.locator(selector).boundingBox();return b.height/b.width;}).toBeGreaterThan(1.5);
  }
});

test('swiping blank room space rotates the model without opening the door',async({page})=>{
  await page.goto('/');
  const box=await page.locator('.device-slot').boundingBox();
  await page.mouse.move(box.x+10,box.y+25);await page.mouse.down();
  await page.mouse.move(box.x+105,box.y+30,{steps:8});await page.mouse.up();
  await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','true');
  await expect(page.locator('#player')).not.toHaveClass(/door-open/);
});

test('transport keys latch, pause retains PLAY, and the next mode releases the previous key',async({page})=>{
  await load(page);
  const play=page.getByRole('button',{name:'Play',exact:true}),pause=page.getByRole('button',{name:'Pause',exact:true}),forward=page.getByRole('button',{name:'Fast forward',exact:true});
  await play.click();await expect(page.locator('#status')).toHaveText('PLAY');
  await expect(play).toHaveAttribute('aria-pressed','true');
  await pause.click();await expect(page.locator('#status')).toHaveText('PAUSE');
  await expect(play).toHaveAttribute('aria-pressed','true');await expect(pause).toHaveAttribute('aria-pressed','true');
  await forward.click();await expect(forward).toHaveAttribute('aria-pressed','true');
  await expect(play).toHaveAttribute('aria-pressed','false');await expect(pause).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await expect(page.locator('.transport .pressed')).toHaveCount(0);
});

test('portable mode is a flat screen-sized image skin and preserves playback, controls and preferences',async({page})=>{
  await load(page);
  await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#status')).toHaveText('PLAY');
  const toggle=page.getByRole('switch',{name:'Portable mode'});
  await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','true');
  await expect(page.locator('html')).toHaveAttribute('data-portable','true');
  await expect(page.locator('.case-object')).toHaveCSS('transform','none');
  await expect(page.locator('html')).toHaveAttribute('data-frame-rate','0');
  await expect(page.locator('.case-back')).toBeHidden();
  const box=await page.locator('#player').boundingBox();expect(box.width).toBeGreaterThanOrEqual(388);expect(box.height).toBeGreaterThan(680);
  expect(await page.locator('#player').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('portable-shell');
  expect(await page.locator('#player').evaluate(async e=>{
    const url=getComputedStyle(e).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
    const image=new Image();image.src=url;await image.decode();return image.width===400 && image.height===500;
  })).toBe(true);
  const time=await page.locator('#track-time').textContent();await page.waitForTimeout(1400);await expect(page.locator('#track-time')).not.toHaveText(time);
  await page.getByRole('button',{name:'Open settings'}).click();await expect(page.locator('#settings-curtain #volume')).toBeVisible();
  await page.getByRole('button',{name:'Back to the deck'}).click();await expect(page.locator('#status')).toHaveText('PLAY');
  await page.reload();await expect(toggle).toHaveAttribute('aria-checked','true');
  await page.setViewportSize({width:1200,height:800});await expect(toggle).toBeHidden();await expect(page.locator('html')).toHaveAttribute('data-portable','false');
  await page.setViewportSize({width:844,height:390});await expect(page.locator('html')).toHaveAttribute('data-portable','true');
  await page.getByRole('button',{name:'Open settings'}).click();await expect(page.locator('#settings-curtain #volume')).toBeVisible();
});


test('a touch swipe on blank space rotates, while settings and portable mode stay flat',async({page})=>{
  await page.goto('/');
  const client=await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const box=await page.locator('.device-slot').boundingBox(),x=box.x+10,y=box.y+25;
  const swipe=async()=>{
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    for(let i=1;i<=8;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y:y+i,id:1}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  await swipe();await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','true');
  await page.getByRole('switch',{name:'Portable mode'}).click();
  await swipe();await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','false');
});

test('portable phone and tablet layouts retain visible native touch targets and decode every finish',async({page})=>{
  await page.goto('/');await page.getByRole('switch',{name:'Portable mode'}).click();
  for(const [width,height] of [[320,480],[390,844],[768,1024],[844,390],[1024,768]]){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(100);
    const keys=await page.locator('.transport button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
    keys.slice(1).forEach((key,i)=>expect(key.top,`${width}x${height} adjacent keys`).toBeGreaterThanOrEqual(keys[i].bottom));
    const targets=await page.locator('.device-area button,.collection-trigger,#portable-toggle,#settings-open').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),w:r.width,h:r.height,x:r.left,y:r.top,b:r.bottom,r:r.right};}));
    for(const t of targets){
      expect(t.w,`${width}x${height} ${t.label}`).toBeGreaterThanOrEqual(44);expect(t.h,t.label).toBeGreaterThanOrEqual(44);
      expect(t.x).toBeGreaterThanOrEqual(-1);expect(t.y).toBeGreaterThanOrEqual(-1);expect(t.r).toBeLessThanOrEqual(width+1);expect(t.b).toBeLessThanOrEqual(height+1);
    }
  }
  const skins=await page.evaluate(async()=>{
    const result=[];
    for(const name of ['harbor','silver','midnight','signal','ivory']){const image=new Image();image.src=`./textures/portable-shell-${name}.webp`;await image.decode();result.push(image.width===400 && image.height===500);}
    return result;
  });
  expect(skins).toEqual([true,true,true,true,true]);
});


test('portable finish follows settings across reload and 3D switches',async({page})=>{
  await load(page);await page.locator('#portable-toggle').click();
  const doorColors=new Set();
  for(const skin of ['silver','midnight','signal','ivory','harbor']){
    await page.locator('#settings-open').click();await page.locator('#case-skin').selectOption(skin);
    await page.locator('#settings-close').click();await expect(page.locator('#settings-curtain')).toBeHidden();
    expect(await page.locator('#player').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain(`portable-shell-${skin}.webp`);
    doorColors.add(await page.locator('.door').evaluate(e=>getComputedStyle(e).backgroundColor));
    await expect(page.locator('#track-name')).toBeVisible();await expect(page.locator('#track-time')).toBeVisible();
  }
  expect(doorColors.size).toBe(5);
  await page.locator('#settings-open').click();await page.locator('#case-skin').selectOption('signal');await page.locator('#settings-close').click();
  await page.reload();await expect(page.locator('.device-area')).toHaveAttribute('data-skin','signal');
  await page.locator('#portable-toggle').click();await page.locator('#portable-toggle').click();
  expect(await page.locator('#player').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('portable-shell-signal.webp');
});


test('collection and track summary stay outside the enlarged rotating enclosure',async({page})=>{
  await load(page);
  await expect(page.locator('#player .shelf-trigger')).toHaveCount(0);
  await expect(page.locator('#reset-counter')).toHaveCount(0);
  await expect(page.locator('#player .counter-line .neo-logo')).toHaveText('NEO');
  const before=await page.locator('#track-name').boundingBox();
  await page.locator('.case-grip').focus();await page.keyboard.press('ArrowRight');
  await expect(page.locator('#track-name')).toBeVisible();await expect(page.locator('#track-time')).toBeVisible();
  const after=await page.locator('#track-name').boundingBox();expect(after).toEqual(before);
  await page.getByRole('button',{name:'Open tape collection'}).click();await expect(page.locator('#library-dialog')).toBeVisible();
});
