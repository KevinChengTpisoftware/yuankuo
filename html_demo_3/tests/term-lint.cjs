/* 術語檢查（關卡 G3）：掃描系統與院長簡報中的禁用詞。規則定義見下方 RULES。
 * 全部規則一律強制：任何未豁免的命中都判失敗。
 * SVG 只掃描文字內容，不掃描標籤與屬性。
 * 豁免：只有 T2、T3、T5 可用。同一行加上 lint-allow:Tn 可豁免該行的命中；T5 另豁免「預設…80 天」的說明文字。
 * 豁免逐處比對，並全部列出，供審查。
 * 用法：node tests/term-lint.cjs [--all]。 */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),deck=path.join(root,'20261014_院長簡報');
const list=(dir,ext)=>fs.readdirSync(dir).filter(n=>!n.startsWith('._')&&n.endsWith(ext)).map(n=>path.join(dir,n));
const SCOPES={
  system:[path.join(root,'index.html'),...list(path.join(root,'assets'),'.js'),path.join(root,'assets','style.css'),path.join(root,'操作示範與設計說明.md')],
  deck:[path.join(deck,'院長專用個別人照護系統介紹.md'),path.join(deck,'院長專用個別人照護系統介紹.html'),...list(path.join(deck,'_SVG'),'.svg')]
};
const RULES=[
  {id:'T1',name:'外部系統名稱只用「杏翔」',pattern:/信祥|信翔|信想|欣祥/g},
  {id:'T2',name:'「照護階段」改為「照護模式」',pattern:/照護階段/g,allowable:true},
  {id:'T2b',name:'不以單字「階段」指稱照護模式（現階段、六個／六種流程階段、階段 ①～⑥、任務階段 A～D 除外；專案分期請用「第一期、第二期」）',pattern:/(?<![現六])(?<!六[個種])(?<!所屬)(?<!流程)階段(?!\s*[①②③④⑤⑥A-D])/g,allowable:true,scopes:['system','deck']},
  {id:'T3',name:'「協助夥伴」改為「共學夥伴」',pattern:/協助夥伴/g,allowable:true},
  {id:'T4',name:'護照不區分 1.0／2.0',pattern:/護照\s*[12]\.0|(?<![\d.])[12]\.0(?=\s*[：:｜|與和、／]|\s*(?:150 項|個人照護計畫|任務闖關))/g},
  {id:'T5',name:'修訂時程不寫死 80 天',pattern:/(?<![0-9])80\s*天/g,allowable:true,allow:/預設[^。；\n]{0,12}80\s*天/g},
  {id:'T7',name:'報告版簡報不含寫給內部看的提示（候選 C2）',pattern:/院長可強調|如實報告|請如實|TODO|待確認|（？）/g,scopes:['deck'],files:/\.html$|\.svg$/},
  {id:'T6',name:'熟識人專業數不寫死七個',pattern:/七個專業|7\s*個專業|七專業/g}
];
const svgText=src=>src.replace(/<[^>]*>/g,m=>' '.repeat(m.length));
function scan(){
  const hits=[],allowed=[];
  for(const [scope,files] of Object.entries(SCOPES))for(const file of files){
    if(!fs.existsSync(file))continue;
    let src=fs.readFileSync(file,'utf8');const svg=file.endsWith('.svg');if(svg)src=svgText(src);
    src.split('\n').forEach((line,i)=>{
      for(const rule of RULES){
        if(rule.scopes&&!rule.scopes.includes(scope))continue;
        if(rule.files&&!rule.files.test(file))continue;
        const spans=rule.allow?[...line.matchAll(rule.allow)].map(m=>[m.index,m.index+m[0].length]):[];
        const marker=rule.allowable&&!svg&&line.includes(`lint-allow:${rule.id}`);
        for(const m of line.matchAll(rule.pattern)){
          const hit={rule:rule.id,scope,file:path.relative(root,file),line:i+1,text:line.slice(Math.max(0,m.index-18),m.index+m[0].length+18).trim()};
          if(marker||spans.some(([a,b])=>m.index>=a&&m.index<b))allowed.push(hit);else hits.push(hit);
        }
      }
    });
  }
  return {hits,allowed};
}
function enforcement(){
  const out={};
  for(const rule of RULES)for(const scope of rule.scopes||Object.keys(SCOPES))out[rule.id+'.'+scope]=true;
  return {on:out,warn:[]};
}
if(require.main===module){
  const all=process.argv.includes('--all'),{on,warn}=enforcement(),{hits,allowed}=scan();
  let blocking=0;
  for(const rule of RULES)for(const scope of rule.scopes||Object.keys(SCOPES)){
    const mine=hits.filter(h=>h.rule===rule.id&&h.scope===scope),enforced=on[rule.id+'.'+scope];
    if(!mine.length){console.log(`✔ ${rule.id}.${scope} ${rule.name}：零命中`);continue}
    if(enforced)blocking+=mine.length;
    console.log(`${enforced?'✘':'·'} ${rule.id}.${scope} ${rule.name}：${mine.length} 處${enforced?'（強制）':'（尚未強制）'}`);
    if(enforced||all)mine.forEach(h=>console.log(`   ${h.file}:${h.line}  …${h.text}…`));
  }
  warn.forEach(w=>console.log('⚠ '+w));
  if(allowed.length){console.log(`豁免 ${allowed.length} 處：`);allowed.forEach(h=>console.log(`   [${h.rule}] ${h.file}:${h.line}  …${h.text}…`))}
  console.log(blocking?`術語檢查失敗：${blocking} 處強制命中`:'術語檢查通過（強制規則零命中）');
  process.exitCode=blocking?1:0;
}
module.exports={scan,RULES,SCOPES};
