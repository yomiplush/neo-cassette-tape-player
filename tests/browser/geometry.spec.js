import {test,expect} from '@playwright/test';

test('desktop settings fit without an internal scrollbar and the window fits the cassette',async({page})=>{
  await page.goto('/');
  for(const [width,height] of [[1640,922],[1280,720],[1024,768],[844,390],[390,844]]){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(180);
    const metrics=await page.locator('.liner').evaluate(e=>({height:e.clientHeight,content:e.scrollHeight}));
    expect(metrics.content,`${width}x${height} sidebar`).toBeLessThanOrEqual(metrics.height+1);
    const window=await page.locator('.deck-window').boundingBox();
    expect(window.width/window.height,`${width}x${height} window`).toBeGreaterThan(3.0);
    expect(window.width/window.height).toBeLessThan(3.6);
  }
});

test('manual flip and eject lift behind the glass before coming forward',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Open tape collection'}).click();
  await page.locator('.load-tape').first().click();
  await expect(page.locator('#status')).toHaveText('READY');
  await page.getByRole('button',{name:'Flip side A/B'}).click();
  await expect(page.locator('.deck-window > .flip-stage')).toHaveAttribute('data-phase','lifting');
  await expect(page.locator('.door-occluder')).toBeVisible();
  await expect(page.locator('.deck-window > .flip-stage.tape-in-front')).toHaveAttribute('data-phase','turning');
  await expect(page.locator('.flip-front')).toHaveCSS('visibility','hidden');
  await expect(page.locator('.flip-back .tape-side')).toHaveText('B');
  await expect(page.locator('.deck-window > .flip-stage')).toHaveAttribute('data-phase','seating');
  await expect(page.locator('#side-label')).toHaveText('B');
  await expect(page.locator('.flip-stage')).toHaveCount(0);
  await expect(page.locator('.door-occluder')).toHaveCount(0);
  await page.getByRole('button',{name:'Eject tape'}).click();
  await expect(page.locator('.deck-window > .flip-stage')).toHaveAttribute('data-phase','lifting');
  await expect(page.locator('.door-occluder')).toBeVisible();
  await expect(page.locator('.deck-window > .flip-stage.tape-in-front')).toHaveAttribute('data-phase','ejecting');
  await expect(page.locator('#status')).toHaveText('NO TAPE');
  await expect(page.locator('.flip-stage')).toHaveCount(0);
  await expect(page.locator('.door-occluder')).toHaveCount(0);
});

test('resizing preserves the complete case geometry instead of stretching or rearranging it',async({page})=>{
  await page.goto('/');
  for(const model of ['manual','auto']){
    await page.setViewportSize({width:1920,height:922});
    await page.locator('#deck-model').selectOption(model);
    let reference;
    for(const [width,height] of [[1920,922],[930,890],[1280,720],[390,844],[320,480],[844,390]]){
      await page.setViewportSize({width,height});
      await page.waitForTimeout(180);
      const dimensions=await page.evaluate(()=>{
        const caseBox=document.querySelector('#player').getBoundingClientRect();
        const components=[...document.querySelectorAll('.door:not(.door-occluder),.deck-window,.case-controls,.transport')].map(e=>{const b=e.getBoundingClientRect();return [b.width/caseBox.width,b.height/caseBox.height,(b.left-caseBox.left)/caseBox.width,(b.top-caseBox.top)/caseBox.height];});
        return {ratio:caseBox.width/caseBox.height,components};
      });
      if(!reference)reference=dimensions;
      expect(dimensions.ratio,`${model} ${width}x${height} case aspect`).toBeCloseTo(reference.ratio,3);
      dimensions.components.forEach((values,i)=>values.forEach((value,j)=>expect(value,`${model} ${width}x${height} part ${i}/${j}`).toBeCloseTo(reference.components[i][j],3)));
    }
  }
});
