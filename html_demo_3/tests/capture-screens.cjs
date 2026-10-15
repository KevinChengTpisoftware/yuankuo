/* 院長簡報截圖（R-00c）：以 tests/scenario.cjs 重建示範情境，重產 20261014_院長簡報/_screens/ 的截圖。
 * 截圖完成後寫入 manifest.json，記錄介面雜湊值，供關卡 G4 判斷截圖是否過期。
 * 用法：node tests/capture-screens.cjs [--out 目錄] [--only s1_patient,s2_familiar]
 * 預設輸出到 20261014_院長簡報/_screens/；驗證腳本時請用 --out 指向暫存目錄。 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {mount}=require('./run-browser.cjs'),{build,CLOCK}=require('./scenario.cjs'),{uiHash,sha}=require('./deck-check.cjs');
const root=path.resolve(__dirname,'..');
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null};
const out=path.resolve(arg('--out')||path.join(root,'20261014_院長簡報','_screens'));
const only=arg('--only')?.split(',');

/* 每張截圖：名稱、視窗大小、操作步驟、畫面上必須看得到的文字。步驟結束後的畫面即為截圖內容。 */
const SHOTS=[
  ['s1_patient',null,async(p,u)=>{await u.nav('patient');await p.evaluate(()=>scrollTo(0,160))},['目前照護模式','照護模式歷程','杏翔系統 ID']],
  ['s1b_stage_modal',null,async(p,u)=>{await u.nav('patient');await u.act('stage-modal')},['變更照護模式','新照護模式']],
  ['s2_familiar',null,async(p,u)=>{await u.nav('familiar');await u.act('fam-tab','[data-k="overview"]')},['跨專業共同認識病人','藥師']],
  ['s3_wishes',null,async(p,u)=>{await u.nav('wishes')}],
  ['s3b_wish_detail',null,async(p,u)=>{await u.nav('wishes');await u.act('wish-detail','[data-id="wish-food-01"]')},['自己拿湯匙喝完一碗熱湯麵']],
  ['s4_quad_placed',null,async(p,u)=>{await u.nav('quad')},['重要且急迫']],
  ['s5_tasks',null,async(p,u)=>{await u.nav('tasks')},['選擇任務']],
  ['s6_plan',null,async(p,u)=>{await u.nav('plan')},['週期修訂','每 60 天重新修訂','提醒設定']],
  ['s6c_plan_ai',null,async(p,u)=>{await u.nav('plan');await u.scrollTo('h3:text-is("⑤ 預後目標")',150)},['預後目標','AI 草稿']],
  ['s6d_versions',null,async(p,u)=>{await u.nav('plan');await u.scrollTo('h3:text-matches("^版本歷程")',420)},['版本歷程','初版','定期檢討','其他修訂']],
  ['s6e_commit_modal',null,async(p,u)=>{await u.nav('plan');await u.act('plan-commit-modal');await p.locator('#cmReason').fill('病人可扶單拐行走 10 公尺，長期目標加入社區活動')},['儲存為新版本','修訂原因']],
  ['s6f_ver_diff',null,async(p,u)=>{await u.nav('plan');await u.act('ver-view','[data-v="3"]')}],
  ['s7_passport',null,async(p,u)=>{await u.nav('passport')},['獎盃櫃','成就徽章','89 / 150 項已解鎖']],
  ['s7b_passport_task',null,async(p,u)=>{await u.nav('passport');await p.locator('[data-wish-link] [data-act="pp-open"][data-id="80"]').first().dispatchEvent('click')},['任務狀態','共學夥伴']],
  ['s7c_passport_links',null,async(p,u)=>{await u.nav('passport');await u.scrollTo('h4:text-is("願望 → 對應的生活任務")',260)},['願望 → 對應的生活任務','共學夥伴：']],
  ['s8_audit',null,async(p,u)=>{await u.role('Admin');await u.nav('admin');await u.act('ad-tab','[data-k="logs"]');await u.scrollTo('text=轉入 PAC，目標改為居家安全移動與照顧者訓練',210)},['復健計畫新版本','AI 產生預後目標草稿','變更照護模式','熟識人更新']],
  ['s9_analytics',{width:1600,height:1300},async(p,u)=>{await u.nav('analytics')},['照護模式分布','張伯伯（已解鎖 89）','全體病人平均（8 人）']]
];

async function main(){
  const names=SHOTS.map(([n])=>n),bad=(only||[]).filter(n=>!names.includes(n));
  if(bad.length)throw new Error(`--only 指定了不存在的截圖：${bad.join('、')}；可用名稱：${names.join('、')}`);
  /* 先拍到暫存目錄；全部成功、無瀏覽器錯誤、介面雜湊前後一致，才搬進輸出目錄並更新 manifest。 */
  const before=uiHash(),tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'yk-screens-'));
  const browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-TW',timezoneId:'Asia/Taipei',deviceScaleFactor:1});
  await mount(context);const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date(CLOCK));
  const u={
    nav:v=>page.locator(`#nav [data-v="${v}"]`).click(),
    role:v=>page.locator('#roleSel').selectOption(v),
    act:(name,sel='')=>page.locator(`[data-act="${name}"]${sel}`).first().click(),
    scrollTo:(sel,offset)=>page.locator(sel).first().evaluate((el,o)=>scrollTo(0,el.getBoundingClientRect().top+scrollY-o),offset)
  };
  const done=[];
  try{
    await build(page);
    const snapshot=await page.evaluate(()=>localStorage.getItem('yk-demo3-v2'));
    for(const [name,size,steps,must] of SHOTS){
      if(only&&!only.includes(name))continue;
      /* 每張截圖從同一份情境資料開始，避免前一張的操作影響下一張。 */
      await page.setViewportSize(size||{width:1440,height:900});
      await page.evaluate(s=>{localStorage.setItem('yk-demo3-v2',s)},snapshot);
      await page.reload();await page.evaluate(()=>scrollTo(0,0));
      await steps(page,u);
      await page.waitForTimeout(400);
      /* 畫面上必須看得到圖說提到的內容，避免截圖與簡報圖說不符（G6-M5）。 */
      const missing=await page.evaluate(words=>{
        const top=document.querySelector('.topbar')?.getBoundingClientRect().bottom||0;
        const seen=t=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
          while((n=w.nextNode())){if(!n.textContent.includes(t))continue;const r=document.createRange();r.selectNodeContents(n);const b=r.getBoundingClientRect();
            if(b.width&&b.bottom>top&&b.top<innerHeight)return true}return false};
        return words.filter(t=>!seen(t));
      },must||[]);
      if(missing.length)throw new Error(`${name} 畫面上看不到：${missing.join('、')}`);
      /* 影片緩衝進度每次不同，以遮罩固定畫面；停用動畫避免截到過場。 */
      await page.screenshot({path:path.join(tmp,name+'.png'),animations:'disabled',mask:[page.locator('video')]});
      done.push(name);console.log('✔',name);
    }
  }finally{await browser.close()}
  if(errors.length)throw new Error('瀏覽器錯誤，未更新截圖：'+errors.join('；'));
  if(uiHash()!==before)throw new Error('截圖期間介面原始碼有變動，未更新截圖；請重跑');
  fs.mkdirSync(out,{recursive:true});
  const mf=path.join(out,'manifest.json'),prev=fs.existsSync(mf)?JSON.parse(fs.readFileSync(mf,'utf8')):{};
  const shots={...(prev.shots||{})};
  for(const n of done){
    const buf=fs.readFileSync(path.join(tmp,n+'.png'));
    fs.writeFileSync(path.join(out,n+'.png'),buf);shots[n]={ui:before,png:sha(buf)};
  }
  fs.rmSync(tmp,{recursive:true,force:true});
  fs.writeFileSync(mf,JSON.stringify({clock:CLOCK,scenario:'tests/scenario.cjs',shots},null,2)+'\n');
  const stale=names.filter(n=>shots[n]?.ui!==before);
  console.log(`截圖完成：${done.length} 張；輸出 ${path.relative(root,out)}${stale.length?`；仍為舊版：${stale.join('、')}`:''}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
