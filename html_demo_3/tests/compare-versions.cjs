/* 修改前後對照頁：以同一組操作步驟，分別在比較基準（預設 main）與目前工作目錄上截取系統畫面與院長簡報，
 * 產生 20261014_修改前後對照/index.html 與 img/。系統畫面使用內建示範資料與固定時鐘，兩邊只有程式不同。
 * 用法：node tests/compare-versions.cjs [--base main] [--out 目錄] [--fragment 檔案]
 * --fragment：另外輸出不含 <html>/<head> 外框的版本，供發布到 claude.ai Artifact。 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'..'),ORIGIN='http://127.0.0.1:8765';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:d};
const BASE=arg('--base','main'),OUT=path.resolve(arg('--out',path.join(root,'20261014_修改前後對照'))),FRAG=arg('--fragment',null);
const DECK='20261014_院長簡報/院長專用個別人照護系統介紹.html';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4','.json':'application/json'};
const git=args=>execSync(`git --no-optional-locks -c core.quotepath=false ${args}`,{cwd:repo,encoding:'utf8',maxBuffer:1<<26});
const HEAD_NAME=git('rev-parse --abbrev-ref HEAD').trim();
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===== 本輪修改的說明（隨每一輪修改更新） ===== */
const CONFIRMED=6; // ITEMS 前 6 列為 10/14 確認的修改，其後為候選項目
const ITEMS=[
  ['信祥 → 杏翔','外部系統名稱寫成「信祥」','全部改為「杏翔」（杏翔股份有限公司）','sys-patient'],
  ['照護階段 → 照護模式','PAC、復健病房、一般復健、OPD 稱為「照護階段」','稱為「照護模式」；「階段」只留給入院到出院的六個流程階段','sys-stage-modal'],
  ['熟識人補上藥師，可彈性調整','7 個專業，固定寫在程式裡','8 個專業（新增藥師）；後台可改名、停用、新增欄位與自訂區塊','sys-familiar'],
  ['計畫時程可調整','固定 14～21 天檢討、80 天修訂','系統預設 → 照護模式預設 → 個案設定（天數或指定日期）','sys-plan'],
  ['生活護照不區分版本','分成「護照 1.0」與「護照 2.0」兩個分頁','單一頁面；每個願望列出對應的生活任務','sys-passport-plan'],
  ['協助夥伴 → 共學夥伴','任務視窗寫「協助夥伴」','改為「共學夥伴」','sys-passport-task'],
  ['C1　六種階段','第 5 頁底部寫「轉換階段時新增一筆歷程」，沒有區分六個流程階段','補一行「入院到出院共有六種階段，各流程階段的操作都寫入操作紀錄」','slide-05'],
  ['C2　報告版移除內部提示','第 26 頁副標寫「如實報告目前的系統狀態」','改為對聽眾的說明；講稿保留提示','slide-26'],
  ['C3　時程','第 27 頁為「展示版 → 欄位確認 → 正式上線 → 成果分析」','流程確認（現在～11 月）→ 系統落地（預計 12 月底）→ 場域示範（預計 1 月～3/30）→ 系統串接（第二期）','slide-27'],
  ['C4　待修訂個案總覽','沒有集中查看的地方','後台「提醒總覽」：依到期先後列出個案，可篩選並直接開啟計畫','sys-admin-remind']
];
const nav=(p,v)=>p.locator(`#nav [data-v="${v}"]`).click();
const role=(p,v)=>p.locator('#roleSel').selectOption(v);
const toText=(p,re,off=140)=>p.evaluate(([src,off])=>{const re=new RegExp(src),el=[...document.querySelectorAll('h2,h3,h4')].find(e=>re.test(e.textContent));if(el)scrollTo(0,el.getBoundingClientRect().top+scrollY-off);return !!el},[re.source,off]);
const SYS=[
  ['patient','個案主檔','「目前照護階段」「照護階段歷程」「變更照護階段」改為照護模式；識別碼欄位「信祥系統 ID」改為「杏翔系統 ID」。',async p=>{await nav(p,'patient');await p.evaluate(()=>scrollTo(0,160))}],
  ['stage-modal','變更照護模式視窗','視窗標題與欄位改為「照護模式」，說明改為「舊照護模式會保留在歷程中」。',async p=>{await nav(p,'patient');await p.locator('[data-act="stage-modal"]').first().click()}],
  ['familiar','熟識人：跨專業總覽','分頁多了「藥師」。後台新增的自訂區塊（例如家屬）也會出現在這一列。',async p=>{await nav(p,'familiar')}],
  ['admin-mode','後台：照護模式設定','分頁名稱由「階段設定」改為「照護模式設定」；新增各照護模式的「檢討（天）」「修訂（天）」欄位；說明不再寫死 80 天。',async p=>{await role(p,'Admin');await nav(p,'admin');await p.locator('[data-act="ad-tab"][data-k="stages"]').click()}],
  ['admin-famcfg','後台：熟識人區塊（新分頁）','可調整區塊與欄位名稱、啟用或停用、新增欄位、新增自訂區塊。停用只隱藏，不刪除已填內容。',async p=>{await role(p,'Admin');await nav(p,'admin');const t=p.locator('[data-act="ad-tab"][data-k="famcfg"]');if(!await t.count())return 'none';await t.click()}],
  ['admin-remind','後台：提醒總覽（新分頁，候選 C4）','列出所有需要復健計畫的病人，依下一個檢討或修訂日期排序；可篩選已到期、7 天內、14 天內，並直接開啟該病人的計畫。',async p=>{await role(p,'Admin');await nav(p,'admin');const t=p.locator('[data-act="ad-tab"][data-k="remind"]');if(!await t.count())return 'none';await t.click()}],
  ['plan','復健計畫：檢討與修訂提醒','「80 天修訂」改為「週期修訂」，並標示天數來源；新增可展開的「提醒設定」；快轉按鈕改為「快轉到下次檢討／修訂」。',async p=>{await nav(p,'plan');await p.evaluate(()=>scrollTo(0,140))}],
  ['commit-modal','儲存新版本視窗','修訂類型改為「定期檢討（約每 14～21 天）」與「週期修訂（每 80 天）」，天數依實際設定顯示。',async p=>{await nav(p,'plan');await p.locator('[data-act="plan-commit-modal"]').first().click()}],
  ['passport-top','生活功能護照：頁首','移除「護照 1.0／護照 2.0」分頁，頁首下方直接接獎盃櫃與成就徽章。',async p=>{await nav(p,'passport');const t=p.locator('[data-act="pv"][data-v="1"]');if(await t.count())await t.click();await p.evaluate(()=>scrollTo(0,0))}],
  ['passport-plan','生活功能護照：願望與目標','原本「護照 2.0」的內容併入同一頁；每個願望底下列出對應任務的狀態、短／長期與共學夥伴。',async p=>{await nav(p,'passport');const t=p.locator('[data-act="pv"][data-v="2"]');if(await t.count())await t.click();await toText(p,/個人照護計畫|我的願望與目標/)}],
  ['passport-task','護照任務視窗','「協助夥伴」改為「共學夥伴」，選項不變。',async p=>{await nav(p,'passport');await p.evaluate(()=>passportModal(2))}],
  ['analytics','成果分析','「病人照護階段分布」改為「病人照護模式分布」；表頭「目前階段」改為「照護模式」。',async p=>{await nav(p,'analytics');await toText(p,/照護(階段|模式)分布/,300)}]
];
const SLIDES=[
  [4,'六個階段總覽','「照護階段」改為「照護模式」；「七個專業」改為「八個專業」；病人端說明改為「任務闖關＋願望與目標」。'],
  [5,'階段①　建立個案主檔','「四種照護模式」；識別碼「信祥」改為「杏翔」；轉換說明改為照護模式；補一行「入院到出院共有六種階段，各流程階段的操作都寫入操作紀錄」（C1）。'],
  [6,'個案主檔與照護模式歷程','標題、重點句、圖說改為照護模式；截圖重拍，看得到「杏翔系統 ID」。'],
  [7,'熟識人資料：八個專業共填，可彈性增加','標題改寫；專業圖重排為 8 個專業加「＋ 其他（可彈性增加）」。'],
  [8,'熟識人：跨專業總覽','重點句改為「八個專業」；截圖重拍，分頁看得到藥師。'],
  [13,'階段⑤　一個願望，拆成多個生活任務','副標改為「所有照護模式的病人都可以使用」。'],
  [14,'生活復健任務：150 項任務庫','重點句改為「所有照護模式共用」；截圖重拍。'],
  [16,'復健計畫：提醒與 AI 草稿','截圖重拍：週期修訂、個案設定每 60 天、提醒設定。'],
  [17,'儲存新版本與版本歷程','截圖重拍：儲存視窗預選「週期修訂（每 60 天）」。'],
  [18,'每次儲存都是新版本','副標與追蹤機制圖改為「依個案設定」修訂、「定期檢討：天數依個案設定」。'],
  [20,'生活功能解鎖護照','移除「1.0／2.0」，改為「任務闖關」與「願望與目標」。'],
  [21,'生活功能護照：願望、目標與任務','標題與重點句改寫；三張截圖改為整合後的護照；「協助夥伴」改為「共學夥伴」。'],
  [24,'四項品質與安全保障','「照護模式、熟識人、計畫」皆保留歷史版本；「杏翔識別碼」。'],
  [25,'後台管理：操作紀錄','副標改為「照護模式變更」；截圖改為 9/23 那一段，看得到計畫新版本、AI 草稿、照護模式變更、熟識人更新。'],
  [26,'現況：展示版','副標「如實報告目前的系統狀態」改為對聽眾的說明（C2）；補上「預計 12 月底改用正式資料庫」「串接 PAC 與杏翔排在第二期」（C3）。'],
  [27,'時程：從流程確認到場域示範','原「四步走向正式上線」改為時程：流程確認、系統落地（預計 12 月底）、場域示範（預計 1 月～3/30，100 個案）、系統串接（第二期）（C3）。'],
  [28,'成果分析：雷達圖與群體統計','重點句改為「照護模式與願望類別統計」；截圖重拍（8 位示範病人，張伯伯解鎖 89 項）。'],
  [30,'預期提問與回答','「每種照護模式都要做計畫嗎？」「院方可依照護模式設定」。']
];
/* 檔案變更：行數由 git diff --numstat 即時計算；這裡只定義分組與說明。 */
const GROUPS=[
  ['系統程式',f=>/^html_demo_3\/(index\.html|assets\/[^/]+\.(js|css))$/.test(f)],
  ['院長簡報',f=>f.startsWith('html_demo_3/20261014_院長簡報/')],
  ['文件',f=>/^html_demo_3\/[^/]+\.md$/.test(f)],
  ['檢查工具',f=>/^html_demo_3\/tests\/|^html_demo_3\/package/.test(f)]
];
const NOTES={'assets/app-plan.js':'提醒設定、週期修訂、整合護照、共學夥伴','assets/app-admin.js':'熟識人區塊設定、名稱跳脫','assets/demo-core.js':'資料版本 5、區塊合併、提醒計算',
  'assets/app.js':'藥師、照護模式用詞','assets/app-access.js':'自訂區塊與新動作的權限','assets/style.css':'新區塊樣式','assets/app-analytics.js':'照護模式用詞',
  '_SVG':'照護模式、杏翔、八個專業、依個案設定、護照不分版本','_screens':'以腳本重拍','tests':'瀏覽器測試、術語檢查、簡報檢查、截圖情境、不變量測試'};

/* ===== 截圖 ===== */
async function mount(ctx,base){await ctx.route(ORIGIN+'/**',r=>{const rel=decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\/+/,'')||'index.html',f=path.resolve(base,rel);
  if(!f.startsWith(base)||!fs.existsSync(f)||fs.statSync(f).isDirectory())return r.fulfill({status:404,body:''});
  return r.fulfill({status:200,contentType:TYPES[path.extname(f).toLowerCase()]||'application/octet-stream',body:fs.readFileSync(f)})})}
async function capture(img){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'yk-compare-'));
  execSync(`git --no-optional-locks archive ${BASE} html_demo_3/index.html html_demo_3/assets "html_demo_3/20261014_院長簡報" | tar -x -C "${tmp}"`,{cwd:repo,shell:true});
  const ROOT={before:path.join(tmp,'html_demo_3'),after:root},browser=await chromium.launch(),missing=[];
  try{
    for(const ver of ['before','after']){
      const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-TW',timezoneId:'Asia/Taipei'});await mount(ctx,ROOT[ver]);
      for(const [key,,,steps] of SYS){
        const p=await ctx.newPage();await p.clock.setFixedTime(new Date('2026-10-14T07:56:00+08:00'));
        await p.goto(ORIGIN+'/');await p.evaluate(()=>localStorage.clear());await p.reload();
        const r=await steps(p);await p.waitForTimeout(500);
        if(r==='none')missing.push(`sys-${key}-${ver}`);else await p.screenshot({path:path.join(img,`sys-${key}-${ver}.jpg`),type:'jpeg',quality:82,animations:'disabled'});
        await p.close();
      }
      await ctx.close();
      const dctx=await browser.newContext({viewport:{width:1280,height:720},locale:'zh-TW'});await mount(dctx,ROOT[ver]);
      const d=await dctx.newPage();await d.goto(ORIGIN+'/'+encodeURI(DECK));
      for(const [n] of SLIDES){await d.evaluate(i=>go(i),n-1);await d.waitForFunction(()=>[...document.querySelectorAll('.slide.active img')].every(i=>i.complete));await d.waitForTimeout(150);
        await d.screenshot({path:path.join(img,`slide-${String(n).padStart(2,'0')}-${ver}.jpg`),type:'jpeg',quality:82})}
      await dctx.close();console.log(`✔ ${ver==='before'?'改動前':'改動後'}：系統 ${SYS.length} 個畫面、簡報 ${SLIDES.length} 頁`);
    }
  }finally{await browser.close();fs.rmSync(tmp,{recursive:true,force:true})}
  return missing;
}

/* ===== 頁面 ===== */
function stats(){
  const rows=git(`diff --numstat ${BASE}`).trim().split('\n').filter(Boolean).map(l=>{const [a,r,f]=l.split('\t');return {f:f.replace(/^"|"$/g,''),a:a==='-'?null:+a,r:r==='-'?null:+r}});
  const out=GROUPS.map(([g,test])=>{
    const mine=rows.filter(x=>test(x.f)),list=[];
    const agg=(label,match,note)=>{const m=mine.filter(x=>match(x.f));if(!m.length)return;m.forEach(x=>x.done=true);
      const bin=m.every(x=>x.a===null),nb=m.filter(x=>x.a===null).length;
      list.push([label.replace('{n}',m.length),bin?null:m.reduce((s,x)=>s+(x.a||0),0),bin?null:m.reduce((s,x)=>s+(x.r||0),0),note+(nb&&!bin?`；其中 ${nb} 個圖片檔為二進位檔，不計行數`:'')])};
    if(g==='院長簡報'){agg('_SVG／{n} 個圖解',f=>f.includes('/_SVG/'),NOTES._SVG);agg('_screens／{n} 個檔案（截圖與清單）',f=>f.includes('/_screens/'),NOTES._screens)}
    if(g==='檢查工具'){agg('tests／{n} 個檔案',f=>f.includes('/tests/'),NOTES.tests);agg('package.json 等 {n} 個檔案',f=>f.includes('/package'),'Playwright 測試工具')}
    mine.filter(x=>!x.done).forEach(x=>{const short=x.f.replace(/^html_demo_3\//,'').replace(/^20261014_院長簡報\//,'');list.push([short,x.a,x.r,NOTES[short]||(x.a&&!x.r?'新增':'')])});
    return [g,list];
  });
  const sys=rows.filter(x=>GROUPS[0][1](x.f));
  return {groups:out,sysFiles:sys.length,sysAdd:sys.reduce((s,x)=>s+x.a,0),sysRem:sys.reduce((s,x)=>s+x.r,0)};
}
function build(missing){
  const st=stats(),commits=git(`log --format=%h%x09%s ${BASE}..HEAD`).trim().split('\n').filter(Boolean).map(l=>l.split('\t')).reverse();
  const maxn=Math.max(1,...st.groups.flatMap(([,l])=>l.map(r=>(r[1]||0)+(r[2]||0))));
  const img=(n,alt)=>`<a class="shot" href="img/${n}" target="_blank" rel="noopener"><img src="img/${n}" alt="${E(alt)}" loading="lazy"></a>`;
  const pair=(prefix,key,title,note,w,h)=>{
    const b=`${prefix}-${key}-before.jpg`,a=`${prefix}-${key}-after.jpg`,none=missing.includes(`${prefix}-${key}-before`);
    const before=none?`<div class="missing" style="aspect-ratio:${w}/${h}"><span>改動前沒有這個畫面</span></div>`:img(b,`改動前：${title}`);
    /* 滑桿疊圖：分隔線左邊是改動前、右邊是改動後；標籤放在圖上對應的一側，區域太窄時自動隱藏。 */
    const slider=none?'':`<div class="slider"><div class="stack" style="aspect-ratio:${w}/${h};--pos:50%"><img src="img/${a}" alt="改動後：${E(title)}" loading="lazy"><img class="top" src="img/${b}" alt="改動前：${E(title)}" loading="lazy">
        <span class="cut" aria-hidden="true"></span><span class="ctag before">改動前</span><span class="ctag after">改動後</span>
        <input class="handle" type="range" min="0" max="100" value="50" aria-label="${E(title)}：左右拖曳分隔線，左邊是改動前，右邊是改動後"></div></div>`;
    return `<article class="pair${none?' only-after':''}" id="${prefix}-${key}"><header><h3>${E(title)}</h3><p>${E(note)}</p></header>
      <div class="side"><figure><figcaption class="tag before">改動前</figcaption>${before}</figure><figure><figcaption class="tag after">改動後</figcaption>${img(a,`改動後：${title}`)}</figure></div>${slider}</article>`;
  };
  const bar=(a,r)=>a===null?'<span class="na">二進位檔</span>':`<span class="bars"><i class="add" style="width:${a?Math.max(2,Math.round(a/maxn*160)):0}px"></i><i class="rem" style="width:${r?Math.max(2,Math.round(r/maxn*160)):0}px"></i></span><span class="num">+${a} −${r}</span>`;
  const CMDS=[['看所有 commit',`git log --oneline ${BASE}..${HEAD_NAME}`],['系統程式的逐行差異',`git diff ${BASE}..${HEAD_NAME} -- html_demo_3/assets html_demo_3/index.html`],
    ['文件與講稿的逐字差異',`git diff --word-diff ${BASE}..${HEAD_NAME} -- "*.md"`],['重新產生本頁',`cd html_demo_3 && node tests/compare-versions.cjs --base ${BASE}`]];
  const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>員郭修改前後對照</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700&display=swap">
<style>
/* 版面概念：病歷審閱單——每組修改是一張「改動前／改動後」對照卡，綠色沿用醫院系統的主色，改動前用褐色標示 */
:root{--bg:#f4f7f5;--surface:#ffffff;--ink:#14261d;--muted:#56695f;--line:#d5e0d9;--accent:#11733f;--accent-soft:#e3f1e8;--before:#8b5b2a;--before-soft:#f6ebdf;--rem:#c0564b;
  --font-body:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;--font-display:"Noto Serif TC","Songti TC","PMingLiU",serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0f1713;--surface:#16211b;--ink:#e2ebe5;--muted:#9db1a6;--line:#2b3b32;--accent:#58c88b;--accent-soft:#1c3226;--before:#e0a86b;--before-soft:#33271a;--rem:#e57d70;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f1713;--surface:#16211b;--ink:#e2ebe5;--muted:#9db1a6;--line:#2b3b32;--accent:#58c88b;--accent-soft:#1c3226;--before:#e0a86b;--before-soft:#33271a;--rem:#e57d70;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.7;margin:0}
.wrap{max-width:1220px;margin:0 auto;padding-block:40px 80px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:56px}
h1,h2{font-family:var(--font-display);text-wrap:balance;margin:0;line-height:1.3} h1{font-size:clamp(1.9rem,4vw,2.7rem)} h2{font-size:clamp(1.4rem,2.6vw,1.8rem)} h3{font-size:1.1rem;margin:0;line-height:1.4}
p{margin:0} a{color:var(--accent)} a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.eyebrow{font-size:.8rem;letter-spacing:.12em;color:var(--accent);font-weight:700} .intro{display:grid;gap:14px} .intro .lede{color:var(--muted);max-width:68ch}
.meta{display:flex;flex-wrap:wrap;gap:8px} .chip{background:var(--accent-soft);color:var(--ink);border-radius:999px;padding:4px 12px;font-size:.85rem;font-variant-numeric:tabular-nums}
.toc{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.95rem}
section{display:grid;gap:20px} section>header{display:grid;gap:6px} section>header p{color:var(--muted);max-width:72ch}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:640px} th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
thead th{font-size:.8rem;letter-spacing:.06em;color:var(--muted);font-weight:700} tbody th{font-weight:700} tr:last-child>*{border-bottom:0} td:last-child a{white-space:nowrap}
.mode{display:flex;flex-wrap:wrap;align-items:center;gap:10px;position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line)}
.mode span{color:var(--muted);font-size:.9rem} .mode label{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 14px;cursor:pointer;font-size:.92rem} .mode input{accent-color:var(--accent)}
.pairs{display:grid;gap:36px} .pair{display:grid;gap:12px;scroll-margin-top:70px} .pair header{display:grid;gap:4px} .pair header p{color:var(--muted);max-width:80ch}
.side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px} figure{margin:0;display:grid;gap:6px;min-width:0}
.tag{font-size:.8rem;font-weight:700;letter-spacing:.06em;justify-self:start;border-radius:6px;padding:1px 8px} .tag.before{color:var(--before);background:var(--before-soft)} .tag.after{color:var(--accent);background:var(--accent-soft)}
.shot{display:block;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface)} .shot img{display:block;width:100%;height:auto}
.missing{display:grid;place-items:center;border:2px dashed var(--line);border-radius:10px;color:var(--muted);font-size:.95rem;max-width:100%}
.slider{display:none;gap:8px} body[data-mode="slide"] .pair:not(.only-after) .side{display:none} body[data-mode="slide"] .pair:not(.only-after) .slider{display:grid}
.stack{position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;max-width:100%;background:var(--surface)} .stack img{position:absolute;inset:0;width:100%;height:100%;display:block}
.stack img.top{clip-path:inset(0 calc(100% - var(--pos)) 0 0)} .stack .cut{position:absolute;top:0;bottom:0;left:var(--pos);width:3px;margin-left:-1.5px;background:var(--ink);box-shadow:0 0 0 1px var(--surface);pointer-events:none}
.stack .cut::after{content:"◀ ▶";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--ink);color:var(--surface);font-size:.7rem;letter-spacing:.1em;border-radius:999px;padding:6px 8px;white-space:nowrap}
.ctag{position:absolute;top:10px;font-size:.8rem;font-weight:700;letter-spacing:.06em;border-radius:6px;padding:2px 10px;pointer-events:none;transition:opacity .15s}
.ctag.before{left:10px;color:var(--before);background:var(--before-soft)} .ctag.after{right:10px;color:var(--accent);background:var(--accent-soft)}
.stack[data-hide-before] .ctag.before,.stack[data-hide-after] .ctag.after{opacity:0}
.stack .handle{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize;touch-action:pan-y}
.stack:focus-within{outline:3px solid var(--accent);outline-offset:2px}
.slide-hint{font-size:.85rem;color:var(--muted)}
@media (prefers-reduced-motion:reduce){.ctag{transition:none}}
.note{border-left:4px solid var(--before);background:var(--before-soft);padding:10px 14px;border-radius:0 8px 8px 0;font-size:.92rem;max-width:90ch}
.files td.file{font-family:var(--font-mono);font-size:.85rem;white-space:nowrap} .files tr.group th{background:var(--accent-soft);font-size:.85rem;letter-spacing:.06em}
.delta{white-space:nowrap} .bars{display:inline-flex;vertical-align:middle;margin-right:8px} .bars i{display:inline-block;height:10px} .bars .add{background:var(--accent)} .bars .rem{background:var(--rem)}
.num,.na{font-family:var(--font-mono);font-size:.8rem;color:var(--muted);font-variant-numeric:tabular-nums}
.commits{list-style:none;margin:0;padding:0;display:grid;gap:6px;max-width:100%} .commits li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:baseline}
.commits code,.cmd code{font-family:var(--font-mono);font-size:.85rem} .commits code{color:var(--accent)}
.cmds{display:grid;gap:12px} .cmd{display:grid;gap:4px} .cmd-label{font-size:.9rem;color:var(--muted)} .cmd-row{display:flex;gap:8px;align-items:stretch;min-width:0}
.cmd-row code{flex:1;min-width:0;overflow-x:auto;white-space:nowrap;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 12px}
.copy{font:inherit;font-size:.85rem;border:1px solid var(--accent);color:var(--accent);background:var(--surface);border-radius:8px;padding:0 14px;cursor:pointer} .copy[data-done]{background:var(--accent);color:var(--surface)}
@media (max-width:760px){.side{grid-template-columns:minmax(0,1fr)}}
</style>`;
  const body=`<div class="wrap">
  <header class="intro">
    <div class="eyebrow">員郭醫院　個別化復健系統　2026/10/14 會議後修改</div>
    <h1>修改前後對照</h1>
    <p class="lede">左邊是改動前（<code>${E(BASE)}</code>），右邊是改動後（分支 <code>${E(HEAD_NAME)}</code>）。系統畫面用同一份內建示範資料、同一個時間（2026-10-14 07:56）分別在兩個版本上操作截取，只有程式不同。</p>
    <div class="meta"><span class="chip">${CONFIRMED} 項確認修改＋${ITEMS.length-CONFIRMED} 項候選</span><span class="chip">系統程式 ${st.sysFiles} 個檔案　+${st.sysAdd} −${st.sysRem}</span><span class="chip">系統畫面 ${SYS.length} 組</span><span class="chip">簡報 ${SLIDES.length} 頁</span><span class="chip">${commits.length} 個 commit</span></div>
    <p class="lede">產生時間：${new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})}。數字與 commit 清單以產生當下的工作目錄為準。</p>
    <nav class="toc" aria-label="頁內目錄"><a href="#items">修改一覽</a><a href="#system">系統畫面</a><a href="#deck">院長簡報</a><a href="#files">檔案變更</a><a href="#diff">看完整差異</a></nav>
  </header>
  <section id="items"><header><h2>修改一覽</h2><p>10/14 確認的 ${CONFIRMED} 項修改，以及之後勾選的 ${ITEMS.length-CONFIRMED} 個候選項目。點「看畫面」跳到對應的前後對照。</p></header>
    <div class="table-wrap"><table><thead><tr><th scope="col">項目</th><th scope="col">改動前</th><th scope="col">改動後</th><th scope="col"></th></tr></thead>
    <tbody>${ITEMS.map(([n,b,a,l])=>`<tr><th scope="row">${E(n)}</th><td>${E(b)}</td><td>${E(a)}</td><td><a href="#${l}">看畫面</a></td></tr>`).join('')}</tbody></table></div></section>
  <div class="mode" role="radiogroup" aria-label="對照方式"><span>對照方式</span>
    <label><input type="radio" name="mode" id="mode-side" value="side" checked> 並排</label><label><input type="radio" name="mode" id="mode-slide" value="slide"> 滑桿疊圖</label><span class="slide-hint">並排時點圖片可開啟原尺寸；滑桿疊圖時拖曳圖上的分隔線，左邊是改動前，右邊是改動後</span></div>
  <section id="system"><header><h2>系統畫面</h2><p>示範病人為陳阿公（PAC），角色為物理治療師；後台畫面以管理員身分截取。</p></header>
    <div class="pairs">${SYS.map(([k,t,n])=>pair('sys',k,t,n,1440,900)).join('')}</div></section>
  <section id="deck"><header><h2>院長簡報</h2><p>只列出有改動的 ${SLIDES.length} 頁，其餘頁面沒有變動。</p></header>
    <p class="note">簡報內的系統截圖，改動前是在 Windows 上手動操作拍攝，改動後是在 Mac 上以腳本重拍。兩者的示範資料規模相近（8 位病人、張伯伯解鎖 89 項），但字型與個別數字不同。比對時請以畫面上的用詞與功能為準。</p>
    <div class="pairs">${SLIDES.map(([p,t,n])=>pair('slide',String(p).padStart(2,'0'),`第 ${p} 頁　${t}`,n,1280,720)).join('')}</div></section>
  <section id="files"><header><h2>檔案變更</h2><p>行數取自 <code>git diff --numstat ${E(BASE)}</code>。綠色為新增行，紅色為刪除行。</p></header>
    <div class="table-wrap"><table class="files"><thead><tr><th scope="col">檔案</th><th scope="col">新增／刪除</th><th scope="col">內容</th></tr></thead>
    ${st.groups.map(([g,l])=>`<tbody><tr class="group"><th colspan="3">${E(g)}</th></tr>${l.map(([f,a,r,d])=>`<tr><td class="file">${E(f)}</td><td class="delta">${bar(a,r)}</td><td>${E(d)}</td></tr>`).join('')}</tbody>`).join('')}</table></div>
    <h3>Commit 紀錄（由舊到新）</h3><ol class="commits">${commits.map(([h,s])=>`<li><code>${E(h)}</code><span>${E(s)}</span></li>`).join('')}</ol></section>
  <section id="diff"><header><h2>看完整差異</h2><p>在 <code>yuankuo</code> 資料夾的終端機執行。也可以在 VS Code 的「原始檔控制」中比較兩個分支。</p></header>
    <div class="cmds">${CMDS.map(([l,c],i)=>`<div class="cmd"><span class="cmd-label">${E(l)}</span><div class="cmd-row"><code id="cmd${i}">${E(c)}</code><button type="button" class="copy" data-target="cmd${i}">複製</button></div></div>`).join('')}</div></section>
</div>
<script>
(function(){
  var KEY='yk-compare-mode';function setMode(m){document.body.dataset.mode=m;try{localStorage.setItem(KEY,m)}catch(e){}}
  var saved=null;try{saved=localStorage.getItem(KEY)}catch(e){}
  if(saved==='slide'){document.getElementById('mode-slide').checked=true;setMode('slide')}else setMode('side');
  document.querySelectorAll('input[name="mode"]').forEach(function(r){r.addEventListener('change',function(){if(r.checked)setMode(r.value)})});
  document.querySelectorAll('.stack').forEach(function(s){var i=s.querySelector('.handle');function upd(){var v=+i.value;s.style.setProperty('--pos',v+'%');
    if(v<14)s.dataset.hideBefore='';else delete s.dataset.hideBefore;if(v>86)s.dataset.hideAfter='';else delete s.dataset.hideAfter}i.addEventListener('input',upd);upd()});
  document.querySelectorAll('.copy').forEach(function(b){b.addEventListener('click',function(){
    var el=document.getElementById(b.dataset.target),t=el.textContent;
    function done(){b.textContent='已複製';b.dataset.done='1';setTimeout(function(){b.textContent='複製';delete b.dataset.done},1600)}
    function sel(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='已選取，請按複製鍵'}
    try{navigator.clipboard.writeText(t).then(done,sel)}catch(e){sel()}})});
})();
</script>`;
  return {full:`<!doctype html>\n<html lang="zh-Hant">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`,fragment:`${head.replace(/<meta charset[^>]*><meta name="viewport"[^>]*>\n/,'')}\n${body}\n`};
}

(async()=>{
  const img=path.join(OUT,'img');fs.mkdirSync(img,{recursive:true});
  for(const f of fs.readdirSync(img))if(f.endsWith('.jpg'))fs.rmSync(path.join(img,f));
  const missing=await capture(img),page=build(missing);
  fs.writeFileSync(path.join(OUT,'index.html'),page.full);
  if(FRAG)fs.writeFileSync(path.resolve(FRAG),page.fragment);
  console.log(`對照頁完成：${path.relative(root,OUT)}/index.html；圖片 ${fs.readdirSync(img).filter(f=>f.endsWith('.jpg')&&!f.startsWith('._')).length} 張`);
})().catch(e=>{console.error(e);process.exitCode=1});
