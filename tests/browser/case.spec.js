import {test,expect} from '@playwright/test';

test('case has depth, supports dragging without opening the door, and returns to working front controls', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.case-back')).toHaveCount(1);
  await expect(page.locator('.case-side')).toHaveCount(4);
  const window=await page.locator('.window-latch').boundingBox();
  await page.mouse.move(window.x+window.width/2,window.y+window.height/2);
  await page.mouse.down();
  await page.mouse.move(window.x+window.width/2+95,window.y+window.height/2-15,{steps:10});
  await page.mouse.up();
  await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','true');
  await expect(page.locator('#player')).not.toHaveClass(/door-open/);
  await page.getByRole('button',{name:'Return player to front'}).click();
  await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','false');
  await page.getByRole('button',{name:'Open or close door'}).click();
  await expect(page.locator('#player')).toHaveClass(/door-open/);
});

test('skins and legacy tape characters persist through reload without duplicate audio controls', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings'}).click();
  await page.locator('#case-skin').selectOption('silver');
  await page.locator('#tape-character').selectOption('heavy');
  await expect(page.locator('.device-area')).toHaveAttribute('data-skin','silver');
  expect(await page.locator('#case-skin option').count()).toBe(5);
  await page.reload();
  await page.getByRole('button',{name:'Open settings'}).click();
  await expect(page.locator('#case-skin')).toHaveValue('silver');
  await expect(page.locator('#tape-character')).toHaveValue('heavy');
  await expect(page.locator('#volume')).toHaveCount(1);
});

test('case rotation is keyboard accessible without winding the tape', async ({page}) => {
  await page.goto('/');
  const grip=page.getByRole('button',{name:'Rotate player'});
  await grip.focus();await page.keyboard.press('ArrowRight');
  await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','true');
  await expect(page.locator('#status')).toHaveText('NO TAPE');
  await page.keyboard.press('Home');
  await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','false');
});

test('touch swipes turn the case without triggering the window latch', async ({page})=>{
  await page.goto('/');
  const client=await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const box=await page.locator('.window-latch').boundingBox();
  const x=box.x+box.width*.45,y=box.y+box.height*.5;
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=8;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y:y-i,id:1}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.case-object')).toHaveAttribute('data-rotated','true');
  await expect(page.locator('#player')).not.toHaveClass(/door-open/);
});
