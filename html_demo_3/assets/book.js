'use strict';
/* 長者大字模式 + 大圖書本閱讀（一頁一個任務／願望，圖與字都放到最大） */
const Big=(()=>{
  let on=DemoCore.readPreference('yk-big','0')==='1';
  const apply=()=>{document.body.classList.toggle('big',on);const b=document.querySelector('#bigBtn');if(b)b.classList.toggle('on',on)};
  apply();
  return{toggle(){on=!on;const saved=DemoCore.writePreference('yk-big',on?'1':'0');apply();if(!saved)toast('大字模式已切換，但偏好設定未保存')}};
})();
const Book=(()=>{
  let kind='',ids=[],i=0;
  const el=()=>document.querySelector('#book');
  function list(k){
    const p=P();
    if(k==='tasks')return taskList().filter(t=>!db.taskOff[t.id]).map(t=>t.id);
    if(k==='passport')return TASKS.filter(t=>t.d===ui.pd).map(t=>t.id);
    if(k==='plan')return p.sel.slice();
    if(k==='wishes')return visibleWishes(p).map(w=>w.id);
    return[];
  }
  function draw(){
    const p=P(),id=ids[i],last=ids.length-1;let body='',acts='';
    if(kind==='wishes'){
      const w=wishObj(p,id),sel=p.wishCandidates.includes(id);
      body=`<img class="bk-img" src="${esc(wishImage(w))}" alt="${esc(w.n)}的示範圖示"><h2>${esc(w.n)}</h2><p>${esc(w.s||'')}</p><span class="small">模擬圖示／待甲方確認</span>`;
      acts=`<button class="${sel?'on':''}" data-b="wish" ${canInterview()?'':'disabled'}>${sel?'✓ 已初選，點選取消':'加入初選'}</button>${w.vid?'<button data-b="video">查看示範影片</button>':''}`;
    }else{
      const t=task(id),s=stOf(p,id),sel=p.sel.includes(id);
      body=`<img class="bk-img" src="${iconOf(id)}" alt=""><div><span class="tier ${t.t}">${TIERS[t.t][0]} ${TIERS[t.t][1]}</span> <span class="badge">${t.d}</span></div><h2>${esc(t.n)}</h2><p>${esc(t.x)}</p>`;
      acts=kind==='tasks'?`<button class="${sel?'on':''}" data-b="task" ${canPlan()?'':'disabled'}>${sel?'✓ 已加入任務':'加入這個任務'}</button>`
        :['未開始','進行中','已解鎖'].map(x=>`<button class="${s===x?'on':''}" data-b="st" data-v="${x}" ${canPlan()?'':'disabled'}>${x==='已解鎖'?'🏆 ':x==='進行中'?'🔄 ':'🔒 '}${x}</button>`).join('');
    }
    el().innerHTML=`<div class="bk-top"><span class="badge" style="font-size:20px">${i+1} / ${ids.length}</span><button class="ghost-btn" data-b="close">✕ 關閉</button></div>
      <div class="bk-page"><button class="bk-nav" data-b="prev" ${i===0?'disabled':''}>‹</button><div class="bk-body">${body}</div><button class="bk-nav" data-b="next" ${i===last?'disabled':''}>›</button></div>
      <div class="bk-actions">${acts}</div>`;
  }
  function open(k,id){
    if(ui.patientMode&&k!=='wishes')return;
    kind=k;ids=list(k);if(!ids.length)return;
    const key=(kind==='wishes')?id:+id;i=Math.max(0,ids.indexOf(key));
    el().classList.add('open');draw();
  }
  function close(){el().classList.remove('open');el().innerHTML='';render()}
  function go(d){const n=i+d;if(n>=0&&n<ids.length){i=n;draw()}}
  document.addEventListener('click',e=>{
    const b=e.target.closest('#book [data-b]');if(!b)return;const p=P(),id=ids[i],a=b.dataset.b;
    if(a==='close')close();else if(a==='prev')go(-1);else if(a==='next')go(1);
    else if(a==='video'){close();wishDetail(id)}
    else if(a==='task')runChange(()=>{if(!canPlan()||db.taskOff[id])throw new Error('此身分不能選取任務');const j=P().sel.indexOf(id);j>=0?P().sel.splice(j,1):P().sel.push(id);log('任務選取（大圖）',TASK_BY_ID[id].n);draw()});
    else if(a==='wish')runChange(()=>{if(!canInterview())throw new Error('此身分不能初選願望');toggleCandidate(id);draw()});
    else if(a==='st')runChange(()=>{if(!canPlan())throw new Error('此身分不能修改任務狀態');const cur=P().tasks[id]||{partner:'',at:''},was=cur.st,st=b.dataset.v;P().tasks[id]={...cur,st,at:st==='已解鎖'?(cur.at||now().toISOString()):''};log('護照任務狀態（大圖）',`${TASK_BY_ID[id].n} → ${st}`);draw();if(st==='已解鎖'&&was!=='已解鎖')celebrate('🎉 任務解鎖！',TASK_BY_ID[id].n)});
  });
  document.addEventListener('keydown',e=>{if(!el().classList.contains('open'))return;if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);if(e.key==='Escape')close()});
  let sx=null;
  document.addEventListener('touchstart',e=>{if(el().classList.contains('open'))sx=e.touches[0].clientX},{passive:true});
  document.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>70)go(dx<0?1:-1)},{passive:true});
  return{open,close};
})();
window.addEventListener('load',()=>{ACT['book-open']=el=>Book.open(el.dataset.k,el.dataset.id)});
