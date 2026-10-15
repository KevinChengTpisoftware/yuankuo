/* 瀏覽器測試執行器：以獨立 Chromium 依序執行 async page => {...} 格式的測試檔。
 * 每個測試檔使用全新的瀏覽器工作階段，不讀取使用者的日常瀏覽器資料。
 * 失敗條件：測試檔不存在、拋出錯誤、項數為 0，或項數低於 tests/baseline.json 的基線。
 * 全部通過時，基線只會往上調（棘輪），避免測試被刪減後仍顯示通過。
 * 用法：node tests/run-browser.cjs [測試檔...]；預設執行 browser-smoke.js、browser-loop.js 與 browser-layout.js。 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),ORIGIN='http://127.0.0.1:8765';
const BASELINE=path.join(__dirname,'baseline.json');
const DEFAULT=['browser-smoke.js','browser-loop.js','browser-layout.js'];
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4','.json':'application/json'};

/* 以 context.route 直接從磁碟回應 http://127.0.0.1:8765/ 的請求，不開啟網路連接埠。
 * 多個執行器（例如審查代理）可同時執行，不會搶用連接埠。 */
async function mount(context){
  await context.route(ORIGIN+'/**',route=>{
    const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/,'')||'index.html';
    const file=path.resolve(root,rel);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return route.fulfill({status:404,body:''});
    return route.fulfill({status:200,contentType:TYPES[path.extname(file).toLowerCase()]||'application/octet-stream',body:fs.readFileSync(file)});
  });
}
const load=file=>new Function(`return (${fs.readFileSync(file,'utf8')})`)();
const readBaseline=()=>fs.existsSync(BASELINE)?JSON.parse(fs.readFileSync(BASELINE,'utf8')):{};

async function main(){
  const names=(process.argv.slice(2).length?process.argv.slice(2):DEFAULT).map(name=>path.basename(name));
  const base=readBaseline(),counts={};
  let failed=0,total=0;
  const browser=await chromium.launch();
  try{
    for(const name of names){
      const file=path.join(__dirname,name);
      if(!fs.existsSync(file)){failed++;console.log(`✘ ${name}：找不到測試檔`);continue}
      const context=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
      await mount(context);const page=await context.newPage();
      try{
        const out=await load(file)(page);
        counts[name]=out.passed;total+=out.passed;
        if(!out.passed)throw new Error('沒有任何檢查項目');
        if(base[name]&&out.passed<base[name])throw new Error(`檢查項目 ${out.passed} 項，少於基線 ${base[name]} 項`);
        console.log(`✔ ${name}：${out.passed} 項通過`);
        if(process.env.VERBOSE==='1')out.results.forEach(r=>console.log('   ·',r));
      }catch(error){
        failed++;
        console.log(`✘ ${name}：${error.message.split('\n')[0]}`);
      }finally{await context.close()}
    }
  }finally{await browser.close()}
  if(!failed){
    const next={...base};let raised=false;
    for(const [name,n] of Object.entries(counts))if(!next[name]||n>next[name]){next[name]=n;raised=true}
    if(raised)fs.writeFileSync(BASELINE,JSON.stringify(next,null,2)+'\n');
  }
  console.log(`瀏覽器檢查合計：${total} 項通過；${failed} 個測試檔失敗`);
  process.exitCode=failed?1:0;
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
module.exports={mount,ORIGIN};
