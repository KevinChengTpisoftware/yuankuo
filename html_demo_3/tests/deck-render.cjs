/* 簡報逐頁檢查（關卡 G5 簡報版面）：在 1920 × 1080 逐頁開啟院長簡報，檢查：
 *  1. 該頁每張圖都載入成功；
 *  2. 投影片內容沒有被切掉、文字沒有超出投影片邊界、標題不超過 2 行、主圖高度至少 300 像素；
 *  3. 沒有瀏覽器錯誤。
 * 用法：node tests/deck-render.cjs [--out 目錄]；指定 --out 時，另存每頁截圖供人工檢視。 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {mount,ORIGIN}=require('./run-browser.cjs');
const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null};
const out=arg('--out');

async function main(){
  if(out)fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1920,height:1080},locale:'zh-TW'});
  await mount(context);const page=await context.newPage(),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(ORIGIN+'/'+encodeURI('20261014_院長簡報/院長專用個別人照護系統介紹.html'));
    const n=await page.evaluate(()=>document.querySelectorAll('.slide').length);
    if(!n)throw new Error('找不到投影片');
    for(let i=0;i<n;i++){
      await page.evaluate(i=>go(i),i);
      await page.waitForFunction(()=>[...document.querySelectorAll('.slide.active img')].every(img=>img.complete));
      const r=await page.evaluate(()=>{
        const s=document.querySelector('.slide.active'),issues=[];
        s.querySelectorAll('img').forEach(img=>{if(!img.naturalWidth)issues.push('圖檔未載入：'+img.getAttribute('src'))});
        /* 只判定真正看得到的問題：投影片內容被切掉、文字超出投影片邊界、設定裁切的元素放不下內容。
         * 字型字身略高於行高造成的 scrollHeight 差距不會被裁切，不列為問題。 */
        const box=s.getBoundingClientRect();
        if(s.scrollHeight>s.clientHeight+2||s.scrollWidth>s.clientWidth+2)issues.push(`投影片內容超出（${s.scrollWidth}×${s.scrollHeight} > ${s.clientWidth}×${s.clientHeight}）`);
        s.querySelectorAll('.s-title,.s-sub,.s-take,.take,.s-body').forEach(el=>{
          const r=el.getBoundingClientRect(),name=(el.className.match(/s-\w+|take/)||['文字'])[0];
          if(r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom+2)issues.push(`${name} 超出投影片邊界`);
          const cs=getComputedStyle(el),clip=/hidden|clip/.test(cs.overflowX+cs.overflowY);
          if(clip&&(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2))issues.push(`${name} 內容被裁切`);
        });
        /* 版面會自動縮小圖片來容納過長的文字，因此另外檢查標題行數與主圖大小。 */
        const t=s.querySelector('.s-title');
        if(t){const cs=getComputedStyle(t),lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2,lines=Math.round(t.getBoundingClientRect().height/lh);if(lines>2)issues.push(`標題 ${lines} 行（上限 2 行）`)}
        const imgs=[...s.querySelectorAll('.s-body img, img.shot, .shots img')].map(i=>i.getBoundingClientRect().height);
        if(imgs.length&&Math.max(...imgs)<300)issues.push(`主圖高度只有 ${Math.round(Math.max(...imgs))} 像素（下限 300）`);
        return {title:(t||s.querySelector('h1,h2')||{}).textContent||'',issues};
      });
      if(out)await page.screenshot({path:path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`)});
      if(r.issues.length)bad.push(`第 ${i+1} 頁「${r.title.trim().slice(0,20)}」：${r.issues.join('；')}`);
    }
    console.log(bad.length?bad.map(b=>'✘ '+b).join('\n'):`✔ 簡報 ${n} 頁：圖檔皆載入，無文字溢出`);
  }finally{await browser.close()}
  if(errors.length)console.log('✘ 瀏覽器錯誤：'+errors.join('；'));
  console.log(bad.length||errors.length?'簡報版面檢查失敗':'簡報版面檢查通過');
  process.exitCode=bad.length||errors.length?1:0;
}
main().catch(e=>{console.error(e);process.exitCode=1});
