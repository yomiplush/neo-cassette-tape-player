import {test,expect} from '@playwright/test';
test('self-hosted flat portable mode preserves winding, flipping and ejecting',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open tape collection'}).click();await page.locator('.load-tape').first().click();
  await expect(page.locator('#status')).toHaveText('READY');
  await page.getByRole('switch',{name:'Portable mode'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-portable','true');
  await page.getByRole('button',{name:'Fast forward',exact:true}).click();await expect(page.locator('#status')).toHaveText('FF');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.getByRole('button',{name:'Flip side A/B'}).click();await expect(page.locator('#side-label')).toHaveText('B');
  await expect(page.locator('#player')).not.toHaveClass(/door-open/);
  await expect(page.locator('.flip-stage')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-frame-rate','0');
  await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('#status')).toHaveText('PLAY');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.getByRole('button',{name:'Eject tape'}).click();await expect(page.locator('#status')).toHaveText('NO TAPE');
});
