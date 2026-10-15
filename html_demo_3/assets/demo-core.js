'use strict';
/* 純資料規則：不依賴畫面；正式上線可替換 Store 的儲存實作。 */
(function(root){
  const SCHEMA=5;
  /* 各資料版本新增的熟識人職類：舊資料移轉時預設參與，之後保留使用者的設定。 */
  const NEW_FAM={5:['Pharm']};
  const CATEGORIES={
    care:{name:'生活照顧',guide:'我想把自己的日常照顧好'},
    move:{name:'移動外出',guide:'我想去到自己想去的地方'},
    home:{name:'居家生活',guide:'我想重新處理家裡的事'},
    work:{name:'工作與角色',guide:'我想回到原本重要的角色'},
    leisure:{name:'休閒社交',guide:'我想重新做喜歡的事'},
    learn:{name:'認知與學習',guide:'我想自己安排和管理生活'}
  };
  const copy=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const unique=values=>[...new Set(values)];
  function category(w){
    if(CATEGORIES[w.category])return w.category;
    if(['wish-food-04','wish-home-05'].includes(w.id))return 'home';
    if(w.id==='wish-food-05')return 'leisure';
    if(w.id==='wish-home-02')return 'move';
    return ({食:'care',衣:'care',住:'care',行:'move',育:'learn',樂:'leisure'})[w.d]||'care';
  }
  function catalog(base,db){
    const all=[...base,...(db.wishAdded||[])];
    return all.map(w=>({...w,...(db.wishEdit[w.id]||{}),category:category({...w,...(db.wishEdit[w.id]||{})})}));
  }
  function related(p,wishes,taskIds,off={}){
    const ids=new Set(taskIds),hits=new Map();
    unique(p.wishes).forEach(wid=>{
      const w=wishes.find(w=>w.id===wid)||p.custom.find(w=>w.id===wid);
      unique((w?.rel||[]).map(Number)).forEach(id=>{
        if(!ids.has(id)||off[id])return;
        if(!hits.has(id))hits.set(id,[]);
        hits.get(id).push(wid);
      });
    });
    return [...hits].map(([id,wishIds])=>({id,wishIds,count:wishIds.length,stars:stars(wishIds.length)}))
      .sort((a,b)=>b.count-a.count||a.id-b.id);
  }
  function stars(count){return count>0?'★'.repeat(Math.min(3,count))+'☆'.repeat(Math.max(0,3-count)):''}
  function reconcile(p,items){
    const live=new Set(items.map(item=>String(item.id)));
    Object.keys(p.functionPlace).forEach(id=>{if(!live.has(id))delete p.functionPlace[id]});
  }
  /* 熟識人區塊：以後台設定合併內建定義。停用只標記 off，不刪除欄位或已填內容。
   * 欄位格式：[代碼, 顯示名稱, {req, off}]。設定格式見 validateFamConfig。 */
  function famDef(base,cfg){
    const blocks=(cfg&&cfg.blocks)||{},out={};
    const build=(key,src,c)=>{
      const fields=[...(c.custom?(c.fields||[]):src.fields),...(c.extra||[])].map(([k,label,opt])=>[k,(c.fieldLabel||{})[k]||label,{...(opt||{}),off:!!(c.fieldOff||{})[k]}]);
      return {label:c.label||src.label,custom:!!c.custom,off:!!c.off,editors:c.editors||null,fields};
    };
    Object.entries(base).forEach(([key,src])=>{out[key]=build(key,src,blocks[key]||{})});
    Object.entries(blocks).forEach(([key,c])=>{if(c.custom&&!out[key])out[key]=build(key,{label:key,fields:[]},c)});
    return out;
  }
  function validateFamConfig(cfg){
    if(!object(cfg)||!object(cfg.blocks))throw new Error('熟識人區塊設定格式錯誤');
    Object.entries(cfg.blocks).forEach(([key,c])=>{
      const field=f=>Array.isArray(f)&&typeof f[0]==='string'&&f[0]&&typeof f[1]==='string'&&(f[2]===undefined||object(f[2]));
      const map=m=>m===undefined||(object(m)&&Object.values(m).every(v=>typeof v==='string'||typeof v==='boolean'));
      const ok=object(c)&&(c.label===undefined||typeof c.label==='string')&&(!c.custom||(/^X\d+$/.test(key)&&typeof c.label==='string'&&c.label.trim()&&Array.isArray(c.fields)&&c.fields.every(field)))
        &&(c.extra===undefined||(Array.isArray(c.extra)&&c.extra.every(field)))&&map(c.fieldLabel)&&map(c.fieldOff);
      if(!ok)throw new Error('熟識人區塊設定格式錯誤：'+key);
    });
  }
  /* 檢討與修訂提醒（R-07）：系統預設 → 照護模式預設 → 個案設定，下層優先。
   * 日期格式 YYYY-MM-DD，以本地時間 00:00 起算。指定日期之後已有對應的新版本，改依天數計算。 */
  const REMIND={review:14,revise:80,window:7};
  const REVISION_TYPES=['週期修訂','80天修訂']; // 「80天修訂」為 10/14 以前的舊類型名稱，舊版本不改寫 lint-allow:T5
  const DATE=/^\d{4}-\d{2}-\d{2}$/;
  function validateReminder(r,label){
    const days=v=>v===undefined||(Number.isInteger(v)&&v>=1&&v<=365);
    const date=v=>{if(v===undefined)return true;if(typeof v!=='string'||!DATE.test(v))return false;const d=new Date(v+'T00:00:00');
      return !Number.isNaN(d.getTime())&&`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===v}; // 拒絕 2026-02-30 這類會被自動進位的日期
    if(!object(r)||!days(r.review)||!days(r.revise)||!date(r.reviewDate)||!date(r.reviseDate))throw new Error(`提醒設定格式錯誤：${label}（天數 1～365，日期 YYYY-MM-DD）`);
  }
  function reminderSettings(stage,modeCfg,caseCfg){
    const m=(modeCfg||{})[stage]||{},c=caseCfg||{};
    const pick=k=>c[k]!==undefined?[c[k],'個案設定']:m[k]!==undefined?[m[k],'照護模式預設']:[REMIND[k],'系統預設'];
    const [review,reviewDaysSrc]=pick('review'),[revise,reviseDaysSrc]=pick('revise');
    return {review,revise,window:REMIND.window,reviewDate:c.reviewDate||null,reviseDate:c.reviseDate||null,reviewDaysSrc,reviseDaysSrc,
      reviewSrc:c.reviewDate?'個案指定日期':reviewDaysSrc,reviseSrc:c.reviseDate?'個案指定日期':reviseDaysSrc};
  }
  function reminderInfo(plans,set,nowMs){
    if(!plans||!plans.length)return null;
    /* 以日曆日計算：第 N 天當天 0 點起即為到期，與畫面上顯示的日期一致（G6-M6，決策 D-16）。 */
    const DAY=864e5,t=v=>new Date(v.at).getTime(),dayOf=d=>new Date(d+'T00:00:00').getTime();
    const sod=ms=>{const d=new Date(ms);d.setHours(0,0,0,0);return d.getTime()},days=(a,b)=>Math.round((sod(b)-sod(a))/DAY);
    const last=plans[plans.length-1],base=[...plans].reverse().find(v=>REVISION_TYPES.includes(v.type))||plans[0];
    const age=days(t(last),nowMs),cyc=days(t(base),nowMs);
    const rDate=set.reviewDate&&t(last)<dayOf(set.reviewDate)?dayOf(set.reviewDate):null;
    const rDue=rDate!==null?rDate:sod(t(last)+set.review*DAY),rOver=rDue+(set.window+1)*DAY; // 第 N～N+7 天（含）為檢討期
    const vDate=set.reviseDate&&!plans.some(v=>REVISION_TYPES.includes(v.type)&&t(v)>=dayOf(set.reviseDate))?dayOf(set.reviseDate):null;
    const vDue=vDate!==null?vDate:sod(t(base)+set.revise*DAY);
    return {age,cyc,
      review:{state:nowMs<rDue?'upcoming':nowMs<rOver?'due':'overdue',due:rDue,overdueAt:rOver,lastDay:rOver-DAY,byDate:rDate!==null,from:set.review,to:set.review+set.window,src:rDate!==null?'個案指定日期':set.reviewDaysSrc},
      revise:{state:nowMs>=vDue?'due':'upcoming',due:vDue,byDate:vDate!==null,days:set.revise,daysLeft:Math.max(0,days(nowMs,vDue)),src:vDate!==null?'個案指定日期':set.reviseDaysSrc}};
  }
  function migrate(value,defaults,famKeys){
    if(!object(value)||!Array.isArray(value.patients)||!value.patients.length)throw new Error('資料缺少病人清單');
    if(value.schemaVersion>SCHEMA)throw new Error('資料版本較新，請使用相容的程式');
    const db=copy(value),ids=new Set();
    if(db.famConfig===undefined)db.famConfig={blocks:{}};
    if(db.reminderCfg===undefined)db.reminderCfg={};
    if(!object(db.reminderCfg))throw new Error('提醒設定格式錯誤：照護模式');
    Object.entries(db.reminderCfg).forEach(([stage,r])=>validateReminder(r,stage));
    validateFamConfig(db.famConfig);
    /* 自訂區塊代碼（X 加數字）即使設定已刪除也保留參與設定，避免日後重新設定時遺失。 */
    const allowedFam=[...famKeys,...Object.keys(db.famConfig.blocks).filter(k=>db.famConfig.blocks[k].custom)];
    const keepFam=k=>allowedFam.includes(k)||/^X\d+$/.test(k);
    const arrays=['wishes','custom','sel','records','famHist','plans'];
    const maps=['place','tasks','fam'];
    db.patients.forEach(p=>{
      if(!object(p)||typeof p.id!=='string'||!p.id||ids.has(p.id))throw new Error('病人識別碼缺漏或重複');
      ids.add(p.id);
      if(!Array.isArray(p.stages)||!p.stages.length||p.stages.some(s=>!object(s)||typeof s.stage!=='string'))throw new Error('照護模式資料不完整');
      arrays.forEach(k=>{if(p[k]===undefined)p[k]=[];if(!Array.isArray(p[k]))throw new Error('病人欄位格式錯誤：'+k)});
      maps.forEach(k=>{if(p[k]===undefined)p[k]={};if(!object(p[k]))throw new Error('病人欄位格式錯誤：'+k)});
      p.ext=p.ext||{pac:'',xin:''};
      if(!object(p.ext))throw new Error('外部識別碼格式錯誤');
      p.plans.forEach(plan=>{
        const snap=plan?.snap;
        if(!object(plan)||!Number.isInteger(plan.ver)||!object(snap)||!object(snap.term)||!['expect','long','short','prog'].every(k=>Array.isArray(snap[k])))throw new Error('計畫版本格式錯誤');
        if(snap.expect.some(e=>!object(e)||typeof e.wid!=='string'||typeof e.text!=='string')||snap.prog.some(e=>!object(e)||typeof e.text!=='string')||[...snap.long,...snap.short].some(s=>typeof s!=='string'))throw new Error('計畫內容格式錯誤');
      });
      p.famHist.forEach(h=>{if(!object(h)||!object(h.data)||typeof h.tab!=='string')throw new Error('熟識人歷史格式錯誤')});
      p.records.forEach(r=>{if(!object(r)||!Array.isArray(r.ids))throw new Error('任務紀錄格式錯誤')});
      Object.values(p.fam).forEach(f=>{if(!object(f)||Object.values(f).some(v=>typeof v!=='string'))throw new Error('熟識人內容格式錯誤')});
      p.custom.forEach(validateWish);
      if(p.wishCandidates===undefined)p.wishCandidates=unique(p.wishes);
      if(!Array.isArray(p.wishCandidates))throw new Error('初選願望格式錯誤');
      p.wishCandidates=unique(p.wishCandidates);
      p.wishes=unique(p.wishes); // 舊資料不自動截成五項，避免遺失。
      if([...p.wishCandidates,...p.wishes].some(id=>typeof id!=='string'||!id))throw new Error('願望識別碼格式錯誤');
      if(!p.wishes.every(id=>p.wishCandidates.includes(id)))throw new Error('最終願望必須存在初選清單');
      if(p.functionPlace===undefined)p.functionPlace={};
      if(!object(p.functionPlace))throw new Error('生活功能位置格式錯誤');
      Object.values(p.functionPlace).forEach(pos=>{if(!object(pos)||!Number.isFinite(pos.x)||!Number.isFinite(pos.y)||pos.x<0||pos.x>100||pos.y<0||pos.y>100)throw new Error('生活功能位置超出範圍')});
      if(p.reminder===undefined)p.reminder={};
      validateReminder(p.reminder,p.id);
      if(p.famEnabled===undefined)p.famEnabled=famKeys.slice();
      if(!Array.isArray(p.famEnabled))throw new Error('參與職類格式錯誤');
      Object.entries(NEW_FAM).forEach(([ver,keys])=>{if((value.schemaVersion||0)<+ver)p.famEnabled.push(...keys)});
      p.famEnabled=unique(p.famEnabled.filter(keepFam));
    });
    ['taskOff','taskEdit','stageCfg','wishEdit'].forEach(k=>{
      if(db[k]===undefined)db[k]=copy(defaults[k]||{});
      if(!object(db[k]))throw new Error('設定欄位格式錯誤：'+k);
    });
    ['logs','phrases','wishAdded'].forEach(k=>{
      if(db[k]===undefined)db[k]=copy(defaults[k]||[]);
      if(!Array.isArray(db[k]))throw new Error('清單格式錯誤：'+k);
    });
    db.wishAdded.forEach(validateWish);
    const wishIds=new Set();
    [...db.wishAdded,...db.patients.flatMap(p=>p.custom)].forEach(w=>{if(wishIds.has(w.id))throw new Error('自訂願望識別碼重複');wishIds.add(w.id)});
    Object.entries(db.wishEdit).forEach(([id,w])=>validateWish({id,n:w.n||'未命名',rel:w.rel||[],...w}));
    Object.values(db.taskEdit).forEach(t=>{if(!object(t)||typeof t.n!=='string'||typeof t.x!=='string')throw new Error('任務編輯內容格式錯誤')});
    if(db.phrases.some(s=>typeof s!=='string'))throw new Error('預後片語格式錯誤');
    if(db.logs.some(l=>!object(l)||typeof l.action!=='string'))throw new Error('操作紀錄格式錯誤');
    if(db.goalPhrases===undefined)db.goalPhrases={long:[],short:[]};
    if(!object(db.goalPhrases)||!Array.isArray(db.goalPhrases.long)||!Array.isArray(db.goalPhrases.short))throw new Error('目標語句格式錯誤');
    if([...db.goalPhrases.long,...db.goalPhrases.short].some(s=>typeof s!=='string'))throw new Error('目標語句內容格式錯誤');
    db.settings={finalLimit:5,...db.settings};
    if(!Number.isInteger(db.settings.finalLimit)||db.settings.finalLimit<1||db.settings.finalLimit>20)throw new Error('最終願望上限須為 1～20');
    db.role=db.role||defaults.role;
    db.dayShift=Number.isFinite(db.dayShift)?db.dayShift:0;
    if(!ids.has(db.cur))db.cur=db.patients[0].id;
    db.schemaVersion=SCHEMA;
    return db;
  }
  function validateWish(w){
    if(!object(w)||typeof w.id!=='string'||!w.id||typeof w.n!=='string'||!Array.isArray(w.rel)||w.rel.some(id=>!Number.isInteger(id)||id<1||id>150))throw new Error('願望與任務對應格式錯誤');
    if(w.picture)mediaPath(w.picture,'image');
    if(w.vid)mediaPath(w.vid,'video');
  }
  function selectFinal(p,id){
    if(!p.wishCandidates.includes(id))throw new Error('請先將願望加入初選清單');
    const index=p.wishes.indexOf(id);
    if(index>=0)p.wishes.splice(index,1);
    else p.wishes.push(id);
  }
  function mediaPath(value,type){
    if(!value)return '';
    const suffix=type==='video'?'mp4|webm':'png|jpg|jpeg|webp|svg';
    if(value.includes('..')||!new RegExp('^assets/[a-zA-Z0-9_./-]+\\.('+suffix+')$','i').test(value))throw new Error('媒體請使用 assets/ 下的本機檔案路徑');
    return value;
  }
  class Store{
    constructor(storage,key){this.storage=storage;this.key=key;this.blocked=false;this.error='';this.raw=null}
    read(defaults,famKeys){
      try{
        this.raw=this.storage.getItem(this.key);
        return migrate(this.raw===null?defaults:JSON.parse(this.raw),defaults,famKeys);
      }catch(error){
        this.blocked=true;this.error='讀取失敗：'+error.message+'。原始資料未覆寫；目前為唯讀示範。';
        return migrate(defaults,defaults,famKeys);
      }
    }
    write(value){
      if(this.blocked)throw new Error(this.error);
      try{this.storage.setItem(this.key,JSON.stringify(value));this.error='';return true}
      catch(error){this.error='儲存失敗：'+error.message+'。本次修改未保存。';throw new Error(this.error)}
    }
  }
  function readPreference(key,fallback){try{return root.localStorage.getItem(key)??fallback}catch{return fallback}}
  function writePreference(key,value){try{root.localStorage.setItem(key,value);return true}catch{return false}}
  root.DemoCore={SCHEMA,CATEGORIES,category,catalog,related,stars,reconcile,famDef,REMIND,REVISION_TYPES,validateReminder,reminderSettings,reminderInfo,migrate,selectFinal,mediaPath,Store,readPreference,writePreference};
})(typeof window==='undefined'?globalThis:window);
