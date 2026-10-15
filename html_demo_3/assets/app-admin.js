'use strict';
/* 示範選項不是正式臨床表單。保留原始文字，避免移轉時改寫評估內容。 */
const FAM_OPTIONS={
  'common.environment':['有電梯','無電梯','有門檻','無門檻'],
  'common.caregiver':['本人','配偶','子女','看護'],
  'PT.transfer':['獨立完成','少量協助','中度協助','完全協助'],
  'Pharm.risk':['無明顯風險','使用增加跌倒風險的藥物','吞嚥困難，需調整劑型','多重用藥（5 種以上）'],
  'PT.balance':['可獨立坐穩','站立需扶持','步行需協助'],
  'OT.adl':['獨立完成','少量協助','中度協助','完全協助'],
  'ST.swallow':['一般飲食','軟質飲食','需進一步評估'],
  'Dietitian.texture':['一般飲食','軟質飲食','需個別調整'],
  'Nurse.skin':['無皮膚問題','需追蹤疼痛','需追蹤皮膚狀況']
};
const enabledFam=p=>Object.keys(famOn()).filter(k=>k==='common'||p.famEnabled.includes(k));
function familiarContent(p,k,d){
  const f=famAll()[k]||{label:k,fields:[],off:false};
  return `<section class="panel"><h3>${esc(f.label)}${k!=='common'&&!p.famEnabled.includes(k)?'（本次未參與；保留歷史）':''}</h3>${d?`<p class="small">${esc(d._by||'')}｜${d._at?fmtT(d._at):'未填時間'}</p>${liveFields(f).filter(([key])=>d[key]).map(([key,label])=>`<p class="report-text"><b>${esc(label)}：</b>${esc(d[key])}</p>`).join('')}`:'<p class="muted">尚未填寫</p>'}</section>`;
}
VIEWS.familiar=()=>{
  const p=P(),keys=enabledFam(p);if(ui.ft!=='overview'&&!keys.includes(ui.ft))ui.ft='overview';
  const tabs=[['overview','跨專業總覽'],...keys.map(k=>[k,famAll()[k].label])];
  const bar=`<div class="tabs">${tabs.map(([k,label])=>`<button class="ghost-btn ${ui.ft===k?'on':''}" data-act="fam-tab" data-k="${k}">${esc(label)}</button>`).join('')}</div>`;
  let body;
  if(ui.ft==='overview')body=`<div class="grid2">${keys.map(k=>familiarContent(p,k,p.fam[k])).join('')}</div>`;
  else {
    const tab=ui.ft,f=famAll()[tab],key=p.id+':'+tab,editable=canFamily(tab);
    if(ui.famKey!==key){ui.famKey=key;ui.famDraft=clone(p.fam[tab]||{})}
    const history=p.famHist.filter(h=>h.tab===tab).slice().reverse();
    body=`<section class="panel"><h2>${esc(f.label)}</h2><p class="notice info">目前欄位與選項僅供示範，正式內容待各職類確認。${editable?'可使用預設選項，或自行輸入其他內容。':'此身分只能檢視。'}</p>
      <div class="form-grid">${liveFields(f).map(([k,label,opt])=>{
        const options=FAM_OPTIONS[tab+'.'+k]||[],value=ui.famDraft[k]||'';
        return `<div class="form-field full"><label for="fam-${k}">${esc(label)}${opt.req?'（必填）':''}</label>${options.length?`<select data-fam-preset="${k}" aria-label="${esc(label)}示範選項" ${editable?'':'disabled'}><option value="">選取示範選項</option>${options.map(option=>`<option ${value===option?'selected':''}>${option}</option>`).join('')}<option value="__other" ${value&&!options.includes(value)?'selected':''}>其他／保留既有文字</option></select>`:''}<textarea id="fam-${k}" data-in="fam" data-k="${k}" ${editable?'':'disabled'}>${esc(value)}</textarea></div>`;
      }).join('')}</div><button class="primary" data-act="fam-save" ${editable?'':'disabled'}>以「${who()}」身分儲存</button></section>
      <section class="panel"><h3>歷次內容（${history.length}）</h3>${history.map(h=>`<details><summary>${fmtT(h.at)}｜${esc(h.by)}</summary>${familiarContent(p,tab,h.data)}</details>`).join('')||'<p class="muted">尚無紀錄</p>'}</section>`;
  }
  return `<div class="hero"><div><h1>跨專業共同認識病人</h1><p>各職類填寫自己的內容。共同資料暫由護理師與管理員維護，正式職類與欄位仍待甲方確認。</p></div><button class="secondary" data-act="nav" data-v="report">預覽整合報表</button></div>${bar}${body}`;
};
AFTER.familiar=()=>document.querySelectorAll('[data-fam-preset]').forEach(select=>select.addEventListener('change',()=>{
  if(!canFamily(ui.ft))return;
  const key=select.dataset.famPreset;
  if(select.value&&select.value!=='__other'){ui.famDraft[key]=select.value;$('#fam-'+key).value=select.value}
  else if(select.value==='__other')$('#fam-'+key).focus();
}));
VIEWS.report=()=>{
  const p=P(),last=p.plans[p.plans.length-1];
  return `<div class="report-actions actions"><button class="ghost-btn" data-act="nav" data-v="familiar">返回熟識人</button><button class="primary" data-act="report-print">列印／瀏覽器另存 PDF</button></div>
    <article class="case-report"><h1>${esc(p.name)}｜跨專業整合報表</h1><p>示範資料｜${esc(p.id)}｜病歷號 ${esc(p.mrn)}｜${stageOf(p)}｜列印時間 ${fmtT(now())}</p>
    <p>本報表呈現已儲存內容，不包含尚未儲存的表單草稿。</p><h2>最終願望</h2><ul>${orderedWishes(p).map(w=>`<li>${esc(w.n)}：${esc(w.s||'')}</li>`).join('')||'<li>尚未確認</li>'}</ul>
    ${Object.keys(famOn()).filter(k=>k==='common'||p.famEnabled.includes(k)||p.fam[k]).map(k=>familiarContent(p,k,p.fam[k])).join('')}
    <section class="panel"><h2>評估歷程</h2>${p.famHist.map(h=>`<details><summary>${esc(famAll()[h.tab]?.label||h.tab)}｜${fmtT(h.at)}｜${esc(h.by)}</summary>${famAll()[h.tab]?familiarContent(p,h.tab,h.data):''}</details>`).join('')||'<p>尚無紀錄</p>'}</section>
    <section class="panel"><h2>最新照護計畫${last?' v'+last.ver:''}</h2>${last?['long','short'].map(k=>`<h3>${k==='long'?'長期':'短期'}目標</h3><ul>${last.snap[k].map(text=>`<li>${esc(text)}</li>`).join('')}</ul>`).join('')+`<h3>預後目標</h3><ul>${last.snap.prog.map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul>`:'<p>尚未建立</p>'}</section></article>`;
};
ACT['report-print']=()=>window.print();

function adminPatients(){
  return `<section class="panel"><h2>書記建檔與個案職類設定</h2><p class="notice info">本次使用 localStorage。模擬角色不等於正式登入。請勿輸入真實病人資料。</p>
    <div class="actions"><button class="primary" data-act="new-patient">新增病人</button><button class="ghost-btn" data-act="edit-patient">編輯目前病人</button></div>
    <h3>目前病人：${esc(P().name)}</h3><h4>參與職類</h4><div class="chip-row">${Object.entries(famAll()).filter(([k])=>k!=='common').map(([k,f])=>`<label><input type="checkbox" data-fam-enabled="${k}" ${P().famEnabled.includes(k)?'checked':''} ${canManage()?'':'disabled'}> ${esc(f.label)}${f.off?'（區塊停用中）':''}</label>`).join('')}</div>
    <p class="small">取消參與不會刪除既有評估與歷史。只有管理員可修改參與設定。</p></section>`;
}
function adminWishes(){
  const all=[...wishCatalog(),...db.patients.flatMap(p=>p.custom.map(w=>({...w,owner:p.name})))];
  return `<section class="panel"><div class="section-title"><h2>願望與任務對應</h2><button class="primary" data-act="wish-admin-new">新增示範願望</button></div>
    <p class="notice info">正式願望與圖片尚未全部提供。圖示先沿用任務素材。媒體只記錄 assets/ 本機路徑，不存入 localStorage。</p>
    <p class="small">最終願望數量不限。象限待放置區預設顯示前 5 項，可按「顯示更多」展開。</p>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>願望</th><th>分類</th><th>來源</th><th>對應任務</th><th>操作</th></tr></thead><tbody>${all.map(w=>`<tr><td>${esc(w.n)}${w.owner?'<br>個案：'+esc(w.owner):''}</td><td>${DemoCore.CATEGORIES[DemoCore.category(w)].name}</td><td>${w.source==='confirmed'?'甲方確認':w.owner?'個案自訂':'模擬內容'}${w.enabled===false?'／停用':''}</td><td>${(w.rel||[]).map(id=>'#'+id).join('、')||'尚未對應'}</td><td><button class="ghost-btn" data-act="wish-admin-edit" data-id="${esc(w.id)}">編輯／對應</button></td></tr>`).join('')}</tbody></table></div></section>`;
}
let editingWish=null;
function wishEditor(id){
  const customOwner=db.patients.find(p=>p.custom.some(w=>w.id===id));
  const w=id?(customOwner?.custom.find(w=>w.id===id)||wishCatalog().find(w=>w.id===id)):{id:'wish-demo-'+Date.now(),n:'',s:'',category:'work',rel:[],enabled:true,source:'demo'};
  if(!w)throw new Error('願望不存在');
  editingWish={id:w.id,owner:customOwner?.id,isNew:!id};
  openModal(`${mhead(id?'編輯願望與任務對應':'新增示範願望')}<div class="form-grid">
    ${fld('weName','願望名稱',w.n)}${fld('weSub','預期目標說明',w.s||'')}
    <div class="form-field"><label for="weCat">願望分類</label><select id="weCat">${categoryOptions(DemoCore.category(w))}</select></div>
    <div class="form-field"><label for="weEnabled">啟用狀態</label><select id="weEnabled"><option value="yes">啟用</option><option value="no" ${w.enabled===false?'selected':''}>停用</option></select></div>
    ${fld('wePicture','圖片路徑（選填，assets/ 下）',w.picture||'')}${fld('weVideo','影片路徑（選填，assets/ 下）',w.vid||'')}
    <div class="form-field full"><label>對應生活復健任務（同一願望不重複計數）</label><input id="weSearch" placeholder="搜尋任務編號或名稱"><div class="mapping-list">${TASKS.map(t=>`<label data-map-text="${esc(t.id+' '+t.n)}"><input type="checkbox" name="weRel" value="${t.id}" ${(w.rel||[]).includes(t.id)?'checked':''}> #${t.id} ${esc(task(t.id).n)}${db.taskOff[t.id]?'（停用）':''}</label>`).join('')}</div></div></div>
    <p class="small">新增內容標示為模擬內容。不自行認定為甲方正式素材。</p><footer><button class="ghost-btn" data-act="close">取消</button><button class="primary" data-act="wish-admin-save">儲存</button></footer>`);
  $('#weSearch').addEventListener('input',e=>document.querySelectorAll('[data-map-text]').forEach(label=>label.hidden=!label.dataset.mapText.includes(e.target.value.trim())));
}
ACT['wish-admin-new']=()=>wishEditor();
ACT['wish-admin-edit']=el=>wishEditor(el.dataset.id);
ACT['wish-admin-save']=()=>{
  if(!editingWish)throw new Error('請先選擇願望');
  const n=$('#weName').value.trim();if(!n)throw new Error('請輸入願望名稱');
  const change={n,s:$('#weSub').value.trim(),category:$('#weCat').value,enabled:$('#weEnabled').value==='yes',picture:DemoCore.mediaPath($('#wePicture').value.trim(),'image'),vid:DemoCore.mediaPath($('#weVideo').value.trim(),'video'),rel:[...document.querySelectorAll('[name="weRel"]:checked')].map(el=>Number(el.value))};
  if(editingWish.owner){const p=db.patients.find(p=>p.id===editingWish.owner);Object.assign(p.custom.find(w=>w.id===editingWish.id),change)}
  else if(editingWish.isNew)db.wishAdded.push({id:editingWish.id,...change,source:'demo'});
  else db.wishEdit[editingWish.id]={...(db.wishEdit[editingWish.id]||{}),...change};
  db.patients.forEach(syncFunctions);log('維護願望與任務對應',n);closeModal();editingWish=null;render();
};
function adminGoals(){
  return `<section class="panel"><h2>常用目標語句（示範）</h2><p class="notice info">正式「05 治療師常用目標語句」尚未提供。此處可維護示範語句，不代表甲方定稿。</p>
    <div class="form-grid">${['long','short'].map(k=>`<div class="form-field"><label for="gp-${k}">${k==='long'?'長期':'短期'}目標（每行一句）</label><textarea id="gp-${k}">${esc(db.goalPhrases[k].join('\n'))}</textarea></div>`).join('')}</div><button class="primary" data-act="goal-phrases-save">儲存語句</button></section>`;
}
function goalPhraseButtons(k){return `<p class="small">示範語句，正式內容待甲方提供。</p><div class="chip-row">${db.goalPhrases[k].map((text,i)=>`<button class="phrase" data-act="goal-phrase-add" data-k="${k}" data-i="${i}">＋ ${esc(text)}</button>`).join('')||'<span class="muted">尚無示範語句，可由管理員維護。</span>'}</div>`}
ACT['goal-phrases-save']=()=>{['long','short'].forEach(k=>db.goalPhrases[k]=$('#gp-'+k).value.split('\n').map(s=>s.trim()).filter(Boolean));log('維護目標語句','長期／短期示範');render()};
ACT['goal-phrase-add']=el=>{const k=el.dataset.k,text=db.goalPhrases[k]?.[Number(el.dataset.i)];if(!text)throw new Error('語句不存在');const d=ensureDraft(P());if(!d[k].includes(text))d[k].push(text);log('帶入目標語句',k);render()};

function adminExport(){
  return `<section class="panel"><h2>資料匯出與移轉</h2><p>JSON 包含病人、熟識人、計畫及操作紀錄。僅供模擬資料移轉。</p><div class="actions"><button class="secondary" data-act="ex-csv">匯出任務庫 CSV</button><button class="secondary" data-act="ex-json">匯出全部資料 JSON</button><button class="ghost-btn" data-act="export-raw">下載原始本機資料</button></div>
    <div class="form-field"><label for="importJson">匯入 JSON（先預覽，再確認）</label><input id="importJson" type="file" accept=".json,application/json"></div></section>
    <section class="panel"><h2>重設示範資料</h2><p>只在明確確認後覆寫本機資料。建議先下載原始資料。</p><button class="danger" data-act="reset-demo">重設示範資料</button></section>`;
}
let importPreview=null;
function prepareImport(text){
  const data=DemoCore.migrate(JSON.parse(text),seed(),Object.keys(FAM).filter(k=>k!=='common'));
  data.role=db.role;importPreview=data;
  openModal(`${mhead('JSON 匯入預覽')}<p>病人：${data.patients.length} 位｜計畫：${data.patients.reduce((n,p)=>n+p.plans.length,0)} 版｜操作紀錄：${data.logs.length} 筆</p><p class="notice">確認後會以匯入內容取代目前資料。尚未寫入。請先匯出備份。</p><footer><button class="ghost-btn" data-act="close">取消</button><button class="primary" data-act="import-confirm">確認取代</button></footer>`);
}
ACT['import-confirm']=()=>{if(!importPreview)throw new Error('沒有有效的匯入預覽');db=importPreview;db.patients.forEach(syncFunctions);log('匯入資料','經預覽確認');importPreview=null;closeModal();ui.famKey='';render()};
ACT['export-raw']=()=>{const raw=localStorage.getItem(KEY);if(raw===null)throw new Error('尚無原始本機資料');download(new Blob([raw],{type:'application/json'}),'yk-original-local-data.json')};

/* ============ 熟識人區塊設定（R-05） ============
 * 停用只隱藏，不刪除已填內容；欄位以固定代碼識別，改名不影響已填內容。 */
function famCfgEnsure(key){
  if(!canManage())throw new Error('只有管理員可設定熟識人區塊');
  if(!famAll()[key])throw new Error('找不到熟識人區塊：'+key);
  return db.famConfig.blocks[key]=db.famConfig.blocks[key]||{};
}
function famCfgSet(key,patch){
  const c=famCfgEnsure(key);
  if(patch.label!==undefined){const v=patch.label.trim();if(!v)throw new Error('區塊名稱不可空白');c.label=v;log('熟識人區塊設定',`${key}：名稱改為「${v}」`)}
  if(patch.off!==undefined){
    if(key==='common'&&patch.off)throw new Error('共同資料不能停用');
    if(patch.off)c.off=true;else delete c.off;
    log('熟識人區塊設定',`${famAll()[key].label}：${patch.off?'停用':'啟用'}`);
  }
}
function famCfgField(key,field,patch){
  const c=famCfgEnsure(key),f=famAll()[key].fields.find(x=>x[0]===field);if(!f)throw new Error('找不到欄位：'+field);
  if(patch.label!==undefined){const v=patch.label.trim();if(!v)throw new Error('欄位名稱不可空白');c.fieldLabel={...c.fieldLabel,[field]:v};log('熟識人欄位設定',`${famAll()[key].label}｜${f[1]} 改名為「${v}」`)}
  if(patch.off!==undefined){
    if(patch.off&&f[2].req)throw new Error('必填欄位不能停用');
    c.fieldOff={...c.fieldOff};if(patch.off)c.fieldOff[field]=true;else delete c.fieldOff[field];
    log('熟識人欄位設定',`${famAll()[key].label}｜${f[1]}：${patch.off?'停用':'啟用'}`);
  }
}
function famCfgAddField(key,label){
  const c=famCfgEnsure(key),v=(label||'').trim();if(!v)throw new Error('請輸入欄位名稱');
  /* 跳過任何病人已有內容或歷史的欄位代碼，避免舊內容被歸到新欄位。 */
  const used=new Set(famAll()[key].fields.map(f=>f[0]));
  db.patients.forEach(p=>{Object.keys(p.fam[key]||{}).forEach(k=>used.add(k));p.famHist.filter(h=>h.tab===key).forEach(h=>Object.keys(h.data||{}).forEach(k=>used.add(k)))});
  let n=1;while(used.has('f'+n))n++;
  if(c.custom)c.fields=[...c.fields,['f'+n,v]];else c.extra=[...(c.extra||[]),['f'+n,v]];
  log('熟識人欄位設定',`${famAll()[key].label}：新增欄位「${v}」`);
}
function famCfgAddBlock(label){
  if(!canManage())throw new Error('只有管理員可設定熟識人區塊');
  const v=(label||'').trim();if(!v)throw new Error('請輸入區塊名稱');
  /* 跳過設定中、或任何病人的參與設定、內容與歷史中出現過的區塊代碼。 */
  const used=new Set(Object.keys(famAll()));
  db.patients.forEach(p=>{p.famEnabled.forEach(k=>used.add(k));Object.keys(p.fam).forEach(k=>used.add(k));p.famHist.forEach(h=>used.add(h.tab))});
  let n=1;while(used.has('X'+n))n++;const key='X'+n;
  db.famConfig.blocks[key]={custom:true,label:v,fields:[['who','身分與關係',{req:true}],['content','內容'],['note','備註']]};
  db.patients.forEach(p=>{if(!p.famEnabled.includes(key))p.famEnabled.push(key)});
  log('熟識人區塊設定',`新增自訂區塊「${v}」`);return key;
}
function adminFamCfg(){
  const row=(k,[fk,label,opt])=>`<tr class="${opt.off?'off':''}"><td><input data-famcfg="field-label" data-k="${k}" data-f="${fk}" value="${esc(label)}" aria-label="欄位名稱">${opt.req?' <span class="small">（必填）</span>':''}</td><td><label><input type="checkbox" data-famcfg="field-off" data-k="${k}" data-f="${fk}" ${opt.off?'':'checked'} ${opt.req?'disabled':''}> 啟用</label></td></tr>`;
  return `<section class="panel"><h2>熟識人區塊設定</h2><p class="notice info">可調整區塊與欄位名稱、啟用或停用、新增欄位與自訂區塊。停用只隱藏，不刪除已填內容；改名不影響已填內容。自訂區塊由護理師填寫。</p>
    ${Object.entries(famAll()).map(([k,f])=>`<div class="famcfg-block ${f.off?'off':''}"><div class="famcfg-head"><input class="famcfg-name" data-famcfg="label" data-k="${k}" value="${esc(f.label)}" aria-label="區塊名稱">${k==='common'?'<span class="badge">必要區塊</span>':`<label><input type="checkbox" data-famcfg="off" data-k="${k}" ${f.off?'':'checked'}> 啟用</label>`}<span class="badge ${f.custom?'amber':'gray'}">${f.custom?'自訂':'內建'}</span></div>
      <div class="table-wrap"><table class="data-table" style="min-width:420px"><thead><tr><th>欄位名稱</th><th>狀態</th></tr></thead><tbody>${f.fields.map(x=>row(k,x)).join('')}</tbody></table></div>
      <div class="actions"><input id="famcfgField-${k}" placeholder="新欄位名稱" aria-label="新欄位名稱"><button class="ghost-btn" data-act="famcfg-field-add" data-k="${k}">新增欄位</button></div></div>`).join('')}
    <h3>新增自訂區塊</h3><p class="small">例如「其他參與者」或「家屬」。預設欄位：身分與關係（必填）、內容、備註。新區塊預設所有病人參與，可在「建檔／參與職類」個別取消。</p>
    <div class="actions"><input id="famcfgNew" placeholder="區塊名稱" aria-label="自訂區塊名稱"><button class="primary" data-act="famcfg-block-add">新增自訂區塊</button></div></section>`;
}
ACT['famcfg-field-add']=el=>{famCfgAddField(el.dataset.k,$('#famcfgField-'+el.dataset.k).value);render();toast('已新增欄位')};
ACT['famcfg-block-add']=()=>{famCfgAddBlock($('#famcfgNew').value);render();toast('已新增自訂區塊')};
document.addEventListener('change',e=>{
  const el=e.target,kind=el.dataset&&el.dataset.famcfg;if(!kind)return;
  runChange(()=>{
    if(kind==='label')famCfgSet(el.dataset.k,{label:el.value});
    else if(kind==='off')famCfgSet(el.dataset.k,{off:!el.checked});
    else if(kind==='field-label')famCfgField(el.dataset.k,el.dataset.f,{label:el.value});
    else if(kind==='field-off')famCfgField(el.dataset.k,el.dataset.f,{off:!el.checked});
    render();
  });
});
