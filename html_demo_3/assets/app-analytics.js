'use strict';
/* 成果分析（示範）：以目前示範資料即時計算。雷達圖＝單一病人各領域解鎖；統計＝全部病人彙總。 */
NAV.splice(NAV.findIndex(n=>n[0]==='admin'),0,['analytics','成果分析']);

const AN_COLORS={食:'#119447',衣:'#246ca8',住:'#7c5cc4',行:'#2a9d8f',育:'#d9a521',樂:'#c0504d'};
function anDomainCounts(p){
  return DKEYS.map(k=>{
    const list=TASKS.filter(t=>t.d===k);
    return{k,total:list.length,done:list.filter(t=>stOf(p,t.id)==='已解鎖').length,prog:list.filter(t=>stOf(p,t.id)==='進行中').length};
  });
}
function anRadar(series,max){
  const cx=260,cy=240,R=170,n=DKEYS.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v]};
  const ring=f=>DKEYS.map((_,i)=>pt(i,f).join(',')).join(' ');
  let s=`<svg viewBox="0 0 520 480" role="img" aria-label="生活功能雷達圖" style="width:100%;max-width:560px;height:auto;display:block;margin:0 auto">`;
  [0.25,0.5,0.75,1].forEach(f=>{s+=`<polygon points="${ring(f)}" fill="${f===1?'#f7fbf9':'none'}" stroke="#d9e5df" stroke-width="${f===1?2:1}"/>`});
  DKEYS.forEach((k,i)=>{
    const[x,y]=pt(i,1),[lx,ly]=pt(i,1.2);
    s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d9e5df"/><text x="${lx}" y="${ly+8}" text-anchor="middle" font-size="26" font-weight="800" fill="${AN_COLORS[k]}">${k}</text>`;
  });
  [0.5,1].forEach(f=>{s+=`<text x="${cx+6}" y="${cy-R*f+14}" font-size="12" fill="#60766e">${Math.round(max*f)}</text>`});
  series.forEach(se=>{
    const pts=se.vals.map((v,i)=>pt(i,Math.min(1,v/max)).join(',')).join(' ');
    s+=`<polygon points="${pts}" fill="${se.fill}" stroke="${se.color}" stroke-width="3.5" ${se.dash?'stroke-dasharray="9 6"':''} stroke-linejoin="round"/>`;
    if(!se.dash)se.vals.forEach((v,i)=>{const[x,y]=pt(i,Math.min(1,v/max));s+=`<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="${se.color}" stroke-width="3.5"/>`});
  });
  return s+'</svg>';
}
function anBars(rows,color,max){
  const m=max||Math.max(1,...rows.map(r=>r.v));
  return rows.map(r=>`<div style="display:grid;grid-template-columns:96px 1fr 64px;gap:10px;align-items:center;margin:9px 0"><b>${r.label}</b><div class="progress" style="height:18px"><i style="width:${Math.round(r.v/m*100)}%;${r.color||color?`background:${r.color||color}`:''}"></i></div><span style="text-align:right;font-weight:800">${r.text??r.v}</span></div>`).join('');
}
/* 每週累積已解鎖任務（全體） */
function anTrend(pats){
  /* 起點＝最早的解鎖紀錄所在週；終點＝最新一筆。皆由病人資料推得 */
  const ts=[];pats.forEach(p=>Object.values(p.tasks).forEach(v=>{if(v.st==='已解鎖'&&v.at)ts.push(new Date(v.at).getTime())}));
  if(!ts.length)return '<p class="muted">尚無解鎖紀錄</p>';
  const WK=7*86400000,t1=Math.max(...ts),d0=new Date(Math.min(...ts)),dow=(d0.getDay()+6)%7,t0=new Date(d0.getFullYear(),d0.getMonth(),d0.getDate()-dow).getTime();
  const weeks=Math.max(2,Math.floor((t1-t0)/WK)+1),cum=[];let c=0;
  for(let w=0;w<weeks;w++){c+=ts.filter(x=>x>=t0+w*WK&&x<t0+(w+1)*WK).length;cum.push(c)}
  const W=760,H=300,L=52,B=44,T=18,mx=Math.ceil(Math.max(...cum)*1.15/50)*50;
  const X=i=>L+i*(W-L-16)/(weeks-1),Y=v=>T+(H-T-B)*(1-v/mx);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="每週累積解鎖任務" style="width:100%;height:auto;display:block"><defs><linearGradient id="anG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#119447" stop-opacity=".35"/><stop offset="1" stop-color="#119447" stop-opacity=".02"/></linearGradient></defs>`;
  for(let g=0;g<=4;g++){const v=mx*g/4;s+=`<line x1="${L}" x2="${W-16}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e3ede8"/><text x="${L-8}" y="${Y(v)+5}" text-anchor="end" font-size="13" fill="#60766e">${Math.round(v)}</text>`}
  const line=cum.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  s+=`<polygon points="${X(0)},${Y(0)} ${line} ${X(weeks-1)},${Y(0)}" fill="url(#anG)"/><polyline points="${line}" fill="none" stroke="#119447" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  cum.forEach((v,i)=>{if(i%2===0||i===weeks-1){const d=new Date(t0+i*WK);s+=`<text x="${X(i)}" y="${H-16}" text-anchor="middle" font-size="13" fill="#60766e">${d.getMonth()+1}/${d.getDate()}</text>`}});
  s+=`<circle cx="${X(weeks-1)}" cy="${Y(cum[weeks-1])}" r="7" fill="#fff" stroke="#119447" stroke-width="4"/><text x="${X(weeks-1)-12}" y="${Y(cum[weeks-1])-14}" text-anchor="end" font-size="20" font-weight="900" fill="#08753a">${cum[weeks-1]} 項</text>`;
  return s+'</svg>';
}
VIEWS.analytics=()=>{
  const p=P(),pats=db.patients,N=pats.length;
  const mine=anDomainCounts(p);
  const all=pats.map(x=>anDomainCounts(x));
  const avg=DKEYS.map((_,i)=>all.reduce((a,r)=>a+r[i].done,0)/N);
  const totDone=all.reduce((a,r)=>a+r.reduce((b,c)=>b+c.done,0),0);
  const totProg=all.reduce((a,r)=>a+r.reduce((b,c)=>b+c.prog,0),0);
    const avgPct=Math.round(pats.reduce((a,x)=>a+progressOf(x).pct,0)/N);
  const stageCount={};pats.forEach(x=>{const s=stageOf(x);stageCount[s]=(stageCount[s]||0)+1});
  const catCount={};
  pats.forEach(x=>orderedWishes(x).forEach(w=>{const c=DemoCore.CATEGORIES[DemoCore.category(w)].name;catCount[c]=(catCount[c]||0)+1}));
  const tile=(n,u,l,c)=>`<div class="panel" style="text-align:center;margin:0"><div style="font-size:44px;font-weight:900;color:${c}">${n}<span style="font-size:20px;margin-left:4px">${u}</span></div><div class="small">${l}</div></div>`;
  const mineDone=mine.reduce((a,c)=>a+c.done,0),dMax=Math.max(...mine.map(c=>c.total)),totalAll=mine.reduce((a,c)=>a+c.total,0);
  const stamps=pats.flatMap(x=>Object.values(x.tasks).filter(v=>v.st==='已解鎖'&&v.at).map(v=>new Date(v.at)));
  const first=stamps.length?new Date(Math.min(...stamps)):null;
  const needPlan=pats.filter(planOn),planDone=needPlan.filter(x=>x.plans.length).length;
  const radar=anRadar([{vals:avg,color:'#bb7412',fill:'rgba(187,116,18,.10)',dash:true},{vals:mine.map(c=>c.done),color:'#119447',fill:'rgba(17,148,71,.26)'}],dMax);
  const legend=`<div style="display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:6px;font-weight:700"><span><i style="display:inline-block;width:18px;height:12px;background:#119447;border-radius:3px;margin-right:6px"></i>${esc(p.name)}（已解鎖 ${mineDone}）</span><span><i style="display:inline-block;width:18px;height:0;border-top:3px dashed #bb7412;margin-right:6px;vertical-align:middle"></i>全體病人平均（${N} 人）</span></div>`;
  const domBars=anBars(DKEYS.map((k,i)=>{const d=all.reduce((a,r)=>a+r[i].done,0),pct=Math.round(d/(N*all[0][i].total)*100);return{label:`${DOMAINS[k].emoji} ${k}・${DOMAINS[k].sub}`,v:pct,color:AN_COLORS[k],text:pct+'%'}}),null,100).replace(/96px 1fr 64px/g,'150px 1fr 56px');
  const stageBars=anBars(['PAC','復健病房','一般復健','OPD'].map(k=>({label:k,v:stageCount[k]||0,text:(stageCount[k]||0)+' 人'})),'#246ca8',N);
  const catBars=anBars(Object.entries(catCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({label:k,v,text:v+' 個'})),'#119447');
  const rows=pats.map((x,idx)=>{const pr=progressOf(x),pg=all[idx].reduce((a,c)=>a+c.prog,0);return `<tr><td><b>${esc(x.name)}</b></td><td>${stageOf(x)}</td><td>${pr.done}</td><td>${pg}</td><td style="min-width:200px"><div class="progress"><i style="width:${pr.pct}%"></i></div></td><td><b>${pr.pct}%</b></td></tr>`}).join('');
  return `<div class="hero"><div><div class="eyebrow">OUTCOME ANALYTICS</div><h1>成果分析</h1><p>個人看雷達圖，群體看統計。以下為示範資料即時計算，用來說明未來的成果分析方向。</p></div><span class="badge gray">示範資料</span></div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px">${tile(N,'人','納入分析病人數','#17332a')}${tile(totDone,'項','已解鎖任務（全體）','#119447')}${tile(avgPct,'%','平均達成率（'+totalAll+' 項）','#bb7412')}${tile(needPlan.length?Math.round(planDone/needPlan.length*100):0,'%',`計畫覆蓋（${planDone}/${needPlan.length} 位應建者）`,'#246ca8')}</div>
  <div class="grid2">
    <div class="panel"><div class="section-title"><h3>生活功能雷達圖｜${esc(p.name)}</h3><span class="small">每軸滿分 ${dMax} 項</span></div>${radar}${legend}</div>
    <div style="display:flex;flex-direction:column">
      <div class="panel"><div class="section-title"><h3>各領域解鎖率（全體）</h3><span class="small">${totDone} 項解鎖、${totProg} 項進行中</span></div>${domBars}</div>
      <div class="panel" style="flex:1"><div class="section-title"><h3>每週累積解鎖任務</h3><span class="small">${first?(first.getMonth()+1)+'/'+first.getDate()+' 起':''}</span></div>${anTrend(pats)}</div>
    </div>
  </div>
  <div class="grid2">
    <div class="panel"><h3>病人照護階段分布</h3>${stageBars}</div>
    <div class="panel"><h3>病人選擇的願望類別</h3>${catBars}</div>
  </div>
  <div class="panel"><div class="section-title"><h3>各病人解鎖進度</h3><span class="small">平均達成率 ${avgPct}%</span></div><div class="table-wrap"><table class="data-table" style="min-width:640px"><thead><tr><th>姓名</th><th>目前階段</th><th>已解鎖</th><th>進行中</th><th>進度</th><th>達成率</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  <p class="source-note small">展示版以本機示範資料計算。正式版將由資料庫彙總，並可依期間、階段與治療師篩選。</p>`;
};
