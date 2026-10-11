'use strict';
/* ============ 共用工具 ============ */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAY=864e5, KEY='yk-demo3-v2';
const pad=n=>String(n).padStart(2,'0');
const fmtD=d=>{d=new Date(d);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const fmtT=d=>{d=new Date(d);return `${fmtD(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
const clone=o=>JSON.parse(JSON.stringify(o));

const DOMAINS={
  食:{emoji:'🍚',sub:'大飽口福',desc:'從進食、吞嚥到自己準備簡單餐點'},
  衣:{emoji:'👕',sub:'穿出自信',desc:'從穿脫衣物到整理儀容'},
  住:{emoji:'🏠',sub:'安居自在',desc:'從床邊活動到居家安全'},
  行:{emoji:'🚌',sub:'行遍天下',desc:'從移位、步行到安全外出'},
  育:{emoji:'📖',sub:'學習成長',desc:'從閱讀、書寫到認知參與'},
  樂:{emoji:'🎵',sub:'樂活人生',desc:'從興趣、社交到社區活動'}
};
const DKEYS=Object.keys(DOMAINS);
const TIERS={bronze:['🥉','銅盃'],silver:['🥈','銀盃'],gold:['🥇','金盃']};
const STAGES=['PAC','復健病房','一般復健','OPD'];
const STAGE_DESC={PAC:'急性後期照護',復健病房:'住院復健',一般復健:'一般復健治療',OPD:'門診追蹤'};
const ROLES=[
  {k:'PT',label:'物理治療師 PT',name:'王大明'},{k:'OT',label:'職能治療師 OT',name:'林雅婷'},{k:'ST',label:'語言治療師 ST',name:'陳怡君'},
  {k:'Dietitian',label:'臨床營養師',name:'張雅惠'},{k:'Dr',label:'主治醫師',name:'李志明'},{k:'Nurse',label:'專責護理師',name:'黃佳吟'},{k:'SW',label:'社工／出院準備',name:'周美玲'},
  {k:'Clerk',label:'書記／行政',name:'建檔示範'},{k:'Admin',label:'管理員',name:'管理示範'}
];
const FAM={
  common:{label:'共同資料',fields:[['basic','基本資料'],['medical','醫療／疾病資訊'],['function','目前功能與行動狀況'],['nutrition','營養／飲食'],['caregiver','照顧者與主要醫療決定者'],['psychosocial','社會心理與家庭'],['premorbid','病前生活／興趣'],['environment','居住環境']]},
  PT:{label:'物理治療 PT',fields:[['rom','肌力／關節活動度'],['balance','平衡與步行'],['transfer','移位能力'],['endurance','活動耐力'],['note','PT 備註']]},
  OT:{label:'職能治療 OT',fields:[['hand','上肢與手功能'],['adl','日常生活功能 ADL'],['cog','認知與知覺'],['aid','輔具與居家環境評估'],['note','OT 備註']]},
  ST:{label:'語言治療 ST',fields:[['swallow','吞嚥功能'],['speech','語言與溝通'],['cog','認知溝通'],['note','ST 備註']]},
  Dietitian:{label:'臨床營養',fields:[['status','體位／營養狀態'],['texture','飲食質地與限制'],['supp','管灌／營養補充'],['allergy','過敏與禁忌'],['note','營養備註']]},
  Dr:{label:'主治醫師',fields:[['dx','診斷與病史'],['risk','用藥與醫療風險'],['prognosis','預後與醫療決策'],['note','醫師備註']]},
  Nurse:{label:'專責護理',fields:[['skin','皮膚／疼痛'],['elim','排泄與睡眠'],['care','照護注意事項'],['edu','照顧者衛教'],['note','護理備註']]},
  SW:{label:'社工／出院準備',fields:[['support','家庭支持'],['econ','經濟與資源'],['dc','出院準備與銜接'],['note','社工備註']]}
};
const QN={
  tr:['Q1','重要且急迫','暫定：短期優先'],br:['Q2','重要不急迫','暫定：長期目標'],
  tl:['Q3','急迫不重要','暫定：短期、可請照顧者協助'],bl:['Q4','不重要不急迫','暫定：暫緩，定期再評估']
};
const QRANK={tr:0,br:1,tl:2,bl:3};
const DEFAULT_PHRASES=[
  '預期出院時，可在輔具協助下獨立完成主要生活願望',
  '預期可在少量協助下完成日常活動，仍需照顧者部分協助',
  '預期功能可恢復至病前約 ___ %，需門診長期追蹤',
  '預期需居家環境改造（扶手、止滑墊、無障礙動線）後返家',
  '預期出院後仍需照顧者（或看護）全日協助',
  '預期需長期使用輔具（助行器／四腳拐／輪椅）',
  '預期需銜接社區復健或日間照護',
  '預期短期功能進步有限，以維持現有功能、預防併發症為主'
];
const TASK_BY_ID=Object.fromEntries(TASKS.map(t=>[t.id,t]));
const iconOf=id=>id===150?'assets/icons/cup-150-1.png':`assets/icons/${id}.png`;

/* ============ 資料與儲存 ============ */
let db, ui={view:'patient',wd:'all',td:'食',tt:'all',tq:'',pd:'食',pv:'2',ft:'overview',ad:'tasks',adq:'',adom:'all',pend:null,famDraft:{},famKey:''};

function seed(){
  const rel=ids=>[...new Set(ids.flatMap(id=>WISHES.find(w=>w.id===id).rel))].sort((a,b)=>a-b);
  const w1=['wish-food-01','wish-move-01','wish-joy-01'];
  const p1={id:'P-0001',name:'陳阿公',sex:'男',age:72,bed:'B03-1',mrn:'0012345',ext:{pac:'PAC-2026-0087',xin:''},
    caregiver:'陳阿嬤（配偶）',decider:'長子 陳大明',diagnosis:'腦中風後左側偏癱',
    stages:[{stage:'復健病房',from:'2026-09-01',to:'2026-09-14',note:'急性期後轉入'},{stage:'PAC',from:'2026-09-15',to:null,note:'納入 PAC 方案'}],
    wishes:w1,custom:[],place:{'wish-food-01':{x:78,y:22},'wish-move-01':{x:72,y:72},'wish-joy-01':{x:26,y:30}},
    sel:rel(w1),tasks:{1:{st:'已解鎖',partner:'自己完成',at:'2026-09-20T10:00'},2:{st:'進行中',partner:'',at:''}},records:[],
    fam:{common:{basic:'72 歲男性，退休農夫，主要語言：台語／國語。',medical:'2026/08 右側腦中風，左側偏癱，高血壓控制中。',_by:'專責護理師 黃佳吟',_at:'2026-09-02T14:20'},
         PT:{balance:'坐姿平衡佳，站立需扶持，步行需 1 人協助。',_by:'物理治療師 王大明',_at:'2026-09-03T09:40'}},
    famHist:[],plans:[],draft:null,planOverride:false};
  p1.famHist=[{tab:'common',by:'專責護理師 黃佳吟',at:'2026-09-02T14:20',data:clone(p1.fam.common)},{tab:'PT',by:'物理治療師 王大明',at:'2026-09-03T09:40',data:clone(p1.fam.PT)}];
  p1.plans=[{ver:1,at:'2026-09-16T11:00',by:'物理治療師 王大明',type:'初版',reason:'PAC 收案建立初版復健計畫',
    snap:{expect:p1.wishes.map(id=>({wid:id,text:WISHES.find(w=>w.id===id).s})),long:['能自己用湯匙吃飯，並回到活動中心唱歌。'],short:['坐站轉換訓練，每日 3 組 × 10 下。','扶欄杆站立，每日 2 次。'],
      prog:[{text:'預期出院時，可在輔具協助下獨立完成主要生活願望',src:'preset'}],term:{1:'short',2:'short',12:'long'}}}];
  const w2=['wish-home-01'];
  const p2={id:'P-0002',name:'林阿嬤',sex:'女',age:68,bed:'—',mrn:'0023456',ext:{pac:'',xin:''},caregiver:'女兒 林小芳',decider:'本人',diagnosis:'退化性膝關節炎術後',
    stages:[{stage:'一般復健',from:'2026-09-20',to:null,note:'門診轉復健治療'}],wishes:w2,custom:[],place:{},sel:rel(w2).slice(0,6),tasks:{},records:[],fam:{},famHist:[],plans:[],draft:null,planOverride:false};
  const p3={id:'P-0003',name:'王先生',sex:'男',age:55,bed:'—',mrn:'0034567',ext:{pac:'',xin:''},caregiver:'配偶',decider:'本人',diagnosis:'肩袖肌腱修補術後',
    stages:[{stage:'OPD',from:'2026-09-25',to:null,note:'門診追蹤'}],wishes:[],custom:[],place:{},sel:[],tasks:{},records:[],fam:{},famHist:[],plans:[],draft:null,planOverride:false};
  /* ---- 擴充示範資料 ---- */
  const T=(st,partner,at)=>({st,partner,at});
  Object.assign(p1.tasks,{1:T('已解鎖','自己完成','2026-09-17T10:00'),2:T('已解鎖','家屬夥伴','2026-09-19T15:30'),3:T('已解鎖','自己完成','2026-09-22T11:10'),4:T('進行中','',''),5:T('進行中','家屬夥伴',''),26:T('已解鎖','多功能型照顧服務員','2026-09-24T09:20'),27:T('進行中','',''),51:T('已解鎖','自己完成','2026-09-26T16:00'),52:T('已解鎖','醫療團隊','2026-09-29T10:40'),76:T('進行中','',''),126:T('進行中','','')});
  p1.fam={
    common:{basic:'72 歲男性，退休農夫，台語為主、國語可溝通。身高 168 cm，體重 64 kg。',medical:'2026/08 右側腦中風（MCA 梗塞），左側偏癱；高血壓、糖尿病控制中。',function:'坐姿平衡佳；站立需扶持；步行需 1 人協助；左手可抓握但無法精細捏取。',nutrition:'軟質飲食，需切碎；無明顯嗆咳，進食速度偏慢。',caregiver:'主要照顧者：陳阿嬤（配偶，68 歲）。主要醫療決定者：長子陳大明。',psychosocial:'家庭關係和睦，兒子住附近每週探視；情緒穩定，偶有挫折感。',premorbid:'務農 40 年，喜歡到活動中心唱老歌、和朋友下棋。',environment:'透天厝，一樓有 3 階門檻，浴室無扶手。',_by:'專責護理師 黃佳吟',_at:'2026-09-16T10:30'},
    PT:{rom:'左下肢肌力 3/5；髖膝關節活動度正常。',balance:'坐姿平衡佳，站立需扶持，步行需 1 人協助，約 10 公尺。',transfer:'床椅轉位需中度協助。',endurance:'步行 10 公尺後需休息。',note:'目標：2 週內扶欄杆站穩 5 分鐘。',_by:'物理治療師 王大明',_at:'2026-09-29T09:40'},
    OT:{hand:'左手握力約 8 kg，拇指與食指對指困難。',adl:'進食需備餐與輔具；穿衣需中度協助；如廁需協助。',cog:'注意力與記憶良好，無單側忽略。',aid:'建議加粗握把湯匙、止滑墊；返家前評估浴室扶手。',note:'',_by:'職能治療師 林雅婷',_at:'2026-09-18T14:00'},
    ST:{swallow:'一般質地無明顯嗆咳；稀薄液體偶有輕微嗆咳，建議稍加稠。',speech:'構音略含糊，句子完整，理解佳。',cog:'',note:'',_by:'語言治療師 陳怡君',_at:'2026-09-17T11:20'},
    Dietitian:{status:'BMI 22.7，營養狀態良好。',texture:'軟質、低鹽、糖尿病飲食。',supp:'無需管灌；每日 1 份高蛋白補充品。',allergy:'無',note:'',_by:'臨床營養師 張雅惠',_at:'2026-09-17T15:00'},
    Dr:{dx:'右側 MCA 腦梗塞，左側偏癱，高血壓、第 2 型糖尿病。',risk:'抗血小板與降壓藥；留意跌倒與肩關節疼痛。',prognosis:'預期可恢復輔具下短距離步行，需長期復健追蹤。',note:'',_by:'主治醫師 李志明',_at:'2026-09-16T09:00'},
    Nurse:{skin:'無壓傷；左肩偶有疼痛 2/10。',elim:'尿失禁偶發，夜間睡眠良好。',care:'站立與轉位需有人在旁，避免跌倒。',edu:'已教導配偶協助轉位技巧，仍需實作練習。',note:'',_by:'專責護理師 黃佳吟',_at:'2026-09-20T16:00'},
    SW:{support:'配偶全職照顧，長子可協助部分假日。',econ:'有健保，已申請重大傷病；評估長照資源。',dc:'預計 11 月出院，需居家無障礙改善與居家復健。',note:'',_by:'社工／出院準備 周美玲',_at:'2026-09-25T10:00'}};
  p1.famHist=[];
  Object.entries(p1.fam).forEach(([tab,d])=>p1.famHist.push({tab,by:d._by,at:d._at,data:clone(d)}));
  const oldPT={balance:'坐姿平衡佳，站立需扶持，步行需 1 人協助。',_by:'物理治療師 王大明',_at:'2026-09-03T09:40'};
  p1.famHist.unshift({tab:'PT',by:oldPT._by,at:oldPT._at,data:oldPT});
  const ids1=p1.sel.slice(),half=Math.ceil(ids1.length/2),term1={};ids1.forEach((id,i)=>term1[id]=i<half?'short':'long');
  p1.plans[0].snap.term=term1;
  p1.plans.push({ver:2,at:'2026-09-30T14:00',by:'物理治療師 王大明',type:'定期檢討',reason:'坐站轉換進步，短期目標升級為扶欄杆站立 5 分鐘',
    snap:{expect:clone(p1.plans[0].snap.expect),long:['能自己用湯匙吃完一餐，並回到活動中心唱歌。','能在助行器協助下走到公園散步一圈。'],short:['扶欄杆站穩 5 分鐘，每日 2 次。','坐站轉換訓練，每日 3 組 × 10 下。','練習以左手握住加粗湯匙。'],
      prog:[{text:'預期出院時，可在輔具協助下獨立完成主要生活願望',src:'preset'},{text:'預期需居家環境改造（扶手、止滑墊、無障礙動線）後返家',src:'preset'},{text:'照顧者（陳阿嬤）需於出院前完成轉位與進食協助的實作練習。',src:'ai'}],term:term1}});
  // 病人 2：林阿嬤（一般復健）
  p2.tasks={...Object.fromEntries(p2.sel.slice(0,3).map((id,i)=>[id,T(i===0?'已解鎖':'進行中','自己完成',i===0?'2026-09-28T10:00':'')]))};
  p2.records=[{at:'2026-09-21T11:00',by:'職能治療師 林雅婷',stage:'一般復健',ids:p2.sel.slice(0,4)}];
  p2.fam={common:{basic:'68 歲女性，退休教師，與女兒同住。',medical:'左膝人工關節置換術後 3 週。',function:'助行器步行 50 公尺。',_by:'專責護理師 黃佳吟',_at:'2026-09-20T10:00'},OT:{adl:'洗澡需少量協助，其餘獨立。',aid:'建議浴室加裝扶手與洗澡椅。',_by:'職能治療師 林雅婷',_at:'2026-09-21T10:30'}};
  p2.famHist=Object.entries(p2.fam).map(([tab,d])=>({tab,by:d._by,at:d._at,data:clone(d)}));
  // 病人 3：王先生（一般復健 → OPD）
  p3.stages=[{stage:'一般復健',from:'2026-09-01',to:'2026-09-24',note:'術後復健治療'},{stage:'OPD',from:'2026-09-25',to:null,note:'功能恢復，轉門診追蹤'}];
  p3.wishes=['wish-cloth-01','wish-learn-01'];p3.place={};p3.sel=rel(p3.wishes);
  p3.tasks={[p3.sel[0]]:T('已解鎖','自己完成','2026-09-20T10:00')};
  p3.records=[{at:'2026-09-26T09:30',by:'物理治療師 王大明',stage:'OPD',ids:p3.sel.slice(0,3)}];
  p3.fam={Dr:{dx:'右肩袖肌腱修補術後 8 週。',prognosis:'預期 3 個月內恢復日常上肢活動。',_by:'主治醫師 李志明',_at:'2026-09-25T09:00'}};
  p3.famHist=[{tab:'Dr',by:'主治醫師 李志明',at:'2026-09-25T09:00',data:clone(p3.fam.Dr)}];
  // 病人 4：黃奶奶（復健病房，已滿 80 天，可展示 80 天修訂提醒）
  const w4=['wish-cloth-01','wish-home-01'],t4=rel(w4);
  const p4={id:'P-0004',name:'黃奶奶',sex:'女',age:80,bed:'B05-2',mrn:'0045678',ext:{pac:'',xin:'XX-7781'},caregiver:'外籍看護',decider:'次女 黃小玲',diagnosis:'髖關節骨折術後',
    stages:[{stage:'復健病房',from:'2026-07-08',to:null,note:'骨折術後轉入'}],wishes:w4,custom:[],place:{'wish-cloth-01':{x:70,y:25},'wish-home-01':{x:30,y:75}},sel:t4,
    tasks:Object.fromEntries(t4.slice(0,4).map((id,i)=>[id,T(i<2?'已解鎖':'進行中','家屬夥伴',i<2?'2026-08-15T10:00':'')])),records:[],
    fam:{common:{basic:'80 歲女性，與次女同住。',medical:'左股骨頸骨折術後，骨質疏鬆。',_by:'專責護理師 黃佳吟',_at:'2026-07-09T10:00'}},famHist:[],plans:[],draft:null,planOverride:false};
  p4.famHist=[{tab:'common',by:'專責護理師 黃佳吟',at:'2026-07-09T10:00',data:clone(p4.fam.common)}];
  const term4={};t4.forEach((id,i)=>term4[id]=i%2?'long':'short');
  p4.plans=[{ver:1,at:'2026-07-10T11:00',by:'職能治療師 林雅婷',type:'初版',reason:'復健病房收案建立初版計畫',snap:{expect:w4.map(id=>({wid:id,text:WISHES.find(w=>w.id===id).s})),long:['能自己穿脫上衣並整理儀容。'],short:['坐姿穿脫上衣練習，每日 1 次。'],prog:[{text:'預期可在少量協助下完成日常活動，仍需照顧者部分協助',src:'preset'}],term:term4}},
    {ver:2,at:'2026-08-01T10:00',by:'物理治療師 王大明',type:'定期檢討',reason:'髖關節負重進步，加入站立訓練',snap:{expect:w4.map(id=>({wid:id,text:WISHES.find(w=>w.id===id).s})),long:['能自己穿脫上衣並整理儀容。','能在助行器協助下於居家安全移動。'],short:['坐姿穿脫上衣練習，每日 1 次。','扶助行器站立 3 分鐘。'],prog:[{text:'預期需長期使用輔具（助行器／四腳拐／輪椅）',src:'preset'}],term:term4}}];
  p4.plans[1].at='2026-08-01T10:00';
  const logs=[
    ['2026-09-30T14:00','物理治療師 王大明',p1,'復健計畫新版本','v2｜定期檢討｜坐站轉換進步，短期目標升級為扶欄杆站立 5 分鐘'],
    ['2026-09-29T09:40','物理治療師 王大明',p1,'熟識人更新','物理治療 PT'],
    ['2026-09-25T10:00','社工／出院準備 周美玲',p1,'熟識人更新','社工／出院準備'],
    ['2026-09-25T09:10','專責護理師 黃佳吟',p3,'變更照護階段','一般復健 → OPD（2026-09-25）'],
    ['2026-09-16T11:00','物理治療師 王大明',p1,'復健計畫新版本','v1｜初版｜PAC 收案建立初版復健計畫'],
    ['2026-09-15T09:00','專責護理師 黃佳吟',p1,'變更照護階段','復健病房 → PAC（2026-09-15）'],
    ['2026-08-01T10:00','物理治療師 王大明',p4,'復健計畫新版本','v2｜定期檢討｜髖關節負重進步，加入站立訓練']
  ].map(([at,by,p,action,detail])=>({at:new Date(at).toISOString(),by,pid:p.id,pname:p.name,action,detail}));
  return{patients:[p1,p2,p3,p4],cur:'P-0001',logs,role:'PT',stageCfg:{PAC:true,復健病房:true,一般復健:false,OPD:false},taskOff:{},taskEdit:{},phrases:[...DEFAULT_PHRASES],dayShift:0};
}
let store;
function load(){
  const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
  store=new DemoCore.Store(storage,KEY);
  db=store.read(seed(),Object.keys(FAM).filter(k=>k!=='common'));
}
function save(){return transaction?true:store.write(db)}
const P=()=>db.patients.find(p=>p.id===db.cur)||db.patients[0];
const now=()=>new Date(Date.now()+db.dayShift*DAY);
const role=()=>ROLES.find(r=>r.k===db.role)||ROLES[0];
const who=()=>`${role().label.replace(/ [A-Z]+$/,'')} ${role().name}`;
function log(action,detail,p){db.logs.unshift({at:now().toISOString(),by:who(),pid:(p||P()).id,pname:(p||P()).name,action,detail:detail||''});if(db.logs.length>800)db.logs.length=800;save()}
function stageOf(p){return (p.stages.find(s=>!s.to)||p.stages[p.stages.length-1]).stage}
const planOn=p=>!!db.stageCfg[stageOf(p)]||p.planOverride;
const task=id=>{const t=TASK_BY_ID[id];return t?{...t,...(db.taskEdit[id]||{})}:null};
const wishCatalog=()=>DemoCore.catalog(WISHES,db);
const wishObj=(p,id)=>wishCatalog().find(w=>w.id===id)||p.custom.find(w=>w.id===id);
const relatedItems=p=>DemoCore.related(p,wishCatalog(),TASKS.map(t=>t.id),db.taskOff);
function syncFunctions(p){DemoCore.reconcile(p,relatedItems(p))}
const qOf=pos=>pos?((pos.x>=50)?(pos.y<50?'tr':'br'):(pos.y<50?'tl':'bl')):null;
function orderedWishes(p){return p.wishes.map(id=>wishObj(p,id)).filter(Boolean)}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)}
function celebrate(title,sub){$('#celTitle').textContent=title;$('#celSub').textContent=sub||'';const c=$('#celebrate');Snd.win();c.classList.add('show');setTimeout(()=>c.classList.remove('show'),2300)}
function openModal(html){$('#modal').innerHTML=html;$('#modalBackdrop').classList.add('open')}
function closeModal(){$('#modalBackdrop').classList.remove('open')}
const mhead=t=>`<header><h2>${t}</h2><button class="ghost-btn" data-act="close">✕</button></header>`;
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function progressOf(p){const v=Object.values(p.tasks).filter(x=>x.st==='已解鎖').length;return{done:v,total:TASKS.length,pct:Math.round(v/TASKS.length*100)}}

/* ============ 外框：導覽 / 病人切換 ============ */
const NAV=[['patient','① 個案主檔'],['familiar','② 熟識人'],['wishes','③ 願望圖卡'],['quad','④ 願望象限'],['tasks','⑤ 生活復健任務'],['plan','⑥ 復健計畫'],['|'],['passport','生活功能護照'],['admin','後台管理']];
function renderTop(){
  const p=P();
  $('#patientSel').innerHTML=db.patients.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.name)}｜${stageOf(x)}</option>`).join('');
  $('#roleSel').innerHTML=ROLES.map(r=>`<option value="${r.k}" ${r.k===db.role?'selected':''}>${r.label}｜${r.name}</option>`).join('');
  $('#nav').innerHTML=NAV.map(n=>n[0]==='|'?'<span class="sep"></span>':`<button class="${ui.view===n[0]?'on':''} ${n[0]==='plan'&&!planOn(p)?'locked':''}" data-act="nav" data-v="${n[0]}">${n[1]}${n[0]==='plan'&&!planOn(p)?' 🔒':''}</button>`).join('');
  applyAccess();
}
function render(){
  if(!canView(ui.view))ui.view=ui.patientMode?'wishes':'patient';
  renderTop();
  const v=(VIEWS[ui.view]||VIEWS.patient)();
  $('#view').innerHTML=v;
  if(ui.lastView!==ui.view){ui.lastView=ui.view;window.scrollTo({top:0})}
  if(AFTER[ui.view])AFTER[ui.view]();
  applyViewAccess();
  Snd.view(ui.view);
}
function go(v){ui.view=v;ui.pend=null;render()}
const VIEWS={},AFTER={};

/* ============ ① 個案主檔 ============ */
VIEWS.patient=()=>{
  const p=P(),st=stageOf(p),on=planOn(p),cur=p.stages.find(s=>!s.to)||p.stages[p.stages.length-1];
  const node=(b,t,dim)=>`<div class="node ${dim?'dim':''}"><b>${b}</b>${t}</div>`;
  return `<div class="hero"><div><div class="eyebrow">PATIENT-CENTERED · 以病人為核心</div><h1>${esc(p.name)}<br><span style="font-size:.55em;color:var(--muted)">目前照護階段：${st}</span></h1>
    <p>病人只有一份主檔與一份熟識人資料；照護階段會隨時間改變並完整保留歷程，依階段決定是否需要建立短／長期復健計畫。</p></div>
    <div class="actions"><button class="primary" data-act="stage-modal">變更照護階段</button><button class="ghost-btn" data-act="nav" data-v="admin" data-admin="patients">後台建檔／編輯</button></div></div>
  <div class="panel"><div class="section-title"><h3>系統流程（依目前階段自動帶出路徑）</h3><span class="badge ${on?'':'gray'}">${on?'本階段需建立復健計畫':'本階段任務儲存即可'}</span></div>
    <div class="flow">${node('病人主檔',`內部 ID：${p.id}`)}<span class="arrow">→</span>${node('熟識人','所有人都有，跨專業共同填寫')}<span class="arrow">→</span>${node('目前照護階段',`${st}（可隨時間改變）`)}<span class="arrow">→</span>${node('生活復健任務','150 項，所有人都可使用')}<span class="arrow">→</span>${node('是否建立復健計畫？',on?'是 → 短期＋長期＋定期檢討':'否 → 任務儲存即可',!on)}</div>
    <p class="small" style="margin:10px 0 0">各階段是否啟用復健計畫可於「後台管理 → 階段設定」調整${p.planOverride?'；此病人已由治療師選擇產出復健計畫':''}。</p></div>
  <div class="grid2">
    <div class="panel"><div class="section-title"><h3>病人基本資料</h3></div>
      <dl class="kv"><dt>姓名</dt><dd>${esc(p.name)}</dd><dt>性別／年齡</dt><dd>${esc(p.sex)}／${p.age} 歲</dd><dt>床號</dt><dd>${esc(p.bed)}</dd><dt>診斷</dt><dd>${esc(p.diagnosis)}</dd><dt>主要照顧者</dt><dd>${esc(p.caregiver)}</dd><dt>醫療決定者</dt><dd>${esc(p.decider)}</dd></dl>
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><h4 style="margin:0 0 8px">識別碼對應（預留未來串接）</h4>
      <dl class="kv"><dt>系統病人 ID</dt><dd>${p.id}（獨立不變）</dd><dt>院內病歷號 HIS</dt><dd>${esc(p.mrn)||'<span class="muted">未填</span>'}</dd><dt>PAC 系統 ID</dt><dd>${esc(p.ext.pac)||'<span class="muted">未串接</span>'}</dd><dt>信祥系統 ID</dt><dd>${esc(p.ext.xin)||'<span class="muted">未串接</span>'}</dd></dl>
      <p class="small">現階段由院內人員手動建立；未來可用病歷號等識別資料自動帶入姓名與基本資料，病人主檔不需重做。</p></div>
    <div class="panel"><div class="section-title"><h3>照護階段歷程</h3><span class="small">舊階段不會被覆蓋</span></div>
      <div class="timeline">${[...p.stages].reverse().map(s=>`<div class="tl-item ${s.to?'':'now'}"><b>${s.stage}</b> <span class="badge ${s.to?'gray':''}">${s.to?'已結束':'目前'}</span><small>${s.from} ～ ${s.to||'迄今'}｜${STAGE_DESC[s.stage]}</small>${s.note?`<small>${esc(s.note)}</small>`:''}</div>`).join('')}</div></div>
  </div>
  <div class="panel"><div class="section-title"><h3>病人清單</h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>系統 ID</th><th>姓名</th><th>目前階段</th><th>復健計畫</th><th>已選願望</th><th>已選任務</th><th></th></tr></thead><tbody>${db.patients.map(x=>`<tr><td>${x.id}</td><td><b>${esc(x.name)}</b></td><td>${stageOf(x)}</td><td>${planOn(x)?`啟用（${x.plans.length} 版）`:'不需要'}</td><td>${x.wishes.length}</td><td>${x.sel.length}</td><td><button class="ghost-btn" data-act="pick-patient" data-id="${x.id}">切換</button></td></tr>`).join('')}</tbody></table></div></div>`;
};

/* ============ ② 熟識人 ============ */
/* 表單、報表與職類設定集中於 app-admin.js。 */

/* ============ ③ 願望圖卡 ============ */
/* 初選、最終選取與圖片卡片集中於 app-workflow.js。 */

/* ============ ④ 願望象限（病人點擊／拖曳：重要性 × 急迫性） ============ */
/* 生活功能項目、星等與象限互動集中於 app-workflow.js。 */

/* ============ ⑤ 生活復健任務（150 項；長短期不在此決定） ============ */
const taskList=()=>TASKS.filter(t=>(ui.td==='all'||t.d===ui.td)&&(ui.tt==='all'||t.t===ui.tt)&&(!ui.tq||(t.n+t.x+t.id).includes(ui.tq)));
VIEWS.tasks=()=>{
  const p=P(),on=planOn(p),list=taskList();
  const relations=relatedItems(p),sugg=relations.map(item=>item.id).filter(id=>!p.sel.includes(id));
  const relCount=id=>relations.find(item=>item.id===id)?.count||0;
  return `<div class="hero"><div><div class="eyebrow">STEP 5 · 生活復健任務（150 項，所有病人皆可使用）</div><h1>為${esc(p.name)}選擇任務</h1><p>所有照護階段都能使用全部任務。${on?'任務屬於短期或長期，會在下一步「復健計畫」中依此病人的狀況由治療師決定。':'本階段選完任務即可儲存，不需建立復健計畫。'}</p></div><div class="panel" style="margin:0"><b>已選 ${p.sel.length} 項</b></div></div>
  ${sugg.length?`<div class="notice ok">依已選願望，系統建議再加入 <b>${sugg.length}</b> 項相關任務。<button class="secondary" data-act="task-suggest" style="margin-left:10px">一鍵帶入建議任務</button></div>`:''}
  <div class="tabs"><button class="ghost-btn ${ui.td==='all'?'on':''}" data-act="task-dom" data-d="all">全部</button>${DKEYS.map(k=>`<button class="ghost-btn ${ui.td===k?'on':''}" data-act="task-dom" data-d="${k}">${DOMAINS[k].emoji} ${k}</button>`).join('')}</div>
  <div class="filterbar"><input id="tq" placeholder="搜尋任務名稱或說明…" value="${esc(ui.tq)}"><select id="tt"><option value="all">全部等級</option>${Object.entries(TIERS).map(([k,v])=>`<option value="${k}" ${ui.tt===k?'selected':''}>${v[0]} ${v[1]}</option>`).join('')}</select><span class="badge">顯示 ${list.length} 項</span><button class="secondary" data-act="book-open" data-k="tasks" data-id="${list[0]?.id}">📖 大圖書本閱讀</button></div>
  <div class="task-grid">${list.map(t0=>{const t=task(t0.id),sel=p.sel.includes(t.id),off=db.taskOff[t.id],rc=relCount(t.id);return `<div class="task-card ${sel?'sel':''} ${off?'off':''}" data-act="${off?'':'task-toggle'}" data-id="${t.id}" style="cursor:pointer"><div class="top"><span class="tier ${t.t}">${TIERS[t.t][0]} ${TIERS[t.t][1]}</span><span class="small">#${t.id}${rc?` ｜ ${DemoCore.stars(rc)} ${rc} 個願望`:''}</span></div><img src="${iconOf(t.id)}" alt="" loading="lazy" data-act="book-open" data-k="tasks" data-id="${t.id}" title="點圖放大" style="cursor:zoom-in"><h4>${esc(t.n)}</h4><p>${esc(t.x)}</p><div class="top"><span class="small">${t.d}${t.p?'｜'+esc(t.p.slice(0,12)):''}</span><button class="ghost-btn" data-act="task-detail" data-id="${t.id}" style="padding:4px 9px;font-size:12px">詳情</button></div>${sel?'<span class="badge" style="position:absolute;top:34px;right:10px">✓ 已選</span>':''}</div>`}).join('')||'<div class="empty">沒有符合的任務</div>'}</div>
  <div class="panel" style="margin-top:18px"><div class="section-title"><div><h3>${on?'已選任務 '+p.sel.length+' 項':'儲存本次任務紀錄'}</h3><span class="small">${on?'請進入復健計畫，決定每項任務的短／長期。':'一般復健／OPD：選完任務即完成該次紀錄。'}</span></div>
    <div class="actions">${on?`<button class="primary" data-act="nav" data-v="plan" ${p.sel.length?'':'disabled'}>下一步：建立復健計畫 →</button>`:`<button class="ghost-btn" data-act="plan-override">治療師選擇產出復健計畫</button><button class="primary" data-act="task-record" ${p.sel.length?'':'disabled'}>儲存本次任務紀錄（流程結束）</button>`}</div></div>
    ${!on&&p.records.length?`<h4>歷次任務紀錄</h4>${[...p.records].reverse().map(r=>`<div class="log-row"><time>${fmtT(r.at)}｜${esc(r.by)}｜階段：${r.stage}</time>${r.ids.map(id=>esc(TASK_BY_ID[id]?.n)).join('、')}</div>`).join('')}`:''}</div>`;
};
AFTER.tasks=()=>{
  const q=$('#tq');q?.addEventListener('change',e=>{ui.tq=e.target.value.trim();render()});
  $('#tt')?.addEventListener('change',e=>{ui.tt=e.target.value;render()});
};
function taskDetail(id){
   const t=task(id),p=P(),rel=p.wishes.map(w=>wishObj(p,w)).filter(w=>w&&(w.rel||[]).includes(id));
  openModal(`${mhead(esc(t.n))}<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><img src="${iconOf(id)}" style="width:120px;height:120px;object-fit:contain" alt=""><div style="flex:1 1 260px"><span class="tier ${t.t}">${TIERS[t.t][0]} ${TIERS[t.t][1]}</span> <span class="badge">${t.d}</span> <span class="small">#${id}</span><p style="line-height:1.7">${esc(t.x)}</p>${t.p?`<p class="small">階段：${esc(t.p)}</p>`:''}</div></div>${rel.length?`<p><b>關聯願望：</b>${rel.map(w=>esc(w.n)).join('、')}</p>`:''}<footer><button class="ghost-btn" data-act="close">關閉</button><button class="primary" data-act="task-toggle" data-id="${id}" data-close="1">${p.sel.includes(id)?'取消選取':'加入已選任務'}</button></footer>`);
}
function wishDetail(id){
  const p=P(),w=wishObj(p,id);if(!w)return;
  const ul=a=>a&&a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="muted">—</p>';
  openModal(`${mhead((w.i||'⭐')+' '+esc(w.n))}${w.vid?`<video src="${esc(w.vid)}" controls playsinline preload="metadata" style="width:100%;max-height:340px;border-radius:12px;background:#000;margin-bottom:10px"></video>`:''}<p style="line-height:1.7"><b>第二層文字（預期目標）：</b>${esc(w.s)||'—'}</p>${w.pm?`<h4>需要的能力</h4><p class="small" style="margin:0">姿勢平衡與大動作</p>${ul(w.pm)}<p class="small" style="margin:0">手部功能</p>${ul(w.hf)}<p class="small" style="margin:0">認知與安全知覺</p>${ul(w.cs)}<h4>友善代償技巧與輔具</h4>${ul(w.ad)}`:''}<h4>對應任務</h4><div class="chip-row">${(w.rel||[]).map(i=>`<span class="badge">#${i} ${esc(TASK_BY_ID[i]?.n)}</span>`).join('')||'尚未對應'}</div><footer><button class="ghost-btn" data-act="close">關閉</button><button class="primary" data-act="wish-toggle" data-id="${esc(id)}" data-close="1">${p.wishCandidates.includes(id)?'取消初選':'加入初選'}</button></footer>`);
  applyViewAccess();
}
