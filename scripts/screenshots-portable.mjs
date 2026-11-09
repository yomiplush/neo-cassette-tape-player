import {chromium} from '@playwright/test';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(process.env.NEO_PREVIEW_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button',{name:'Open tape collection'}).click();
  await page.locator('.load-tape').first().click();
  await page.getByRole('switch',{name:'Portable mode'}).click();
  await page.locator('#toast').evaluate(e=>e.classList.remove('show'));
  for(const [name,width,height] of [['mobile',390,844],['small',320,480],['tablet',768,1024],['landscape',844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(150);
    await page.screenshot({path:`docs/screenshots/portable-${name}.png`});
  }
} finally {await browser.close();}
