async page => {
  // 關卡 G5：版面溢出檢查。由 tests/run-browser.cjs 執行；不使用院內正式資料。
  // 來源缺陷 I-01：大字模式下，願望詳情的標題與按鈕超出螢幕。檢查範圍擴大到所有對話視窗（G6-M0 第 5 項）。
  const results=[],errors=[];
  const check=(ok,name)=>{if(!ok)throw new Error(name);results.push(name)};
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/');
  const nav=v=>page.locator(`#nav [data-v="${v}"]`).click();
  const role=v=>page.locator('#roleSel').selectOption(v);
  await role('Admin');
  const views=await page.locator('#nav [data-v]').evaluateAll(els=>els.map(el=>el.dataset.v));
  const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  const inView=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1});
  // [名稱, 角色, 頁面, 開啟視窗的元素]；元素以事件觸發，避免點到卡片內的其他按鈕。
  const MODALS=[
    ['願望詳情','PT','wishes','[data-act="wish-detail"]'],
    ['變更照護模式','PT','patient','[data-act="stage-modal"]'],
    ['任務詳情','PT','tasks','[data-act="task-detail"]'],
    ['儲存新版本','PT','plan','[data-act="plan-commit-modal"]'],
    ['版本內容與差異','PT','plan','[data-act="ver-view"]'],
    ['護照任務','PT','passport','[data-act="pp-open"]'],
    ['編輯病人主檔','Admin','admin','[data-act="edit-patient"]']
  ];
  for(const [w,h] of [[768,1024],[1920,1080]]){
    await page.setViewportSize({width:w,height:h});
    for(const big of [false,true]){
      const on=await page.evaluate(()=>document.body.classList.contains('big'));
      if(on!==big)await page.locator('#bigBtn').click();
      const tag=`${w}×${h}${big?' 大字':''}`;
      await role('Admin');
      for(const view of views){
        await nav(view);
        check(await overflow()<=1,`${tag}｜${view} 無橫向溢出`);
      }
      await nav('admin');
      for(const k of await page.locator('[data-act="ad-tab"]').evaluateAll(els=>els.map(el=>el.dataset.k))){
        await page.locator(`[data-act="ad-tab"][data-k="${k}"]`).click();
        check(await overflow()<=1,`${tag}｜後台 ${k} 無橫向溢出`);
      }
      for(const [name,who,view,opener] of MODALS){
        await role(who);await nav(view);
        if(view==='admin')await page.locator('[data-act="ad-tab"][data-k="patients"]').click();
        await page.locator(opener).first().dispatchEvent('click');
        const modal=page.locator('#modal');
        check(await page.locator('#modalBackdrop.open').count()===1,`${tag}｜${name}視窗已開啟`);
        check(await modal.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1}),`${tag}｜${name}視窗未超出左右邊界`);
        const title=modal.locator('h2,h3').first();await title.scrollIntoViewIfNeeded();
        check(await inView(title),`${tag}｜${name}標題可完整看見`);
        const buttons=modal.locator('footer button');
        for(let i=0;i<await buttons.count();i++){const b=buttons.nth(i);await b.scrollIntoViewIfNeeded();check(await inView(b),`${tag}｜${name}按鈕 ${i+1} 可完整看見`)}
        await page.locator('#modal [data-act="close"]').first().click();
      }
    }
  }
  check(errors.length===0,'沒有未捕捉的瀏覽器錯誤');
  return {passed:results.length,results,errors};
}
