'use strict';
/* 願望初選、最終清單與生活功能象限。所有變更經共用事件入口保存。 */
const wishImage=w=>w.picture||iconOf((w.rel||[]).find(id=>TASK_BY_ID[id])||150);
const availableWishes=p=>[...wishCatalog(),...p.custom].filter(w=>w.enabled!==false||p.wishCandidates.includes(w.id));
const visibleWishes=p=>availableWishes(p).filter(w=>ui.wd==='all'||DemoCore.category(w)===ui.wd);
const starBadge=item=>`<span class="relation-stars" aria-label="${item.count} 個願望共同需要">${item.stars}</span> <small>${item.count} 個願望共同需要</small>`;
const wishSummary=p=>orderedWishes(p).map(w=>`<span class="badge">${esc(w.n)}</span>`).join('')||'<span class="muted">尚未確認最終願望</span>';

VIEWS.wishes=()=>{
  const p=P(),all=availableWishes(p),list=visibleWishes(p);
  const card=w=>{const selected=p.wishCandidates.includes(w.id);return `<article class="wish-card ${selected?'sel':''}">
    <img class="wish-picture" src="${esc(wishImage(w))}" alt="${esc(w.n)}的示範圖示" loading="lazy">
    <span class="badge gray">${w.source==='confirmed'?'甲方確認內容':w.source==='custom'?'自訂願望':'模擬內容／待甲方確認'}${w.enabled===false?'｜已停用':''}</span>
    <h3>${esc(w.n)}</h3><p class="sub">${esc(w.s||'')}</p>
    <div class="foot"><button class="${selected?'primary':'ghost-btn'}" data-act="wish-toggle" data-id="${esc(w.id)}" aria-pressed="${selected}">${selected?'取消初選':'加入初選'}</button>
    <button class="ghost-btn" data-act="wish-detail" data-id="${esc(w.id)}">詳情／影片</button></div></article>`};
  const candidate=p.wishCandidates.map(id=>wishObj(p,id)).filter(Boolean);
  return `<div class="hero"><div><div class="eyebrow">STEP 3 · 先初選，再共同確認</div><h1>${esc(p.name)}想做到什麼？</h1><p>先選取生活願望。再與治療師共同確認最終願望，數量不限，可依需求選取。關聯星等評估的是功能項目，不是願望排名。</p></div></div>
    <div class="notice info">目前圖片沿用既有任務圖示，僅供 Demo。正式願望、插圖參考與臨床對應仍待甲方提供。</div>
    <div class="tabs"><button class="ghost-btn ${ui.wd==='all'?'on':''}" data-act="wish-dom" data-d="all">全部</button>${Object.entries(DemoCore.CATEGORIES).map(([k,c])=>`<button class="ghost-btn ${ui.wd===k?'on':''}" data-act="wish-dom" data-d="${k}">${c.name}（${all.filter(w=>DemoCore.category(w)===k).length}）</button>`).join('')}</div>
    ${DemoCore.CATEGORIES[ui.wd]?`<h2>${DemoCore.CATEGORIES[ui.wd].guide}</h2>`:''}
    <div class="actions"><button class="secondary" data-act="book-open" data-k="wishes" data-id="${esc(list[0]?.id||'')}">大圖閱讀</button></div>
    <div class="wish-grid">${list.map(card).join('')||'<div class="panel empty">此分類尚無確認素材。可由管理員加入示範願望。</div>'}</div>
    <section class="panel final-wishes"><div class="section-title"><h2>初選清單（${candidate.length}）</h2><button class="danger" data-act="wish-clear">清除初選與最終清單</button></div>
    <p>點選下列按鈕，確認或取消最終願望。</p><div class="chip-row">${candidate.map(w=>`<button class="ghost-btn ${p.wishes.includes(w.id)?'on':''}" data-act="wish-final" data-id="${esc(w.id)}" aria-pressed="${p.wishes.includes(w.id)}">${p.wishes.includes(w.id)?'✓ 最終':'選為最終'}：${esc(w.n)}</button>`).join('')||'<p class="muted">尚未初選</p>'}</div>
    <h3>最終願望（${p.wishes.length}）</h3><div class="chip-row">${wishSummary(p)}</div>
    <button class="primary" data-act="nav" data-v="quad" ${!p.wishes.length?'disabled':''}>下一步：生活功能象限</button></section>
    <section class="panel"><h3>新增自訂願望</h3><div class="form-grid">
    <div class="form-field"><label for="cwName">病人的說法</label><input id="cwName"></div>
    <div class="form-field"><label for="cwSub">預期目標說明</label><input id="cwSub"></div>
    <div class="form-field"><label for="cwCategory">願望分類</label><select id="cwCategory">${categoryOptions('care')}</select></div></div>
    <button class="secondary" data-act="wish-custom">加入初選</button><p class="small">自訂願望尚無任務對應時，不產生星等。管理員可在後台設定對應。</p></section>`;
};
function categoryOptions(selected){return Object.entries(DemoCore.CATEGORIES).map(([k,c])=>`<option value="${k}" ${selected===k?'selected':''}>${c.name}</option>`).join('')}
function toggleCandidate(id){
  const p=P(),w=wishObj(p,id);if(!w)return;
  const index=p.wishCandidates.indexOf(id);
  if(index>=0){p.wishCandidates.splice(index,1);p.wishes=p.wishes.filter(wid=>wid!==id)}
  else {if(w.enabled===false)throw new Error('此願望已停用');p.wishCandidates.push(id)}
  syncFunctions(p);ui.pend=null;log('願望初選',`${index>=0?'取消':'加入'}：${w.n}`);
}
ACT['wish-toggle']=el=>{toggleCandidate(el.dataset.id);if(el.dataset.close)closeModal();render()};
ACT['wish-final']=el=>{
  const w=wishObj(P(),el.dataset.id);
  if(w?.enabled===false&&!P().wishes.includes(w.id))throw new Error('此願望已停用');
  DemoCore.selectFinal(P(),el.dataset.id);syncFunctions(P());ui.pend=null;
  log('確認最終願望',wishObj(P(),el.dataset.id)?.n);render();
};
ACT['wish-clear']=()=>{if(confirm('清除初選與最終願望？歷史計畫仍保留。')){P().wishCandidates=[];P().wishes=[];syncFunctions(P());ui.pend=null;log('清除願望','初選與最終清單');render()}};
ACT['wish-custom']=()=>{
  const n=$('#cwName').value.trim();if(!n)throw new Error('請輸入願望名稱');
  const w={id:'c'+Date.now(),n,s:$('#cwSub').value.trim(),category:$('#cwCategory').value,i:'⭐',source:'custom',rel:[]};
  P().custom.push(w);P().wishCandidates.push(w.id);log('新增自訂願望',n);render();
};

VIEWS.quad=()=>{
  const p=P(),items=relatedItems(p),tray=items.filter(item=>!p.functionPlace[item.id]),placed=items.filter(item=>p.functionPlace[item.id]);
  const trayKey=p.id+':'+p.wishes.join('|');
  if(ui.quadTrayKey!==trayKey){ui.quadTrayKey=trayKey;ui.quadMore=false;ui.quadBatchIds=items.slice(0,5).map(item=>item.id);ui.quadVisibleIds=ui.quadBatchIds.slice()}
  const visibleTray=tray.filter(item=>ui.quadVisibleIds.includes(item.id));
  const visiblePlaced=placed.filter(item=>ui.quadVisibleIds.includes(item.id));
  const chip=(item,onBoard=false)=>{
    const t=task(item.id);
    return `<div class="qchip ${ui.pend===item.id?'pending':''}" tabindex="0" role="button" aria-label="${esc(t.n)}，${item.count} 個願望共同需要；按 Enter 選取" data-tid="${item.id}">${onBoard?`<button class="quad-remove" data-act="quad-remove" data-id="${item.id}" aria-label="將${esc(t.n)}退回待放置" title="退回待放置">×</button>`:''}<img src="${iconOf(item.id)}" alt=""><span>#${item.id} ${esc(t.n)}</span><div>${starBadge(item)}</div></div>`;
  };
  const quadrant=k=>`<div class="q ${k}" data-quadrant="${k}"><b>${QN[k][0]} ${QN[k][1]}</b><span class="staff-only">${QN[k][2]}</span><div class="quad-cards">${visiblePlaced.filter(item=>qOf(p.functionPlace[item.id])===k).sort((a,b)=>(p.functionPlace[a.id].order||0)-(p.functionPlace[b.id].order||0)||a.id-b.id).map(item=>chip(item,true)).join('')}</div></div>`;
  return `<div class="hero"><div><div class="eyebrow">STEP 4 · 生活功能關聯星等</div><h1>哪些功能最重要？哪些最急？</h1><p>拖曳生活功能項目到象限。平板可先點項目，再點放置位置。星等代表願望交集，不代表能力或意願分數。</p></div></div>
    <div class="quad-wrap"><aside class="panel">
    <div class="section-title"><h3>待放置（${tray.length}）</h3><button class="ghost-btn" data-act="star-help">星等說明</button></div>
    <div class="tray ${ui.quadMore?'expanded':''}" id="tray">${visibleTray.map(item=>chip(item)).join('')}</div>
    ${items.length>ui.quadBatchIds.length?`<button class="ghost-btn" data-act="quad-more" aria-expanded="${!!ui.quadMore}" aria-controls="tray board">${ui.quadMore?'收合':'顯示更多'}</button>`:''}
    <p class="small">依命中數排序；同分依任務編號排序。</p>
    ${ui.pend!==null?'<div class="notice">已選項目，請點象限位置；亦可使用下方象限按鈕。</div>':''}
    <div class="actions">${Object.keys(QN).map(k=>`<button class="ghost-btn" data-act="quad-place" data-q="${k}" ${ui.pend===null?'disabled':''}>放入 ${QN[k][0]}</button>`).join('')}</div>
    <div class="actions"><button class="ghost-btn" data-act="quad-unplace" ${ui.pend===null?'disabled':''}>移回待放置</button><button class="danger" data-act="quad-reset">重設功能位置</button></div></aside>
    <div><div class="board-axis-y"><div class="axis-y"><span>高</span><span class="lab">急迫性</span><span>低</span></div>
    <div class="board" id="board"><div class="mid-v"></div><div class="mid-h"></div>${Object.keys(QN).map(quadrant).join('')}</div></div>
    <div class="axis-x"><span>低</span><span>重要性</span><span>高</span></div></div></div>
    ${!items.length?'<div class="notice">尚無對應功能。請確認最終願望，或請管理員補上願望任務對應。</div>':''}
    <section class="panel staff-only"><h3>放置結果</h3>${items.map(item=>`<p>${esc(task(item.id).n)} ${starBadge(item)}｜${p.functionPlace[item.id]?QN[qOf(p.functionPlace[item.id])][0]:'待放置'}</p>`).join('')}</section>
    <div class="actions"><button class="ghost-btn" data-act="nav" data-v="wishes">返回願望圖卡</button><button class="primary staff-only" data-act="nav" data-v="tasks">下一步：生活復健任務</button></div>`;
};
function setPlace(id,x,y){
  if(!canInterview())throw new Error('此身分不能操作象限');
  if(!relatedItems(P()).some(item=>item.id===id))throw new Error('此項目已無願望命中');
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('放置位置無效');
  const order=Math.max(0,...Object.values(P().functionPlace).map(pos=>pos.order||0))+1;
  P().functionPlace[id]={x:Math.round(Math.min(88,Math.max(12,x))),y:Math.round(Math.min(90,Math.max(10,y))),order};
  ui.pend=null;log('生活功能象限放置',`${task(id).n} → ${QN[qOf(P().functionPlace[id])][0]}`);render();
}
ACT['quad-reset']=()=>{if(confirm('重設目前生活功能位置？歷史計畫仍保留。')){P().functionPlace={};ui.quadTrayKey=null;ui.pend=null;log('重設生活功能象限','');render()}};
ACT['quad-more']=()=>{ui.quadMore=!ui.quadMore;ui.quadVisibleIds=ui.quadMore?relatedItems(P()).map(item=>item.id):ui.quadBatchIds.slice();ui.pend=null;render()};
ACT['quad-place']=el=>{if(ui.pend===null)return;const positions={tr:[75,25],br:[75,75],tl:[25,25],bl:[25,75]};setPlace(ui.pend,...positions[el.dataset.q])};
function returnToTray(id){
  if(!canInterview())throw new Error('此身分不能操作象限');
  if(!P().functionPlace[id])return;
  delete P().functionPlace[id];
  ui.pend=null;log('生活功能取消放置',task(id).n);render();
}
ACT['quad-unplace']=()=>{if(ui.pend!==null)returnToTray(ui.pend)};
ACT['quad-remove']=el=>returnToTray(Number(el.dataset.id));
ACT['star-help']=()=>openModal(`${mhead('生活功能關聯星等說明')}<p>系統計算不同最終願望共同需要同一項目的次數。</p><ul><li>★☆☆：1 個願望。</li><li>★★☆：2 個願望。</li><li>★★★：3 個以上願望；保留實際命中數。</li></ul><p>星等不是能力分數，也不是意願分數。星等只協助排序，不自動決定象限或長短期。</p>`);
AFTER.quad=()=>{
  const board=$('#board'),tray=$('#tray');if(!board)return;
  const inside=(el,x,y)=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom};
  document.querySelectorAll('.qchip[data-tid]').forEach(ch=>{
    ch.addEventListener('keydown',e=>{if(e.target.closest('.quad-remove'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();ui.pend=Number(ch.dataset.tid);render()}});
    ch.addEventListener('pointerdown',e=>{
      if(e.target.closest('.quad-remove')||e.button!==0||!canInterview())return;
      e.preventDefault();const id=Number(ch.dataset.tid),sx=e.clientX,sy=e.clientY;let ghost=null,moved=false;
      const move=ev=>{if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;moved=true;
        if(!ghost){ghost=ch.cloneNode(true);ghost.style.cssText='';ghost.classList.add('ghost');document.body.appendChild(ghost);ch.style.opacity='.3'}
        ghost.style.left=(ev.clientX-70)+'px';ghost.style.top=(ev.clientY-18)+'px'};
      const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);ghost?.remove();ch.style.opacity=''};
      const cancel=()=>cleanup();
      const up=ev=>{cleanup();
        if(!moved){ui.pend=ui.pend===id?null:id;render();return}
        runChange(()=>{
          if(inside(board,ev.clientX,ev.clientY)){const r=board.getBoundingClientRect();setPlace(id,(ev.clientX-r.left)/r.width*100,(ev.clientY-r.top)/r.height*100)}
          else if(inside(tray,ev.clientX,ev.clientY))returnToTray(id);
        });
      };
      window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
    });
  });
  board.addEventListener('click',e=>{if(ui.pend===null||e.target.closest('.qchip'))return;const r=board.getBoundingClientRect();runChange(()=>setPlace(ui.pend,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100))});
};
