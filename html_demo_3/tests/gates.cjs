/* 關卡總表：依序執行 G1～G5，輸出摘要。任一強制關卡失敗則結束代碼為 1。
 * G1 的通過數不得低於 tests/baseline.json 的 unit 基線；全部通過時基線只往上調。
 * 另檢查換行格式：系統檔案是否含 CRLF，須與 main 分支一致（I-04）。
 * 用法：node tests/gates.cjs [--skip-browser]；G6 獨立審查在里程碑結束時另行執行。 */
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),skipBrowser=process.argv.includes('--skip-browser');
const BASELINE=path.join(__dirname,'baseline.json');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:'0'}});return {ok:r.status===0,out:(r.stdout||'')+(r.stderr||'')}};

function unitGate(){
  const r=run('node',['--test','tests/demo-core.test.cjs']),pass=+(/ℹ pass (\d+)/.exec(r.out)?.[1]||0);
  const base=JSON.parse(fs.readFileSync(BASELINE,'utf8'));
  if(r.ok&&pass<base.unit)return {ok:false,out:r.out+`\n✘ 單元測試 ${pass} 項，少於基線 ${base.unit} 項`};
  if(r.ok&&pass>base.unit)fs.writeFileSync(BASELINE,JSON.stringify({...base,unit:pass},null,2)+'\n');
  return r;
}
/* 換行格式：比對檔案是否含 CRLF 是否與 main 版本一致；只檢查 main 中存在的系統檔案。 */
function eolGate(){
  const files=['index.html',...fs.readdirSync(path.join(root,'assets')).filter(n=>/\.(js|css)$/.test(n)&&!n.startsWith('._')).map(n=>'assets/'+n)];
  const bad=[];
  for(const f of files){
    const r=spawnSync('git',['show',`main:html_demo_3/${f}`],{cwd:root,encoding:'buffer'});
    if(r.status!==0)continue;
    const base=r.stdout,cur=fs.readFileSync(path.join(root,f));
    const crlf=b=>b.toString('latin1').split('\n').filter(l=>l.endsWith('\r')).length;
    const want=crlf(base)>0,has=crlf(cur)>0;
    if(want!==has)bad.push(`${f}（main ${want?'含':'無'} CRLF，目前${has?'含':'無'} CRLF）`);
  }
  return {ok:!bad.length,out:bad.length?bad.map(b=>'✘ 換行格式改變：'+b).join('\n'):'換行格式與 main 一致'};
}
const GATES=[
  ['G1 單元測試',unitGate],
  ['G2/G5 瀏覽器與版面',()=>run('node',['tests/run-browser.cjs']),true],
  ['G3 術語檢查',()=>run('node',['tests/term-lint.cjs'])],
  ['G3 換行格式',eolGate],
  ['G4 簡報一致性',()=>run('node',['tests/deck-check.cjs'])],
  ['G5 簡報版面',()=>run('node',['tests/deck-render.cjs']),true]
];
let failed=0,skipped=0;const summary=[];
for(const [name,fn,browser] of GATES){
  if(browser&&skipBrowser){skipped++;summary.push(`- · ${name}：略過`);continue}
  const t=Date.now(),{ok,out}=fn();if(!ok)failed++;
  const tail=out.trim().split('\n').filter(l=>/^ℹ (pass|fail) |合計|通過|失敗|一致|少於/.test(l)).slice(-3).join('；');
  summary.push(`- ${ok?'✔':'✘'} ${name}（${((Date.now()-t)/1000).toFixed(0)} 秒）：${tail}`);
  if(!ok)console.log(`\n===== ${name} 失敗輸出 =====\n${out.split('\n').filter(l=>/✘|✖|not ok|Error|錯誤|失敗|expected|actual|少於/.test(l)).slice(0,40).join('\n')}`);
}
console.log('\n'+summary.join('\n'));
console.log(failed?`\n關卡失敗：${failed} 項`:skipped?`\n已執行的關卡通過；略過 ${skipped} 項，不代表全部通過`:'\n全部強制關卡通過');
process.exitCode=failed?1:0;
