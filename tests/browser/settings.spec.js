import {test, expect} from '@playwright/test';

test('portrait settings curtain lowers, preserves controls and lifts back to the deck', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Open tape collection'}).click();
  await page.locator('.load-tape').first().click();
  await expect(page.locator('#status')).toHaveText('READY');
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await expect(page.locator('#status')).toContainText('PLAY');
  const gear=page.getByRole('button',{name:'Open settings'});
  await expect(gear).toBeVisible();
  expect(await gear.locator('img').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  await expect(page.locator('#volume')).not.toBeVisible();
  await gear.click();
  const curtain=page.locator('#settings-curtain');
  await expect(curtain).toHaveAttribute('data-phase','open');
  await expect(gear).toHaveAttribute('aria-expanded','true');
  await expect(curtain.locator('#volume')).toBeVisible();
  expect(await page.locator('#volume').count()).toBe(1);
  await page.locator('#volume').fill('31');
  await page.locator('#volume').dispatchEvent('input');
  await page.getByRole('button',{name:'Back to the deck'}).click();
  await expect(curtain).not.toBeVisible();
  await expect(gear).toBeFocused();
  await expect(page.locator('#status')).toContainText('PLAY');
  await gear.click();
  await expect(curtain).toHaveAttribute('data-phase','open');
  await expect(page.locator('#volume')).toHaveValue('31');
  await page.keyboard.press('Escape');
  await expect(curtain).not.toBeVisible();
});

test('curtain is limited to phone/tablet portrait and restores inline controls on rotation', async ({page}) => {
  await page.setViewportSize({width:768,height:1024});
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings'}).click();
  await expect(page.locator('#settings-curtain')).toBeVisible();
  await page.setViewportSize({width:1024,height:768});
  await expect(page.locator('#settings-curtain')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Open settings'})).not.toBeVisible();
  await expect(page.locator('.liner #volume')).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('button',{name:'Open settings'})).toBeVisible();
  await expect(page.locator('#volume')).not.toBeVisible();
});

test('reduced motion closes the curtain without animation interlocks', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings'}).click();
  await expect(page.locator('#settings-curtain')).toHaveAttribute('data-phase','open');
  await page.getByRole('button',{name:'Back to the deck'}).click();
  await expect(page.locator('#settings-curtain')).not.toBeVisible();
});

test('Escape during lowering safely reverses the curtain and allows reopening', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open settings'}).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-curtain')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Open settings'})).toHaveAttribute('aria-expanded','false');
  await page.getByRole('button',{name:'Open settings'}).click();
  await expect(page.locator('#settings-curtain')).toHaveAttribute('data-phase','open');
});
