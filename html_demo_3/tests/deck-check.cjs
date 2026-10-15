/* 簡報與系統一致性（關卡 G4）：
 *  A. 圖檔：SLIDES 引用的每個圖檔都存在（一律強制；找不到 SLIDES 判失敗）。
 *  B. 數字：簡報（html、md、SVG 文字）中的願望圖卡數、生活任務數、熟識人專業數與系統一致；每項至少比對到一處。
 *  C. 截圖新舊：SLIDES 引用的每張截圖，manifest 記錄的介面雜湊值須等於目前值，PNG 雜湊值須等於檔案內容。
 * A～E 一律強制。 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),deck=path.join(root,'20261014_院長簡報');
const HTML=path.join(deck,'院長專用個別人照護系統介紹.html'),MD=path.join(deck,'院長專用個別人照護系統介紹.md');
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex').slice(0,16);
const CN={一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
function num(s){
  if(/^\d+$/.test(s))return +s;
  if(!s.includes('十'))return CN[s];
  const [a,b]=s.split('十');return (a?CN[a]:1)*10+(b?CN[b]:0);
}
const listing=dir=>fs.readdirSync(dir).filter(n=>!n.startsWith('._')).sort().map(n=>`${n}:${fs.statSync(path.join(dir,n)).size}`).join('|');

/* 介面雜湊：截圖畫面取決於程式、樣式、示範資料、圖示與影片清單，以及截圖情境腳本。 */
function uiHash(){
  const h=crypto.createHash('sha256');
  const files=['index.html','assets/logo.png',...fs.readdirSync(path.join(root,'assets')).filter(n=>!n.startsWith('._')&&/\.(js|css)$/.test(n)).sort().map(n=>'assets/'+n),'tests/scenario.cjs','tests/capture-screens.cjs'];
  for(const f of files)h.update(f).update(fs.readFileSync(path.join(root,f)));
  for(const d of ['assets/icons','assets/videos','assets/audio'])if(fs.existsSync(path.join(root,d)))h.update(d).update(listing(path.join(root,d)));
  return h.digest('hex').slice(0,16);
}
/* 系統數字：以 vm 執行 data.js 與 app.js 的 FAM 定義，不依賴原始碼排版。 */
function system(){
  const ctx=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(root,'assets','data.js'),'utf8'),ctx);
  const app=fs.readFileSync(path.join(root,'assets','app.js'),'utf8'),start=app.indexOf('const FAM={');
  if(start<0)throw new Error('assets/app.js 找不到 FAM 定義');
  const end=app.indexOf('\n};',start);
  const FAM=vm.runInNewContext('('+app.slice(start+'const FAM='.length,end+2)+')');
  return {wishes:ctx.window.WISHES.length,tasks:ctx.window.TASKS.length,professions:Object.keys(FAM).filter(k=>k!=='common').length};
}
function deckText(){
  const html=fs.readFileSync(HTML,'utf8'),i=html.indexOf('const SLIDES'),j=html.indexOf('const slides');
  const svg=fs.readdirSync(path.join(deck,'_SVG')).filter(n=>n.endsWith('.svg')&&!n.startsWith('._')).map(n=>fs.readFileSync(path.join(deck,'_SVG',n),'utf8').replace(/<[^>]*>/g,' ')).join('\n');
  return {slides:i<0||j<0?null:html.slice(i,j),all:html+'\n'+fs.readFileSync(MD,'utf8')+'\n'+svg};
}
function check(){
  const out=[],sys=system(),{slides,all}=deckText();
  if(!slides){out.push({id:'A',name:'SLIDES 圖檔',ok:false,detail:'簡報 html 找不到 SLIDES 陣列'});return out}
  const imgs=[...new Set([...slides.matchAll(/"((?:_SVG|_screens)\/[^"]+)"/g)].map(m=>m[1]))];
  const missing=imgs.filter(f=>!fs.existsSync(path.join(deck,f)));
  out.push({id:'A',name:`SLIDES 引用圖檔存在（${imgs.length} 個）`,ok:imgs.length>0&&!missing.length,detail:missing.join('、')});
  const claims=(re,want,label)=>{
    const found=[...all.matchAll(re)].map(m=>num(m[1])).filter(n=>n!==undefined);
    const bad=[...new Set(found.filter(n=>n!==want))];
    out.push({id:'B',name:`${label}：系統 ${want}`,ok:found.length>0&&!bad.length,detail:!found.length?'簡報中找不到此數字':bad.length?`簡報出現 ${bad.join('、')}`:`簡報 ${found.length} 處一致`});
  };
  claims(/(\d+)\s*張(?:願望)?圖卡/g,sys.wishes,'願望圖卡數');
  claims(/(\d+)\s*項(?:生活)?(?:復健)?任務/g,sys.tasks,'生活任務數');
  claims(/([一二三四五六七八九十]+|\d+)\s*個?專業/g,sys.professions,'熟識人專業數');
  /* D. SVG 文字不超出畫布：以字級估算寬度（全形字 1 個字級、半形 0.6 個字級），依 text-anchor 計算左右邊界。 */
  const svgOut=[];
  for(const n of fs.readdirSync(path.join(deck,'_SVG')).filter(n=>n.endsWith('.svg')&&!n.startsWith('._'))){
    const src=fs.readFileSync(path.join(deck,'_SVG',n),'utf8'),vb=/viewBox="([\d.\s-]+)"/.exec(src);if(!vb)continue;
    const [,, W]=vb[1].trim().split(/\s+/).map(Number);
    for(const m of src.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)){
      const at=k=>(new RegExp(k+'="([^"]+)"').exec(m[1])||[])[1],x=+at('x'),fs_=+at('font-size')||16,anchor=at('text-anchor')||'start',t=m[2].trim();
      if(!t||Number.isNaN(x))continue;
      const w=[...t].reduce((s,c)=>s+(/[\u0000-\u00ff]/.test(c)?0.6:1)*fs_,0),left=anchor==='middle'?x-w/2:anchor==='end'?x-w:x;
      if(left<-2||left+w>W+2)svgOut.push(`${n}「${t.slice(0,12)}」`);
    }
  }
  out.push({id:'D',name:'SVG 文字未超出畫布',ok:!svgOut.length,detail:svgOut.join('、')});
  /* E. 講稿的「簡報頁面對照」表：頁面標題與畫面頁重點句須與 SLIDES 一致（去除 HTML 與空白後比對）。 */
  const arr=slides.slice(slides.indexOf('['),slides.indexOf('\n];')+2),S=vm.runInNewContext('('+arr+')');
  const norm=v=>String(v||'').replace(/<[^>]*>/g,'').replace(/[\s　]/g,'');
  const md=fs.readFileSync(MD,'utf8').replace(/\r/g,''),rows=[...md.matchAll(/^\|\s*(\d+)\s*\|[^|]*\|([^|]*)\|[^|]*\|([^|]*)\|\s*$/gm)];
  const tableBad=[];
  for(const [,num,title,take] of rows){
    const sl=S[+num-1];if(!sl){tableBad.push(`第 ${num} 列：SLIDES 無此頁`);continue}
    if(sl.title&&sl.type!=='cover'&&norm(sl.title)!==norm(title).replace(/^階段[①②③④⑤⑥]/,''))tableBad.push(`第 ${num} 頁標題：表「${title.trim()}」≠ SLIDES「${norm(sl.title)}」`);
    if(norm(sl.take)!==norm(take))tableBad.push(`第 ${num} 頁重點句：表「${take.trim()}」≠ SLIDES「${sl.take||''}」`);
  }
  out.push({id:'E',name:`講稿頁面對照表與 SLIDES 一致（${rows.length} 列）`,ok:rows.length===S.length&&!tableBad.length,detail:rows.length!==S.length?`表 ${rows.length} 列，SLIDES ${S.length} 頁；`+tableBad.join('；'):tableBad.join('；')});
  const mf=path.join(deck,'_screens','manifest.json'),now=uiHash();
  const shots=imgs.filter(f=>f.startsWith('_screens/'));
  if(!fs.existsSync(mf))out.push({id:'C',name:'截圖新舊',ok:false,detail:'沒有 manifest.json（截圖尚未由腳本產生）'});
  else{
    const m=JSON.parse(fs.readFileSync(mf,'utf8')).shots||{};
    const stale=shots.filter(f=>{const n=path.basename(f,'.png'),e=m[n];return !e||e.ui!==now||e.png!==sha(fs.readFileSync(path.join(deck,f)))});
    out.push({id:'C',name:`截圖新舊（${shots.length} 張）`,ok:!stale.length,detail:stale.length?`需重拍：${stale.map(f=>path.basename(f)).join('、')}`:`介面雜湊 ${now}`});
  }
  return out;
}
function enforced(){
  return {A:true,B:true,C:true,D:true,E:true};
}
if(require.main===module){
  const on=enforced();let blocking=0;
  for(const r of check()){
    if(!r.ok&&on[r.id])blocking++;
    console.log(`${r.ok?'✔':on[r.id]?'✘':'·'} G4-${r.id} ${r.name}${r.detail?'：'+r.detail:''}${!r.ok&&!on[r.id]?'（尚未強制）':''}`);
  }
  console.log(blocking?`簡報一致性檢查失敗：${blocking} 項`:'簡報一致性檢查通過（強制項目）');
  process.exitCode=blocking?1:0;
}
module.exports={check,uiHash,system,sha};
