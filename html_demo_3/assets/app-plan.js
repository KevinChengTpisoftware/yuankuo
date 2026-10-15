'use strict';
/* ============ ⑥ 復健計畫（PAC／復健病房；版本化、不覆蓋） ============ */
function ensureDraft(p){
  if(!p.draft){const last=p.plans[p.plans.length-1];p.draft=last?clone(last.snap):{expect:[],long:[],short:[],prog:[],term:{}}}
  const d=p.draft,ws=orderedWishes(p),ids=ws.map(w=>w.id);
  d.expect=d.expect.filter(e=>ids.includes(e.wid));
  ids.forEach(id=>{if(!d.expect.find(e=>e.wid===id))d.expect.push({wid:id,text:wishObj(p,id).s||''})});
  d.expect.sort((a,b)=>ids.indexOf(a.wid)-ids.indexOf(b.wid));
  Object.keys(d.term).forEach(k=>{if(!p.sel.includes(+k))delete d.term[k]});
  return d;
}
/* 檢討與修訂提醒（R-07）：計算規則在 DemoCore.reminderInfo；畫面只負責呈現與設定。 */
/* 實際生效的提醒設定：指定日期之後已有對應新版本（日期已用掉），改顯示天數。 */
function reminderOf(p){
  const rs=DemoCore.reminderSettings(stageOf(p),db.reminderCfg,p.reminder),ri=DemoCore.reminderInfo(p.plans,rs,now().getTime());
  if(ri&&rs.reviseDate&&!ri.revise.byDate){rs.reviseDate=null;rs.reviseSrc=rs.reviseDaysSrc}
  if(ri&&rs.reviewDate&&!ri.review.byDate){rs.reviewDate=null;rs.reviewSrc=rs.reviewDaysSrc}
  return rs;
}
const isRevision=t=>DemoCore.REVISION_TYPES.includes(t);
function reviewInfo(p){return DemoCore.reminderInfo(p.plans,reminderOf(p),now().getTime())}
function reminderText(rs){return `${rs.reviewDate?`於 ${rs.reviewDate} 檢討`:`約每 ${rs.review}～${rs.review+rs.window} 天檢討`}，${rs.reviseDate?`並於 ${rs.reviseDate} 前`:`每 ${rs.revise} 天`}重新修訂`}
function setReminder(patch){
  if(!canPlan())throw new Error('此身分不能設定提醒');
  const next={};['review','revise','reviewDate','reviseDate'].forEach(k=>{if(patch[k]!==undefined&&patch[k]!==null&&patch[k]!=='')next[k]=patch[k]});
  DemoCore.validateReminder(next,P().id);P().reminder=next;
  const rs=reminderOf(P());log('個案提醒設定',Object.keys(next).length?reminderText(rs):'改回照護模式預設');
}
function setModeReminder(stage,patch){
  if(!canManage())throw new Error('只有管理員可設定照護模式提醒');
  const next={...(db.reminderCfg[stage]||{})};
  Object.entries(patch).forEach(([k,v])=>{if(v===null||v===''||v===undefined)delete next[k];else next[k]=v});
  DemoCore.validateReminder(next,stage);
  if(Object.keys(next).length)db.reminderCfg[stage]=next;else delete db.reminderCfg[stage];
  log('照護模式提醒設定',`${stage}：${['review','revise'].map(k=>`${k==='review'?'檢討':'修訂'} ${next[k]??'系統預設'}`).join('；')}`);
}
function reminderNotices(ri){
  const r=ri.review,v=ri.revise;
  const rv=r.byDate?(r.state==='upcoming'?`個案指定 ${fmtD(r.due)} 檢討`:`已到個案指定的檢討日（${fmtD(r.due)}），請重新檢視計畫`)
    :r.state==='upcoming'?`距上次修訂 ${ri.age} 天，建議 ${fmtD(r.due)}～${fmtD(r.lastDay)} 檢討（${r.src}：約每 ${r.from}～${r.to} 天）`
    :r.state==='due'?`已進入檢討期（距上次 ${ri.age} 天；${r.src}：約每 ${r.from}～${r.to} 天），請重新檢視計畫`:`已逾檢討期（距上次 ${ri.age} 天；${r.src}：約每 ${r.from}～${r.to} 天）`;
  const rule=v.byDate?`個案指定 ${fmtD(v.due)}`:`每 ${v.days} 天重新修訂`;
  const vv=v.state==='due'?`本輪已滿 ${ri.cyc} 天（${rule}；${v.src}），患者預期目標／長期／短期／預後目標需重新修訂並產生新版本（舊版保留）。`
    :`本輪第 ${ri.cyc} 天（${rule}；${v.src}），還有 ${v.daysLeft} 天。`;
  return `<div class="notice ${r.state==='upcoming'?'info':''}"><b>定期檢討：</b>${rv}</div><div class="notice ${v.state==='due'?'':'info'}"><b>週期修訂：</b>${vv}</div>`;
}
/* 提醒總覽（R-14）：列出所有需復健計畫的病人；未建計畫者優先，其餘依下一個到期日排序。日期與計畫頁共用 reviewInfo。 */
function remindRows(){
  const t=now().getTime();
  return db.patients.filter(planOn).map(p=>{
    const ri=reviewInfo(p),base={id:p.id,name:p.name,stage:stageOf(p),ver:p.plans.length};
    if(!ri)return {...base,noPlan:true,next:-1,level:'none'};
    const next=Math.min(ri.review.due,ri.revise.due);
    const level=ri.review.state==='overdue'?'overdue':(ri.review.state==='due'||ri.revise.state==='due')?'due':next-t<=7*DAY?'week':next-t<=14*DAY?'two':'later';
    return {...base,noPlan:false,next,level,reviewDue:ri.review.due,reviewState:ri.review.state,reviewByDate:ri.review.byDate,reviseDue:ri.revise.due,reviseState:ri.revise.state,reviseByDate:ri.revise.byDate,reviseDays:ri.revise.days,src:ri.revise.src};
  }).sort((a,b)=>a.next-b.next);
}
const REMIND_FILTERS=[['all','全部'],['due','已到期'],['week','7 天內'],['two','14 天內']];
function remindMatchBy(r,f){if(f==='all'||r.noPlan)return true;
  return f==='due'?['overdue','due'].includes(r.level):f==='week'?['overdue','due','week'].includes(r.level):['overdue','due','week','two'].includes(r.level)}
const remindMatch=r=>remindMatchBy(r,ui.rf||'all');
function adminRemind(){
  const rows=remindRows(),shown=rows.filter(remindMatch),f=ui.rf||'all';
  const counts=Object.fromEntries(REMIND_FILTERS.map(([k])=>[k,rows.filter(r=>remindMatchBy(r,k)).length]));
  const tag=r=>r.noPlan?'<span class="badge red">尚未建立計畫</span>':r.level==='overdue'?'<span class="badge red">檢討已逾期</span>':r.level==='due'?'<span class="badge amber">已到期</span>':r.level==='week'?'<span class="badge amber">7 天內</span>':r.level==='two'?'<span class="badge blue">14 天內</span>':'<span class="badge gray">未到期</span>';
  const rv={upcoming:'未到檢討期',due:'檢討期中',overdue:'已逾檢討期'};
  const row=r=>`<tr><td><b>${esc(r.name)}</b><br><span class="small">${esc(r.id)}</span></td><td>${esc(r.stage)}</td><td>${r.noPlan?'—':'v'+r.ver}</td>
    <td>${r.noPlan?'—':`${fmtD(r.reviewDue)}<br><span class="small">${rv[r.reviewState]}${r.reviewByDate?'｜指定日期':''}</span>`}</td>
    <td>${r.noPlan?'—':`${fmtD(r.reviseDue)}<br><span class="small">${r.reviseState==='due'?'已到期':'未到期'}｜${r.reviseByDate?'指定日期':`每 ${r.reviseDays} 天`}（${esc(r.src)}）</span>`}</td>
    <td>${tag(r)}</td><td><button class="ghost-btn" data-act="remind-open" data-id="${esc(r.id)}">開啟計畫</button></td></tr>`;
  return `<div class="panel"><div class="section-title"><div><h3>待修訂個案</h3><span class="small">需要復健計畫的病人，依下一個檢討或修訂日期排序；日期與各病人計畫頁的提醒相同（${fmtD(now())} 起算）</span></div></div>
    <div class="tabs">${REMIND_FILTERS.map(([k,l])=>`<button class="ghost-btn ${f===k?'on':''}" data-act="remind-filter" data-f="${k}">${l}（${counts[k]}）</button>`).join('')}</div>
    ${shown.length?`<div class="table-wrap"><table class="data-table" style="min-width:760px"><thead><tr><th>病人</th><th>照護模式</th><th>計畫</th><th>定期檢討</th><th>週期修訂</th><th>狀態</th><th>操作</th></tr></thead><tbody>${shown.map(row).join('')}</tbody></table></div>`:'<div class="empty">目前沒有符合條件的個案。</div>'}
    <p class="small">提醒只負責提醒，計畫隨時可修訂。天數可在「照護模式設定」或各病人的計畫頁調整。</p></div>`;
}
function reminderForm(p){
  const c=p.reminder||{},def=DemoCore.reminderSettings(stageOf(p),db.reminderCfg,{}),on=canPlan()&&!store.blocked;
  const row=(k,label)=>{const mode=c[k+'Date']?'date':c[k]!==undefined?'days':'default';
    return `<div class="form-field"><label>${label}</label><select data-remind-mode="${k}" ${on?'':'disabled'}><option value="default" ${mode==='default'?'selected':''}>依照護模式預設（${def[k]} 天；${def[k+'DaysSrc']}）</option><option value="days" ${mode==='days'?'selected':''}>自訂天數</option><option value="date" ${mode==='date'?'selected':''}>指定日期</option></select>
      <input type="number" min="1" max="365" data-remind-days="${k}" value="${c[k]??''}" placeholder="天數（1～365）" aria-label="${label}天數" ${mode==='days'?'':'hidden'} ${on?'':'disabled'}><input type="date" data-remind-date="${k}" value="${c[k+'Date']||''}" aria-label="${label}日期" ${mode==='date'?'':'hidden'} ${on?'':'disabled'}></div>`};
  return `<details class="remind-cfg" ${Object.keys(c).length?'open':''}><summary>提醒設定：${reminderText(reminderOf(p))}</summary><p class="small">各病人的住院與治療週期不同，可依個案設定天數或指定日期；未設定時使用照護模式預設。計畫隨時可修訂，提醒不限制儲存。</p>
    <div class="form-grid">${row('review','定期檢討')}${row('revise','週期修訂')}</div>${on?'<div class="actions"><button class="secondary" data-act="remind-save">儲存提醒設定</button></div>':''}</details>`;
}
function aiPrognosis(p){
  const ws=orderedWishes(p),aids=[...new Set(ws.flatMap(w=>(w.ad||[]).slice(0,2)))].slice(0,4),out=[];
  ws.slice(0,3).forEach(w=>out.push(`針對「${w.n}」：預期出院前，在${(w.ad&&w.ad[0])||'必要輔具'}的協助下達成基本${w.b||'功能'}，後續持續練習以朝獨立完成邁進。`));
  if(aids.length)out.push(`建議評估並提供輔具：${aids.join('；')}。`);
  out.push(`照顧者（${p.caregiver||'主要照顧者'}）需於出院前完成相關衛教與實作練習，並協助居家持續訓練、維護環境安全。`);
  out.push(`預期出院後仍需門診或社區復健追蹤，由治療師${reminderText(reminderOf(p))}目標。`);
  return out.map(text=>({text,src:'ai'}));
}
VIEWS.plan=()=>{
  const p=P(),st=stageOf(p);
  if(!planOn(p))return `<div class="hero"><div><div class="eyebrow">STEP 6 · 復健計畫</div><h1>目前照護模式不需要復健計畫</h1><p>${esc(p.name)} 目前為「${st}」，選完生活復健任務即可儲存，不強制產生短／長期復健計畫。</p></div></div><div class="panel empty"><p>若治療師評估仍需要，可選擇為此病人產出復健計畫（會留下紀錄）。</p><div class="actions" style="justify-content:center"><button class="ghost-btn" data-act="nav" data-v="tasks">← 回生活復健任務</button><button class="primary" data-act="plan-override">治療師選擇產出復健計畫</button></div></div>`;
  const d=ensureDraft(p),ri=reviewInfo(p),last=p.plans[p.plans.length-1];
  const termBtn=(id,t,l)=>`<button class="${d.term[id]===t?'on '+t:''}" data-act="term" data-id="${id}" data-t="${t}">${l}</button>`;
  const lines=a=>a.join('\n');
  return `<div class="hero"><div><div class="eyebrow">STEP 6 · 復健計畫（${st}）</div><h1>${esc(p.name)} 的復健計畫</h1><p>由患者預期目標出發，治療師為每項任務決定短／長期，並用片語或 AI 草稿完成預後目標。每次儲存都會產生新版本，不覆蓋舊內容。</p></div><div class="actions"><button class="ghost-btn" data-act="plan-reset">還原為最新版</button><button class="primary" data-act="plan-commit-modal">儲存為新版本（v${p.plans.length+1}）</button></div></div>
  <div class="panel"><div class="section-title"><h3>檢討與修訂提醒</h3><span class="badge">${last?`目前最新：v${last.ver}`:'尚無版本（初版）'}</span></div>
    ${ri?reminderNotices(ri):`<div class="notice info">尚未建立初版。完成下列內容後儲存即為 v1，之後${reminderText(reminderOf(p))}。</div>`}
    ${reminderForm(p)}<div class="actions"><span class="small">展示用：模擬時間快轉（目前 +${db.dayShift} 天）</span>${ri?'<button class="ghost-btn" data-act="shift-to" data-to="review">快轉到下次檢討</button><button class="ghost-btn" data-act="shift-to" data-to="revise">快轉到下次修訂</button>':''}<button class="ghost-btn" data-act="shift" data-n="0">還原</button></div></div>
    <div class="panel"><div class="section-title"><div><h3>① 患者預期目標</h3><span class="small">來源：最終願望文字，依確認順序呈現，可修改；象限配置的是生活功能項目</span></div><button class="ghost-btn" data-act="nav" data-v="quad">調整生活功能象限</button></div>
    ${d.expect.length?d.expect.map((e,i)=>{const w=wishObj(p,e.wid);return `<div class="expect-item"><h4>${esc(w.i||'⭐')} ${esc(w.n)}</h4><textarea data-in="expect" data-i="${i}" style="min-height:60px">${esc(e.text)}</textarea></div>`}).join(''):'<div class="empty">尚未選擇願望</div>'}</div>
  <div class="grid2">
    <div class="panel"><div class="section-title"><h3>② 長期目標</h3><button class="ghost-btn" data-act="goal-from-tasks" data-k="long">由長期任務帶入</button></div>${goalPhraseButtons('long')}<textarea data-in="goal" data-k="long" style="min-height:150px" placeholder="每行一個目標">${esc(lines(d.long))}</textarea></div>
    <div class="panel"><div class="section-title"><h3>③ 短期目標</h3><button class="ghost-btn" data-act="goal-from-tasks" data-k="short">由短期任務帶入</button></div>${goalPhraseButtons('short')}<textarea data-in="goal" data-k="short" style="min-height:150px" placeholder="每行一個目標">${esc(lines(d.short))}</textarea></div>
  </div>
  <div class="panel"><div class="section-title"><div><h3>④ 任務的短／長期（由治療師決定）</h3><span class="small">同一任務對不同病人的難度與時間點不同，故在此個別決定</span></div><button class="ghost-btn" data-act="nav" data-v="tasks">增減任務</button></div>
    ${p.sel.length?`<div class="table-wrap"><table class="data-table" style="min-width:560px"><thead><tr><th>任務</th><th>領域</th><th>短／長期</th></tr></thead><tbody>${p.sel.map(id=>{const t=task(id);return `<tr><td><img src="${iconOf(id)}" alt="" style="width:34px;height:34px;vertical-align:middle;margin-right:8px"><b>${esc(t.n)}</b></td><td>${t.d}</td><td><div class="term-switch">${termBtn(id,'short','短期')}${termBtn(id,'long','長期')}</div></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">尚未選擇任務</div>'}</div>
  <div class="panel"><div class="section-title"><div><h3>⑤ 預後目標</h3><span class="small">點選預設片語後可自行修改；也可由 AI 依預期目標，加入輔具與協助照顧者的建議</span></div><button class="secondary" data-act="prog-ai">✨ AI 依預期目標產生</button></div>
    <div class="chip-row" style="margin-bottom:14px">${db.phrases.map((x,i)=>`<button class="phrase" data-act="prog-add" data-i="${i}">＋ ${esc(x)}</button>`).join('')}</div>
    ${d.prog.map((x,i)=>`<div class="row-edit"><span class="ai-tag ${x.src==='ai'?'':x.src}" style="margin-top:10px">${x.src==='ai'?'AI 草稿':x.src==='preset'?'片語':'自填'}</span><textarea data-in="prog" data-i="${i}" style="min-height:58px">${esc(x.text)}</textarea><button class="danger" data-act="prog-del" data-i="${i}">刪除</button></div>`).join('')||'<div class="empty">尚無預後目標，請點選上方片語或使用 AI 產生。</div>'}
    <div class="actions"><button class="ghost-btn" data-act="prog-blank">＋ 自填一條</button></div>
    <p class="small">AI 產生為示範規則（依預期目標、願望所需輔具、照顧者協助組成草稿），內容須由治療師確認修改後才會儲存。</p></div>
  <div class="panel"><div class="section-title"><h3>版本歷程（${p.plans.length}）</h3><span class="small">每次修訂皆保留，並寫入操作紀錄</span></div>
    ${[...p.plans].reverse().map((v,i)=>`<div class="ver ${i===0?'cur':''}"><div class="section-title" style="margin:0"><div><b>v${v.ver}</b> <span class="badge ${v.type==='初版'?'':isRevision(v.type)?'amber':'blue'}">${v.type}</span> <span class="small">${fmtT(v.at)}｜${esc(v.by)}</span></div><button class="ghost-btn" data-act="ver-view" data-v="${v.ver}">檢視內容與差異</button></div><p class="small" style="margin:6px 0 0">原因：${esc(v.reason)}</p></div>`).join('')||'<div class="empty">尚無版本</div>'}</div>`;
};
function commitModal(){
  const p=P(),ri=reviewInfo(p);
  const rs=reminderOf(p),types=p.plans.length?[['定期檢討',`定期檢討（${rs.reviewDate?'指定 '+rs.reviewDate:`約每 ${rs.review}～${rs.review+rs.window} 天`}）`],['週期修訂',`週期修訂（${rs.reviseDate?'指定 '+rs.reviseDate:'每 '+rs.revise+' 天'}）`],['其他修訂','其他修訂']]:[['初版','初版']];
  openModal(`${mhead('儲存為新版本 v'+(p.plans.length+1))}<div class="form-grid"><div class="form-field full"><label>修訂類型</label><select id="cmType">${types.map(([v,l])=>`<option value="${v}" ${(ri?.revise.state==='due'&&v==='週期修訂')?'selected':''}>${l}</option>`).join('')}</select></div><div class="form-field full"><label>修訂原因 ${p.plans.length?'（必填）':''}</label><textarea id="cmReason" placeholder="例如：病人坐站轉換進步，短期目標升級為扶欄杆步行"></textarea></div></div><p class="small">儲存後舊版本仍可檢視，並會寫入操作紀錄（誰、何時、改了什麼）。</p><footer><button class="ghost-btn" data-act="close">取消</button><button class="primary" data-act="plan-commit">確認儲存</button></footer>`);
}
function planCommit(){
  const p=P(),d=ensureDraft(p),type=$('#cmType').value,reason=$('#cmReason').value.trim();
  if(p.plans.length&&!reason){toast('請填寫修訂原因');return}
  const snap=clone(d);
  snap.expect.forEach(e=>{e.name=wishObj(p,e.wid)?.n||e.wid});
  snap.taskIds=p.sel.slice();snap.functionPlace=clone(p.functionPlace);
  const v={ver:p.plans.length+1,at:now().toISOString(),by:who(),type,reason:reason||'建立初版復健計畫',snap};
  p.plans.push(v);log('復健計畫新版本',`v${v.ver}｜${type}｜${v.reason}`);closeModal();render();toast(`已儲存 v${v.ver}`);
}
function verView(n){
  const p=P(),v=p.plans.find(x=>x.ver===n),pv=p.plans.find(x=>x.ver===n-1),s=v.snap;
  const ch=k=>pv&&JSON.stringify(pv.snap[k])!==JSON.stringify(s[k])?' <span class="badge amber">已變更</span>':'';
  const wn=id=>esc(wishObj(p,id)?.n||id);
  openModal(`${mhead('v'+v.ver+'｜'+v.type)}<p class="small">${fmtT(v.at)}｜${esc(v.by)}｜原因：${esc(v.reason)}</p>
  <h4>患者預期目標${ch('expect')}</h4><ul>${s.expect.map(e=>`<li><b>${e.name?esc(e.name):wn(e.wid)}</b>：${esc(e.text)}</li>`).join('')||'<li>—</li>'}</ul>
  <h4>長期目標${ch('long')}</h4><ul>${s.long.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>—</li>'}</ul>
  <h4>短期目標${ch('short')}</h4><ul>${s.short.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>—</li>'}</ul>
  <h4>任務短／長期${ch('term')}</h4><ul>${Object.entries(s.term).map(([id,t])=>`<li>${esc(TASK_BY_ID[id]?.n)}：${t==='long'?'長期':'短期'}</li>`).join('')||'<li>—</li>'}</ul>
  <h4>預後目標${ch('prog')}</h4><ul>${s.prog.map(x=>`<li>${esc(x.text)}</li>`).join('')||'<li>—</li>'}</ul><footer><button class="primary" data-act="close">關閉</button></footer>`);
}

/* ============ 生活功能護照（不區分版本：進度與獎盃、願望與目標、150 項生活任務） ============ */
const PARTNERS=['自己完成','家屬夥伴','多功能型照顧服務員','醫療團隊'];
const stOf=(p,id)=>p.tasks[id]?.st||'未開始';
const BADGES=[
  ['初試啼聲','完成第一項任務','🌟',(n)=>n>=1],['復健之星','完成 10 項任務','⭐',(n)=>n>=10],['半百達人','完成 50 項任務','🎖️',(n)=>n>=50],
  ['銅盃大師','集滿任一領域全部銅盃','🥉',(n,p)=>DKEYS.some(k=>TASKS.filter(t=>t.d===k&&t.t==='bronze').every(t=>stOf(p,t.id)==='已解鎖'))],
  ['金盃王者','集滿任一領域全部金盃','🥇',(n,p)=>DKEYS.some(k=>TASKS.filter(t=>t.d===k&&t.t==='gold').every(t=>stOf(p,t.id)==='已解鎖'))],
  ['完美大滿貫','完成全部 150 項','🏆',(n)=>n>=150]
];
VIEWS.passport=()=>{
  const p=P(),pr=progressOf(p);
  const hero=`<div class="passport-hero"><div class="txt"><div class="eyebrow" style="color:#aee8bd">YUAN KUO HOSPITAL · LIFE UNLOCK PASSPORT</div><h1>生活功能 解鎖護照</h1><p>護照持有人：<b>${esc(p.name)}</b>｜照護模式：${stageOf(p)}</p><p>把治療目標變成一張張可以完成的生活任務；每一次練習，都會留下自己的進度。</p><div class="progress"><i style="width:${pr.pct}%"></i></div><div class="progress-meta"><span>${pr.done} / ${pr.total} 項已解鎖</span><span>達成率 ${pr.pct}%</span></div></div><img src="assets/icons/cup-150.png" alt=""></div>`;
  return `<div class="hero"><div><div class="eyebrow">PASSPORT</div><h1>生活功能護照</h1></div></div>${hero}${passportTrophies(p,pr)}${passportPlan(p)}${passportTasks(p)}`;
};
const stLabel=s=>s==='已解鎖'?'✅ 已解鎖':s==='進行中'?'🔄 進行中':'🔒 尚未開始';
const stClass=s=>s==='已解鎖'?'done':s==='進行中'?'prog':'';
/* 願望與任務連結：計畫任務（無計畫時為已選任務）依願望的對應任務分組；未對應願望的任務列為其他任務。 */
function passportLinks(p){
  const on=planOn(p),last=p.plans[p.plans.length-1],snap=on&&last?last.snap:null;
  const ids=snap?(snap.taskIds||Object.keys(snap.term).map(Number)):p.sel.slice(),term=snap?snap.term:{};
  const ws=snap?snap.expect.map(e=>({...(wishObj(p,e.wid)||{}),id:e.wid,n:e.name||wishObj(p,e.wid)?.n||e.wid,s:e.text})):orderedWishes(p);
  const used=new Set(),item=id=>({id,term:term[id]||'',st:stOf(p,id),partner:p.tasks[id]?.partner||''});
  const rows=ws.map(w=>{const rel=[...new Set((w.rel||[]).map(Number))];return {wish:w,tasks:rel.filter(id=>ids.includes(id)).map(id=>{used.add(id);return item(id)}),others:rel.filter(id=>!ids.includes(id)&&!db.taskOff[id]).length}});
  return {on,last,snap,rows,extra:ids.filter(id=>!used.has(id)).map(item)};
}
function passportTrophies(p,pr){
  const tr=Object.keys(TIERS).map(k=>{const all=TASKS.filter(t=>t.t===k),dn=all.filter(t=>stOf(p,t.id)==='已解鎖').length;return `<div class="trophy"><span style="font-size:30px">${TIERS[k][0]}</span><b>${dn}/${all.length}</b><span class="small">${TIERS[k][1]}</span></div>`}).join('')+`<div class="trophy"><img src="assets/icons/cup-150-1.png" style="width:38px;height:38px;object-fit:contain;${pr.done===150?'':'filter:grayscale(1);opacity:.4'}" alt=""><b>${pr.done===150?'1/1':'0/1'}</b><span class="small">白金成就</span></div>`;
  return `<div class="panel"><div class="section-title"><h3>獎盃櫃</h3></div><div class="trophy-row">${tr}</div><h4>成就徽章</h4><div class="badges">${BADGES.map(b=>`<span class="bdg ${b[3](pr.done,p)?'':'off'}">${b[2]} <b>${b[0]}</b><br><span class="small">${b[1]}</span></span>`).join('')}</div></div>`;
}
function passportPlan(p){
  const {on,last,snap,rows,extra}=passportLinks(p);
  const chip=t=>{const k=task(t.id);return `<button class="wl-task ${stClass(t.st)}" data-act="pp-open" data-id="${t.id}"><img src="${iconOf(t.id)}" alt="" loading="lazy"><span><b>${esc(k.n)}</b><span class="small">${stLabel(t.st)}${t.term?`｜${t.term==='short'?'短期':'長期'}`:''}</span>${t.partner?`<span class="small">共學夥伴：${esc(t.partner)}</span>`:''}</span></button>`};
  const goals=snap?`<div class="grid2"><div><h4>長期目標</h4><ul>${snap.long.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>—</li>'}</ul></div><div><h4>短期目標</h4><ul>${snap.short.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>—</li>'}</ul></div></div><h4>預後目標</h4><ul>${snap.prog.map(x=>`<li>${esc(x.text)}</li>`).join('')||'<li>—</li>'}</ul>`:'';
  return `<div class="panel"><div class="section-title"><h3>🎯 我的願望與目標</h3><span class="badge ${on?'':'gray'}">${stageOf(p)}${snap?`｜計畫 v${last.ver}`:''}</span></div>
    ${on&&!snap?'<div class="notice">此病人尚未建立復健計畫，請至「⑥ 復健計畫」建立。</div>':''}${!on?'<div class="notice info">目前照護模式不需建立復健計畫，以下顯示願望與已選的生活任務。</div>':''}
    ${goals}<h4>願望 → 對應的生活任務</h4><p class="small">點任務卡可更新狀態與共學夥伴；解鎖後，進度與獎盃同時更新。</p>
    ${rows.length?rows.map(r=>`<div class="wish-link" data-wish-link="${esc(r.wish.id)}"><div class="wl-head"><b>${esc(r.wish.i||'⭐')} ${esc(r.wish.n)}</b><div class="small">${esc(r.wish.s||'')}</div></div>${r.tasks.length?`<div class="wl-tasks">${r.tasks.map(chip).join('')}</div>`:`<p class="muted small">${snap?'本次計畫未列入此願望的任務':'尚未選取此願望的任務'}</p>`}${r.others?`<p class="small">另有 ${r.others} 項相關任務${snap?'未列入本次計畫':'尚未選取'}</p>`:''}</div>`).join(''):'<p class="muted">尚未選擇願望</p>'}
    ${extra.length?`<div class="wish-link"><div class="wl-head"><b>其他任務</b><div class="small">未對應到上述願望的任務</div></div><div class="wl-tasks">${extra.map(chip).join('')}</div></div>`:''}</div>`;
}
function passportTasks(p){
  const d=ui.pd,list=TASKS.filter(t=>t.d===d),tiers=Object.keys(TIERS);
  return `<div class="panel"><div class="section-title"><div><h3>150 項生活任務</h3><span class="small">依食、衣、住、行、育、樂與銅、銀、金分級；點選任務卡更新狀態與共學夥伴</span></div><button class="secondary" data-act="book-open" data-k="passport" data-id="${list[0].id}">📖 大圖書本閱讀</button></div>
  <div class="tabs">${DKEYS.map(k=>{const dn=TASKS.filter(t=>t.d===k&&stOf(p,t.id)==='已解鎖').length;return `<button class="ghost-btn ${d===k?'on':''}" data-act="pp-dom" data-d="${k}">${DOMAINS[k].emoji} ${k}・${DOMAINS[k].sub}（${dn}/25）</button>`}).join('')}</div>
  <h4>${DOMAINS[d].emoji} ${d}・${DOMAINS[d].sub}</h4><p class="small">${DOMAINS[d].desc}</p>
  ${tiers.map(k=>`<h4>${TIERS[k][0]} ${TIERS[k][1]}</h4><div class="task-grid" style="margin-bottom:18px">${list.filter(t=>t.t===k).map(t0=>{const t=task(t0.id),s=stOf(p,t.id),mine=p.sel.includes(t.id);return `<button class="pcard ${stClass(s)}" data-act="pp-open" data-id="${t.id}">${mine?'<span class="badge mine">本次任務</span>':''}<span class="status small"><b>${stLabel(s)}</b></span><img src="${iconOf(t.id)}" alt="" loading="lazy" data-act="book-open" data-k="passport" data-id="${t.id}" title="點圖放大" style="cursor:zoom-in"><h4>${esc(t.n)}</h4><p>${esc(t.x)}</p>${p.tasks[t.id]?.partner?`<span class="small">共學夥伴：${esc(p.tasks[t.id].partner)}</span>`:''}</button>`}).join('')}</div>`).join('')}
  <p class="source-note small">任務內容與圖示來源：院方「學習護照」與「解鎖功能護照」素材。</p></div>`;
}
function passportModal(id){
  const p=P(),t=task(id),s=stOf(p,id),cur=p.tasks[id]||{};
  openModal(`${mhead(esc(t.n))}<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><img src="${iconOf(id)}" style="width:110px;height:110px;object-fit:contain" alt=""><div style="flex:1 1 260px"><span class="tier ${t.t}">${TIERS[t.t][0]} ${TIERS[t.t][1]}</span> <span class="badge">${t.d}</span> <span class="small">#${id}</span><p style="line-height:1.7">${esc(t.x)}</p></div></div>
  <h4>任務狀態</h4><div class="actions">${['未開始','進行中','已解鎖'].map(x=>`<button class="ghost-btn ${s===x?'on':''}" data-act="pp-set" data-id="${id}" data-st="${x}">${x}</button>`).join('')}</div>
  <h4>共學夥伴</h4><div class="actions">${PARTNERS.map(x=>`<button class="ghost-btn ${cur.partner===x?'on':''}" data-act="pp-partner" data-id="${id}" data-p="${x}">${x}</button>`).join('')}</div>${cur.at?`<p class="small">解鎖時間：${fmtT(cur.at)}</p>`:''}<footer><button class="primary" data-act="close">完成</button></footer>`);
}

/* ============ 後台管理 ============ */
VIEWS.admin=()=>{
  const tabs=canManage()?[['patients','建檔／參與職類'],['famcfg','熟識人區塊'],['wishes','願望／任務對應'],['tasks','生活任務庫'],['stages','照護模式設定'],['remind','提醒總覽'],['goals','常用目標語句'],['phrases','預後片語'],['logs','操作紀錄（Audit Log）'],['export','匯出／資料']]:[['patients','建檔']];
  if(!tabs.some(([key])=>key===ui.ad))ui.ad=tabs[0][0];
  const bar=`<div class="tabs">${tabs.map(([k,l])=>`<button class="ghost-btn ${ui.ad===k?'on':''}" data-act="ad-tab" data-k="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(ui.ad==='patients')body=adminPatients();
  else if(ui.ad==='famcfg')body=adminFamCfg();
  else if(ui.ad==='remind')body=adminRemind();
  else if(ui.ad==='wishes')body=adminWishes();
  else if(ui.ad==='goals')body=adminGoals();
  else if(ui.ad==='tasks'){
    const list=TASKS.filter(t=>(ui.adom==='all'||t.d===ui.adom)&&(!ui.adq||(t.n+t.x+t.id).includes(ui.adq)));
    body=`<div class="notice info">短期／長期<b>不在後台預設</b>，改由治療師在各病人的復健計畫中決定。任務只能停用，不實體刪除。</div><div class="filterbar"><input id="adq" placeholder="搜尋…" value="${esc(ui.adq)}"><select id="adom"><option value="all">全部領域</option>${DKEYS.map(k=>`<option ${ui.adom===k?'selected':''}>${k}</option>`).join('')}</select><span class="badge">${list.length} 項</span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>圖示</th><th>#</th><th>領域</th><th>等級</th><th>任務名稱／說明</th><th>狀態</th><th>操作</th></tr></thead><tbody>${list.map(t0=>{const t=task(t0.id),off=db.taskOff[t.id];return `<tr class="${off?'off':''}"><td><img src="${iconOf(t.id)}" alt="" style="width:38px;height:38px;object-fit:contain" loading="lazy"></td><td>${t.id}</td><td>${t.d}</td><td>${TIERS[t.t][0]}</td><td><b>${esc(t.n)}</b><br><span class="small">${esc(t.x.slice(0,70))}${t.x.length>70?'…':''}</span></td><td>${off?'停用':'啟用'}</td><td><button class="ghost-btn" data-act="ad-edit" data-id="${t.id}">編輯</button> <button class="ghost-btn" data-act="ad-toggle" data-id="${t.id}">${off?'啟用':'停用'}</button></td></tr>`}).join('')}</tbody></table></div>`;
  }else if(ui.ad==='stages'){
    body=`<div class="panel"><h3>各照護模式是否啟用復健計畫</h3><div class="table-wrap"><table class="data-table" style="min-width:520px"><thead><tr><th>照護模式</th><th>說明</th><th>生活復健任務</th><th>短／長期復健計畫</th><th>檢討（天）</th><th>修訂（天）</th></tr></thead><tbody>${STAGES.map(s=>`<tr><td><b>${s}</b></td><td>${STAGE_DESC[s]}</td><td>✔ 所有人可用</td><td><label><input type="checkbox" data-act="stage-cfg" data-s="${s}" ${db.stageCfg[s]?'checked':''}> 啟用（需定期檢討）</label></td>${['review','revise'].map(k=>`<td><input type="number" min="1" max="365" style="width:96px" data-mode-remind="${k}" data-s="${s}" value="${db.reminderCfg[s]?.[k]??''}" placeholder="${DemoCore.REMIND[k]}" aria-label="${s}${k==='review'?'檢討':'修訂'}天數" ${canManage()&&!store.blocked?'':'disabled'}></td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small">檢討與修訂天數依院內規定設定；空白時使用系統預設（檢討 ${DemoCore.REMIND.review} 天起、修訂 ${DemoCore.REMIND.revise} 天）。治療師可再依個案於復健計畫頁調整天數或指定日期。每次調整保留版本。未啟用的照護模式，治療師仍可針對個別病人選擇產出。</p></div>`;
  }else if(ui.ad==='phrases'){
    body=`<div class="panel"><div class="section-title"><div><h3>預後目標預設片語</h3><span class="small">每行一句，治療師於復健計畫中可直接點選再修改</span></div><button class="ghost-btn" data-act="phrase-reset">還原預設</button></div><textarea data-in="phrases" style="min-height:300px">${esc(db.phrases.join('\n'))}</textarea></div>`;
  }else if(ui.ad==='logs'){
    body=`<div class="panel"><div class="section-title"><h3>共 ${db.logs.length} 筆</h3><button class="danger" data-act="log-clear">清除紀錄</button></div>${db.logs.length?db.logs.slice(0,300).map(l=>`<div class="log-row"><time>${fmtT(l.at)}｜${esc(l.by)}｜${esc(l.pname)}（${l.pid}）</time><b>${esc(l.action)}</b>　${esc(l.detail)}</div>`).join(''):'<div class="empty">尚無紀錄</div>'}</div>`;
  }else{
    body=adminExport();
  }
  return `<div class="hero"><div><div class="eyebrow">ADMIN</div><h1>後台管理</h1><p>任務庫維護、照護模式設定、片語設定與稽核紀錄。</p></div></div>${bar}${body}`;
};
AFTER.admin=()=>{
  $('#adq')?.addEventListener('change',e=>{ui.adq=e.target.value.trim();render()});
  $('#adom')?.addEventListener('change',e=>{ui.adom=e.target.value;render()});
  document.querySelectorAll('[data-fam-enabled]').forEach(el=>el.addEventListener('change',()=>runChange(()=>{
    if(!canManage())throw new Error('只有管理員可以設定參與職類');
    const key=el.dataset.famEnabled;
    P().famEnabled=el.checked?[...new Set([...P().famEnabled,key])]:P().famEnabled.filter(k=>k!==key);
    log('設定參與職類',famAll()[key].label+'：'+(el.checked?'參與':'不參與'));ui.famKey='';render();
  })));
  $('#importJson')?.addEventListener('change',async e=>{
    if(!canManage())return;
    const file=e.target.files[0];if(!file)return;
    if(file.size>5*1024*1024){toast('檔案上限為 5 MB');return}
    try{const text=await file.text();if(!canManage())throw new Error('身分已變更');prepareImport(text)}catch(error){importPreview=null;toast('匯入拒絕：'+error.message)}
  });
};

/* ============ 彈窗：病人 ============ */
const fld=(id,l,v,t='text')=>`<div class="form-field"><label>${l}</label><input id="${id}" type="${t}" value="${esc(v)}"></div>`;
function patientModal(isNew){
  const p=isNew?{name:'',sex:'男',age:'',bed:'',mrn:'',ext:{pac:'',xin:''},caregiver:'',decider:'',diagnosis:''}:P();
  openModal(`${mhead(isNew?'新增病人':'編輯病人主檔')}<div class="form-grid">${fld('fName','姓名',p.name)}<div class="form-field"><label>性別</label><select id="fSex"><option ${p.sex==='男'?'selected':''}>男</option><option ${p.sex==='女'?'selected':''}>女</option></select></div>${fld('fAge','年齡',p.age,'number')}${fld('fBed','床號',p.bed)}${fld('fMrn','院內病歷號（HIS）',p.mrn)}${fld('fPac','PAC 系統 ID',p.ext.pac)}${fld('fXin','杏翔系統 ID',p.ext.xin)}${fld('fDx','診斷',p.diagnosis)}${fld('fCg','主要照顧者',p.caregiver)}${fld('fDec','主要醫療決定者',p.decider)}${isNew?`<div class="form-field full"><label>初始照護模式</label><select id="fStage">${STAGES.map(s=>`<option>${s}</option>`).join('')}</select></div>`:''}</div><footer><button class="ghost-btn" data-act="close">取消</button><button class="primary" data-act="${isNew?'patient-add':'patient-save'}">儲存</button></footer>`);
}
const readPatient=()=>({name:$('#fName').value.trim()||'未命名',sex:$('#fSex').value,age:+$('#fAge').value||0,bed:$('#fBed').value||'—',mrn:$('#fMrn').value.trim(),ext:{pac:$('#fPac').value.trim(),xin:$('#fXin').value.trim()},diagnosis:$('#fDx').value,caregiver:$('#fCg').value,decider:$('#fDec').value});
function stageModal(){
  const p=P();
  openModal(`${mhead('變更照護模式')}<p>目前：<b>${stageOf(p)}</b>。變更後舊照護模式會保留在歷程中，不會被覆蓋。</p><div class="form-grid"><div class="form-field"><label>新照護模式</label><select id="sgStage">${STAGES.map(s=>`<option ${s===stageOf(p)?'disabled':''}>${s}</option>`).join('')}</select></div>${fld('sgDate','生效日期',fmtD(now()),'date')}<div class="form-field full"><label>備註</label><input id="sgNote" placeholder="例如：復健病房出院，轉一般復健"></div></div><footer><button class="ghost-btn" data-act="close">取消</button><button class="primary" data-act="stage-save">確認變更</button></footer>`);
}

/* ============ 事件 ============ */
const ACT={
  close:()=>closeModal(),
  nav:el=>{closeModal();if(el.dataset.admin)ui.ad=el.dataset.admin;go(el.dataset.v)},
  'new-patient':()=>patientModal(true),
  'edit-patient':()=>patientModal(false),
  'patient-save':()=>{Object.assign(P(),readPatient());log('編輯病人主檔',P().name);closeModal();render();toast('主檔已更新')},
  'patient-add':()=>{const v=readPatient(),next=Math.max(0,...db.patients.map(p=>Number(/^P-(\d+)$/.exec(p.id)?.[1])||0))+1,id='P-'+String(next).padStart(4,'0'),stg=$('#fStage').value;
    db.patients.push({id,...v,stages:[{stage:stg,from:fmtD(now()),to:null,note:'新建立'}],wishes:[],custom:[],place:{},sel:[],tasks:{},records:[],fam:{},famHist:[],plans:[],draft:null,planOverride:false});
    const added=db.patients[db.patients.length-1];added.wishCandidates=[];added.functionPlace={};added.famEnabled=Object.keys(famAll()).filter(k=>k!=='common');
    db.cur=id;ui.famKey='';log('新增病人',`${v.name}｜${stg}`);closeModal();ui.view='patient';render();toast('已新增病人')},
  'pick-patient':el=>{db.cur=el.dataset.id;ui.famKey='';ui.pend=null;save();render()},
  'stage-modal':()=>stageModal(),
  'stage-save':()=>{const p=P(),s=$('#sgStage').value,dt=$('#sgDate').value||fmtD(now()),prev=stageOf(p);
    const cur=p.stages.find(x=>!x.to);if(cur)cur.to=dt;p.stages.push({stage:s,from:dt,to:null,note:$('#sgNote').value});
    log('變更照護模式',`${prev} → ${s}（${dt}）`);closeModal();render();toast(`已變更為 ${s}`)},
  'fam-tab':el=>{ui.ft=el.dataset.k;render()},
  'fam-save':()=>{const p=P(),t=ui.ft,old=p.fam[t]||{},nw={...ui.famDraft};
    const f=famAll()[t],miss=liveFields(f).filter(x=>x[2].req&&!(nw[x[0]]||'').trim());
    if(miss.length){toast('請填寫必填欄位：'+miss.map(x=>x[1]).join('、'));return false} // 保留草稿，不寫入
    const changed=liveFields(f).some(x=>(old[x[0]]||'')!==(nw[x[0]]||''));if(!changed){toast('內容沒有變更');return}
    nw._by=who();nw._at=now().toISOString();p.fam[t]=nw;p.famHist.push({tab:t,by:nw._by,at:nw._at,data:clone(nw)});
    log('熟識人更新',f.label);ui.famKey='';render();toast('已儲存並留下紀錄')},
  'wish-dom':el=>{ui.wd=el.dataset.d;render()},
  'wish-detail':el=>wishDetail(el.dataset.id),
  'task-dom':el=>{ui.td=el.dataset.d;render()},
  'task-toggle':el=>{const p=P(),id=+el.dataset.id,i=p.sel.indexOf(id);if(i>=0)p.sel.splice(i,1);else p.sel.push(id);
    log('任務選取',`${i>=0?'取消':'加入'}：${TASK_BY_ID[id].n}`);if(el.dataset.close)closeModal();const y=window.scrollY;render();window.scrollTo({top:y})},
  'task-detail':el=>taskDetail(+el.dataset.id),
  'task-suggest':()=>{const p=P(),add=relatedItems(p).map(item=>item.id).filter(id=>!p.sel.includes(id));p.sel.push(...add);log('帶入建議任務',`${add.length} 項`);render();toast(`已帶入 ${add.length} 項`)},
  'task-record':()=>{const p=P();p.records.push({at:now().toISOString(),by:who(),stage:stageOf(p),ids:[...p.sel]});log('儲存任務紀錄',`${p.sel.length} 項（${stageOf(p)}，不需復健計畫）`);render();toast('已儲存本次任務紀錄，流程結束')},
  'plan-override':()=>{const p=P();if(!confirm(`${p.name} 目前為「${stageOf(p)}」，確定由治療師選擇產出復健計畫？`))return;p.planOverride=true;log('治療師選擇產出復健計畫',stageOf(p));go('plan')},
  term:el=>{const d=ensureDraft(P()),id=el.dataset.id;d.term[id]=d.term[id]===el.dataset.t?undefined:el.dataset.t;if(!d.term[id])delete d.term[id];save();const y=scrollY;render();scrollTo({top:y})},
  'goal-from-tasks':el=>{const p=P(),d=ensureDraft(p),k=el.dataset.k,add=Object.entries(d.term).filter(([,t])=>t===k).map(([id])=>`完成「${TASK_BY_ID[id].n}」`).filter(x=>!d[k].includes(x));
    if(!add.length){toast('沒有可帶入的任務，請先在④分配短／長期');return}d[k].push(...add);save();const y=scrollY;render();scrollTo({top:y})},
  'prog-add':el=>{const d=ensureDraft(P());d.prog.push({text:db.phrases[+el.dataset.i],src:'preset'});save();const y=scrollY;render();scrollTo({top:y})},
  'prog-blank':()=>{ensureDraft(P()).prog.push({text:'',src:'manual'});save();render()},
  'prog-del':el=>{ensureDraft(P()).prog.splice(+el.dataset.i,1);save();const y=scrollY;render();scrollTo({top:y})},
  'prog-ai':()=>{const p=P(),d=ensureDraft(p);if(!p.wishes.length){toast('請先選擇願望');return}d.prog=d.prog.filter(x=>x.src!=='ai').concat(aiPrognosis(p));log('AI 產生預後目標草稿',`${d.prog.filter(x=>x.src==='ai').length} 條`);const y=scrollY;render();scrollTo({top:y});toast('已產生 AI 草稿，請確認修改')},
  'plan-reset':()=>{if(confirm('放棄目前未儲存的修改，還原為最新版？')){P().draft=null;render()}},
  'plan-commit-modal':()=>commitModal(),
  'plan-commit':()=>planCommit(),
  'ver-view':el=>verView(+el.dataset.v),
  'shift-to':el=>{const ri=reviewInfo(P());if(!ri)return;const r=ri[el.dataset.to],n=Math.ceil((r.due-now().getTime())/DAY);
    if(n<=0){toast('已到期，不需快轉');return}db.dayShift+=n;log('展示：模擬時間快轉',`+${db.dayShift} 天`);render()},
  'remind-filter':el=>{ui.rf=el.dataset.f;render()},
  'remind-open':el=>{db.cur=el.dataset.id;ui.famKey='';ui.pend=null;go('plan')},
  'remind-save':()=>{const patch={};
    /* 輸入錯誤時只提示、不拋錯：拋錯會重畫畫面，清掉使用者已選的設定（D-09）。 */
    for(const k of ['review','revise']){const mode=$(`[data-remind-mode="${k}"]`).value,label=k==='review'?'定期檢討':'週期修訂';
      if(mode==='days'){const n=Number($(`[data-remind-days="${k}"]`).value);if(!Number.isInteger(n)||n<1||n>365){toast(`${label}：天數須為 1～365 的整數`);return false}patch[k]=n}
      else if(mode==='date'){const d=$(`[data-remind-date="${k}"]`).value;if(!d){toast(`${label}：請選擇日期`);return false}patch[k+'Date']=d}}
    setReminder(patch);render();toast('已儲存提醒設定')},
  shift:el=>{const n=+el.dataset.n;db.dayShift=n===0?0:db.dayShift+n;log('展示：模擬時間快轉',`+${db.dayShift} 天`);render()},
  'pp-dom':el=>{ui.pd=el.dataset.d;render()},
  'pp-open':el=>passportModal(+el.dataset.id),
  'pp-set':el=>{const p=P(),id=+el.dataset.id,st=el.dataset.st,cur=p.tasks[id]||{partner:'',at:''};
    const was=cur.st;p.tasks[id]={...cur,st,at:st==='已解鎖'?(cur.at||now().toISOString()):''};log('護照任務狀態',`${TASK_BY_ID[id].n} → ${st}`);
    passportModal(id);const y=scrollY;renderTop();$('#view').innerHTML=VIEWS[ui.view]();scrollTo({top:y});
    if(st==='已解鎖'&&was!=='已解鎖')celebrate('🎉 任務解鎖！',TASK_BY_ID[id].n)},
  'pp-partner':el=>{const p=P(),id=+el.dataset.id;p.tasks[id]={st:'未開始',at:'',...(p.tasks[id]||{}),partner:el.dataset.p};log('護照共學夥伴',`${TASK_BY_ID[id].n}：${el.dataset.p}`);passportModal(id);const y=scrollY;renderTop();$('#view').innerHTML=VIEWS[ui.view]();scrollTo({top:y})},
  'ad-tab':el=>{ui.ad=el.dataset.k;render()},
  'ad-toggle':el=>{const id=el.dataset.id;db.taskOff[id]=!db.taskOff[id];if(!db.taskOff[id])delete db.taskOff[id];db.patients.forEach(syncFunctions);log('任務啟用／停用',`${TASK_BY_ID[id].n}：${db.taskOff[id]?'停用':'啟用'}`);const y=scrollY;render();scrollTo({top:y})},
  'ad-edit':el=>{const t=task(+el.dataset.id);openModal(`${mhead('編輯任務 #'+t.id)}<div class="form-grid"><div class="form-field full"><label>任務名稱</label><input id="teN" value="${esc(t.n)}"></div><div class="form-field full"><label>任務說明</label><textarea id="teX">${esc(t.x)}</textarea></div></div><footer><button class="ghost-btn" data-act="close">取消</button><button class="primary" data-act="ad-save" data-id="${t.id}">儲存</button></footer>`)},
  'ad-save':el=>{db.taskEdit[el.dataset.id]={n:$('#teN').value,x:$('#teX').value};log('編輯任務',TASK_BY_ID[el.dataset.id].n);closeModal();render()},
  'phrase-reset':()=>{db.phrases=[...DEFAULT_PHRASES];log('還原預後片語','');render()},
  'log-clear':()=>{if(confirm('確定清除全部操作紀錄？')){db.logs=[];save();render()}},
  'ex-csv':()=>{const k=['id','d','t','n','x'],h=['#','領域','等級','任務名稱','說明'];const csv='﻿'+h.join(',')+'\n'+TASKS.map(t0=>{const t=task(t0.id);return k.map(c=>'"'+String(t[c]).replaceAll('"','""')+'"').join(',')}).join('\n');download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'life_tasks_150.csv');if(!store.blocked)log('匯出任務庫','CSV')},
  'ex-json':()=>{download(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),'yk-rehab-demo.json');if(!store.blocked)log('匯出全部資料','JSON')},
  'reset-demo':()=>{if(confirm('確定覆寫本機資料？請先下載原始資料。')){db=DemoCore.migrate(seed(),seed(),Object.keys(FAM).filter(k=>k!=='common'));store.blocked=false;ui.famKey='';ui.pend=null;render();toast('已重設示範資料')}}
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  if(el.tagName==='INPUT')return;
  if(el.dataset.act==='wish-toggle'&&e.target.closest('[data-act="wish-detail"]'))return;
  if(el.dataset.act==='task-toggle'&&e.target.closest('[data-act="task-detail"]'))return;
  invokeAction(el,e);
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.remindMode){const k=el.dataset.remindMode;$(`[data-remind-days="${k}"]`).hidden=el.value!=='days';$(`[data-remind-date="${k}"]`).hidden=el.value!=='date'}
  if(el.dataset.modeRemind)runChange(()=>{setModeReminder(el.dataset.s,{[el.dataset.modeRemind]:el.value===''?null:Number(el.value)});renderTop();render()});
  if(el.dataset.act==='stage-cfg')runChange(()=>{if(!canManage())throw new Error('只有管理員可設定照護模式');db.stageCfg[el.dataset.s]=el.checked;log('照護模式設定',`${el.dataset.s}：${el.checked?'啟用':'停用'}復健計畫`);renderTop();toast('已更新照護模式設定')});
});
document.addEventListener('input',e=>{
  const el=e.target,k=el.dataset.in;if(!k)return;
  if(k==='fam'){if(canFamily(ui.ft))ui.famDraft[el.dataset.k]=el.value;return}
  runChange(()=>{
    if(k==='phrases'){if(!canManage())throw new Error('只有管理員可維護片語');db.phrases=el.value.split('\n').map(x=>x.trim()).filter(Boolean)}
    else {
      if(!canPlan())throw new Error('此身分不能修改復健計畫');
      if(k==='goal')ensureDraft(P())[el.dataset.k]=el.value.split('\n').map(x=>x.trim()).filter(Boolean);
      else if(k==='expect')ensureDraft(P()).expect[+el.dataset.i].text=el.value;
      else if(k==='prog')ensureDraft(P()).prog[+el.dataset.i].text=el.value;
    }
    save();
  });
});
$('#patientSel').addEventListener('change',e=>runChange(()=>{db.cur=e.target.value;ui.famKey='';ui.pend=null;$('#book').classList.remove('open');closeModal();save();render()},{sessionOnly:store.blocked}));
$('#roleSel').addEventListener('change',e=>runChange(()=>{db.role=e.target.value;ui.famKey='';ui.pend=null;$('#book').classList.remove('open');closeModal();save();if(!canView(ui.view))ui.view='patient';render()},{sessionOnly:store.blocked}));
$('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});
$('#bigBtn').onclick=()=>Big.toggle();$('#muteBtn').onclick=()=>{$('#muteBtn').textContent=Snd.toggle()?'🔇':'🔊'};$('#muteBtn').textContent=Snd.isMuted()?'🔇':'🔊';
/* 載入與初次渲染由 app-access.js 執行，確保所有功能已註冊。 */
