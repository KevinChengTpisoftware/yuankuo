/* 院長簡報示範情境：以系統實際操作建立「張伯伯」個案，另以資料建立 3 位示範病人，供截圖與操作影片重複使用。
 * 瀏覽器時鐘固定為 2026-10-14 07:56（台北）。以 db.dayShift 模擬 8/12～9/23 的操作時間。
 * 全部為虛構示範資料。介面改版時，同步修改本檔的操作步驟。 */
const CLOCK='2026-10-14T07:56:00+08:00';
const ZHANG={name:'張伯伯',sex:'男',age:'66',bed:'B02-1',mrn:'0056789',pac:'',xin:'',dx:'腦中風後右側偏癱',cg:'配偶',dec:'長女',stage:'復健病房'};
const WISH_IDS=['wish-food-01','wish-move-02','wish-joy-03'];
/* 象限放置：[任務編號, 象限]；未列出的原批次項目留在待放置區。 */
const PLACEMENT=[[78,'tl'],[1,'tr'],[4,'tr'],[2,'br']];
const TERM={1:'short',2:'short',4:'short',78:'short',80:'long',81:'long',83:'long',130:'long',145:'long'};
/* 護照解鎖排程：依各領域的任務編號清單，輪流交錯排序；第 k 項解鎖於 from + (to - from) × √(k / N) 天，
 * 越到後期越快，每週累積圖呈現上揚曲線。日期以距 10/14 的天數表示。 */
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const PARTNERS=['自己完成','家屬夥伴','醫療團隊','家屬夥伴'];
function schedule(groups,from,to){
  const lists=groups.map(g=>g.slice()),order=[];
  while(lists.some(l=>l.length))for(const l of lists)if(l.length)order.push(l.shift());
  return order.map((id,k)=>[id,Math.round(from+(to-from)*Math.sqrt((k+1)/order.length)),PARTNERS[k%PARTNERS.length]]);
}
/* 張伯伯：共 89 項，食與行較強（雷達圖有高低差）。計畫中的 80、81 維持進行中，83 未開始。 */
const UNLOCKS=schedule([range(1,23),range(26,38),range(51,62),[76,77,78,79,82,...range(84,99)],range(101,108),[...range(126,136),145]],-58,-1);
/* 其他示範病人：讓成果分析的群體統計接近實際使用規模（8 人、照護模式 PAC 3／復健病房 1／一般復健 1／OPD 3）。
 * 解鎖時間固定在上午 10:30，避開張伯伯 9/23 的操作紀錄。 */
const DOMAIN_BASE={食:1,衣:26,住:51,行:76,育:101,樂:126};
const EXTRA=[
  {id:'P-0006',name:'李阿姨',sex:'女',age:58,bed:'—',mrn:'0061234',caregiver:'女兒',decider:'本人',diagnosis:'右膝人工關節置換術後',
   stages:[['一般復健','2026-08-18','2026-10-14','門診轉復健治療'],['OPD','2026-10-14',null,'一般復健結束，轉門診追蹤']],
   wishes:['wish-move-04','wish-move-05','wish-food-04'],unlock:{行:16,食:14,住:14,衣:10,樂:10,育:6},from:-56,to:-1,
   fam:[['common','專責護理師 黃佳吟','2026-08-18',{basic:'58 歲女性，國小老師退休。',function:'助行器步行 100 公尺，上下樓梯需扶手。'}],
        ['SW','社工／出院準備 周美玲','2026-10-13',{support:'女兒同住，可協助接送門診。',dc:'10/14 結束一般復健，轉門診追蹤。'}]]},
  {id:'P-0007',name:'周先生',sex:'男',age:71,bed:'B03-2',mrn:'0072345',caregiver:'外籍看護',decider:'長子',diagnosis:'左側腦梗塞後右側無力',
   stages:[['PAC','2026-08-15',null,'急性期後轉入 PAC']],
   wishes:['wish-food-02','wish-cloth-05','wish-joy-02'],unlock:{衣:18,食:16,樂:14,住:12,行:12,育:8},from:-58,to:-2,
   fam:[['common','專責護理師 黃佳吟','2026-08-15',{basic:'71 歲男性，退休公務員。',function:'坐姿平衡良好，可扶四腳拐步行 20 公尺。'}],
        ['OT','職能治療師 林雅婷','2026-10-12',{adl:'穿衣需少量協助，進食獨立。',hand:'右手握力恢復中，可握加粗湯匙。'}]],
   plans:[['2026-08-15','初版','PAC 收案建立初版計畫',['能自己穿好襯衫並扣好釦子。'],['坐姿穿脫上衣練習，每日 1 次。']],
          ['2026-09-05','定期檢討','穿衣進步，短期目標加入扣釦練習',['能自己穿好襯衫並扣好釦子。'],['扣釦練習，每日 2 次。']],
          ['2026-10-10','定期檢討','右手握力穩定，長期目標加入與老朋友泡茶下棋',['能自己穿好襯衫並扣好釦子。','能與老朋友在樹下泡茶下棋。'],['扣釦練習，每日 2 次。','持杯練習，每日 2 次。']]]},
  {id:'P-0008',name:'吳阿嬤',sex:'女',age:83,bed:'—',mrn:'0083456',caregiver:'次子',decider:'次子',diagnosis:'腰椎壓迫性骨折',
   stages:[['復健病房','2026-08-20','2026-09-28','骨折後住院復健'],['OPD','2026-09-28',null,'出院後門診追蹤']],
   wishes:['wish-home-01','wish-home-03','wish-learn-02'],unlock:{住:16,行:12,食:10,衣:8,育:8,樂:6},from:-54,to:-3,
   fam:[['common','專責護理師 黃佳吟','2026-08-20',{basic:'83 歲女性，與次子同住。',function:'可扶助行器短距離行走，翻身需少量協助。'}]]}
];
const IN_PROGRESS=[[80,'醫療團隊'],[81,'家屬夥伴']];

async function build(page,{base='http://127.0.0.1:8765/'}={}){
  const nav=v=>page.locator(`#nav [data-v="${v}"]`).click();
  const role=v=>page.locator('#roleSel').selectOption(v);
  const act=(name,sel='')=>page.locator(`[data-act="${name}"]${sel}`).first().click();
  const shift=d=>page.evaluate(d=>runChange(()=>{db.dayShift=d}),d);
  const fill=async pairs=>{for(const [sel,val] of pairs)await page.locator(sel).fill(val)};
  const commit=async(typeIndex,reason)=>{
    await nav('plan');await act('plan-commit-modal');
    if(typeIndex!==null){const opts=await page.locator('#cmType option').count();await page.locator('#cmType').selectOption({index:typeIndex<0?opts+typeIndex:typeIndex})}
    await page.locator('#cmReason').fill(reason);await act('plan-commit');
  };

  await page.goto(base);
  await page.evaluate(()=>{localStorage.clear()});
  await page.reload();

  /* 8/12：書記建檔；護理師與 PT 填熟識人；選願望、放象限、選任務；PT 建立初版計畫。 */
  await shift(-63);
  await role('Clerk');await nav('admin');await act('new-patient');
  await fill([['#fName',ZHANG.name],['#fAge',ZHANG.age],['#fBed',ZHANG.bed],['#fMrn',ZHANG.mrn],['#fPac',ZHANG.pac],['#fXin',ZHANG.xin],['#fDx',ZHANG.dx],['#fCg',ZHANG.cg],['#fDec',ZHANG.dec]]);
  await page.locator('#fSex').selectOption(ZHANG.sex);await page.locator('#fStage').selectOption(ZHANG.stage);
  await act('patient-add');
  await role('Nurse');await nav('familiar');await act('fam-tab','[data-k="common"]');
  await fill([['#fam-basic','66 歲男性，退休司機，台語為主。'],['#fam-medical','腦中風後右側偏癱，高血壓控制中。'],['#fam-function','坐姿平衡尚可，站立需兩人協助。'],['#fam-caregiver','主要照顧者為配偶；醫療決定者為長女。']]);
  await act('fam-save');
  await role('PT');await nav('familiar');await act('fam-tab','[data-k="PT"]');
  await fill([['#fam-rom','右下肢肌力 2/5。'],['#fam-balance','站立需扶持，尚無法步行。'],['#fam-transfer','床椅轉位需中度協助。']]);
  await act('fam-save');
  await role('Pharm');await nav('familiar');await act('fam-tab','[data-k="Pharm"]');
  await fill([['#fam-meds','Aspirin 100mg QD；Amlodipine 5mg QD；Atorvastatin 20mg HS'],['#fam-risk','使用降血壓藥，起身需放慢以防跌倒'],['#fam-edu','已向配偶說明服藥時間與跌倒預防']]);
  await act('fam-save');
  await role('PT');await nav('wishes');
  for(const id of WISH_IDS){await act('wish-toggle',`[data-id="${id}"]`);await act('wish-final',`[data-id="${id}"]`)}
  await nav('quad');
  for(const [id,q] of PLACEMENT){await page.locator(`#tray [data-tid="${id}"]`).click();await page.locator(`[data-act="quad-place"][data-q="${q}"]`).click()}
  await nav('tasks');await act('task-suggest');
  await nav('plan');
  await page.locator('[data-in="goal"][data-k="long"]').fill('能自己用湯匙吃完一碗湯麵。\n能拿單拐在客廳平穩步行。');
  await page.locator('[data-in="goal"][data-k="short"]').fill('坐姿平衡訓練，每日 3 組。\n床椅轉位練習，每日 2 次。');
  for(const [id,t] of Object.entries(TERM)){const b=page.locator(`[data-act="term"][data-id="${id}"][data-t="${t}"]`);if(await b.count())await b.click()}
  await act('prog-add','[data-i="1"]');
  await commit(null,'復健病房收案，建立初版復健計畫');

  /* 9/2：定期檢討，調整短期目標。 */
  await shift(-42);
  await nav('plan');
  await page.locator('[data-in="goal"][data-k="short"]').fill('扶欄杆站立 5 分鐘，每日 2 次。\n床椅轉位練習，每日 2 次。');
  await commit(0,'站立平衡進步，調整短期目標為扶欄杆站立 5 分鐘');

  /* 9/23：復健病房出院轉 PAC；修訂目標並產生 AI 預後草稿。 */
  await shift(-21);
  await nav('patient');await act('stage-modal');
  await page.locator('#sgStage').selectOption('PAC');await page.locator('#sgNote').fill('復健病房出院，轉 PAC');
  await act('stage-save');
  /* 轉入 PAC 時，護理師更新共同資料的功能狀況。 */
  await role('Nurse');await nav('familiar');await act('fam-tab','[data-k="common"]');
  await fill([['#fam-function','坐姿平衡良好，可扶助行器站立 1 分鐘，轉位需一人協助。']]);await act('fam-save');
  await role('PT');
  /* PAC 期間依個案設定每 60 天修訂（會議中 180 天個案每 60 天修訂的例子）；先設定，AI 草稿才會引用 60 天。 */
  await nav('plan');if(!await page.locator('[data-remind-mode="revise"]').isVisible())await page.locator('.remind-cfg summary').click();
  await page.locator('[data-remind-mode="revise"]').selectOption('days');await page.locator('[data-remind-days="revise"]').fill('60');await act('remind-save');
  await page.locator('[data-in="goal"][data-k="long"]').fill('能自己用湯匙吃完一碗湯麵。\n能拿單拐在客廳平穩步行。\n能在照顧者陪同下於居家安全移動。');
  await act('prog-ai');await act('prog-add','[data-i="3"]');
  await commit(-1,'轉入 PAC，目標改為居家安全移動與照顧者訓練');

  /* 8/19～10/13：護照逐週解鎖。依時間寫入狀態與操作紀錄，避免逐一觸發慶祝動畫。 */
  await page.evaluate(({unlocks,progress})=>runChange(()=>{
    const p=P(),by=who();
    for(const [id,days,partner] of unlocks){
      const at=new Date(Date.now()+days*864e5).toISOString();
      p.tasks[id]={st:'已解鎖',at,partner};
      db.logs.push({at,by,pid:p.id,pname:p.name,action:'護照任務狀態',detail:`${TASK_BY_ID[id].n} → 已解鎖`});
    }
    for(const [id,partner] of progress)p.tasks[id]={st:'進行中',at:'',partner};
    db.logs.sort((a,b)=>b.at.localeCompare(a.at));
  }),{unlocks:UNLOCKS,progress:IN_PROGRESS});

  /* 其他示範病人：以資料直接建立（含主檔、照護模式歷程、熟識人、願望、計畫、解鎖與操作紀錄）。 */
  await page.evaluate(({extra,base})=>runChange(()=>{
    const iso=(d,t='10:30')=>new Date(`${d}T${t}:00+08:00`).toISOString(),dayIso=days=>new Date(Date.now()+days*864e5+154*60e3).toISOString();
    const famKeys=Object.keys(famAll()).filter(k=>k!=='common'),W=id=>wishObj(P(),id)||WISHES.find(w=>w.id===id);
    const L=(at,by,p,action,detail)=>db.logs.push({at,by,pid:p.id,pname:p.name,action,detail});
    for(const x of extra){
      const sel=[...new Set(x.wishes.flatMap(w=>W(w).rel))];
      const p={id:x.id,name:x.name,sex:x.sex,age:x.age,bed:x.bed,mrn:x.mrn,ext:{pac:'',xin:''},caregiver:x.caregiver,decider:x.decider,diagnosis:x.diagnosis,
        stages:x.stages.map(([stage,from,to,note])=>({stage,from,to,note})),wishes:x.wishes.slice(),wishCandidates:x.wishes.slice(),custom:[],place:{},functionPlace:{},
        sel,tasks:{},records:[],fam:{},famHist:[],plans:[],draft:null,planOverride:false,famEnabled:famKeys.slice(),reminder:{}};
      L(iso(x.stages[0][1],'09:00'),'書記／行政 建檔示範',p,'新增病人',`${x.name}｜${x.stages[0][0]}`);
      x.stages.slice(1).forEach(([stage,from],i)=>L(iso(from,'07:30'),'專責護理師 黃佳吟',p,'變更照護模式',`${x.stages[i][0]} → ${stage}（${from}）`));
      for(const [tab,by,d,data] of x.fam){const v={...data,_by:by,_at:iso(d).slice(0,16)};p.fam[tab]=v;p.famHist.push({tab,by,at:v._at,data:{...v}});L(iso(d),by,p,'熟識人更新',famAll()[tab].label)}
      (x.plans||[]).forEach(([d,type,reason,long,short],i)=>{
        const term={};sel.forEach((id,k)=>{term[id]=k%2?'long':'short'});
        p.plans.push({ver:i+1,at:iso(d,'11:00'),by:'職能治療師 林雅婷',type,reason,snap:{expect:x.wishes.map(w=>({wid:w,text:W(w).s,name:W(w).n})),long,short,prog:[{text:'預期可在少量協助下完成日常活動，仍需照顧者部分協助',src:'preset'}],term,taskIds:sel.slice(),functionPlace:{}}});
        L(iso(d,'11:00'),'職能治療師 林雅婷',p,'復健計畫新版本',`v${i+1}｜${type}｜${reason}`);
      });
      const groups=Object.entries(x.unlock).map(([d,n])=>Array.from({length:n},(_,i)=>base[d]+i)),order=[];
      while(groups.some(g=>g.length))for(const g of groups)if(g.length)order.push(g.shift());
      order.forEach((id,k)=>{let days=Math.round(x.from+(x.to-x.from)*Math.sqrt((k+1)/order.length));if(days===-21)days=-20;
        const at=dayIso(days),partner=['自己完成','家屬夥伴','醫療團隊'][k%3];p.tasks[id]={st:'已解鎖',at,partner};
        L(at,'物理治療師 王大明',p,'護照任務狀態',`${TASK_BY_ID[id].n} → 已解鎖`)});
      db.patients.push(p);
    }
    db.logs.sort((a,b)=>b.at.localeCompare(a.at));
  }),{extra:EXTRA,base:DOMAIN_BASE});

  await shift(0);
  await role('PT');await page.locator('#patientSel').selectOption('P-0005');await nav('patient');
  await page.evaluate(()=>scrollTo(0,0));
}
module.exports={build,CLOCK,ZHANG,WISH_IDS};
