const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const code=name=>fs.readFileSync(path.join(root,'assets',name),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function core(){const ctx=vm.createContext({});vm.runInContext(code('demo-core.js'),ctx);return ctx.DemoCore}
function fixture(){return {patients:[{id:'P1',stages:[{stage:'PAC'}],wishes:['a'],custom:[],place:{a:{x:20,y:30}},plans:[]}],role:'PT',cur:'P1',phrases:[]}}

test('星等：1、2、3、4 命中；去重並保留真實命中數',()=>{
  const C=core(),wishes=['a','b','c','d'].map((id,i)=>({id,rel:[1,1,...(i<2?[2]:[]),...(i<1?[3]:[])]}));
  const p={wishes:['a','a','b','c','d'],custom:[]};
  const items=plain(C.related(p,wishes,[1,2,3]));
  assert.deepEqual(items.map(x=>[x.id,x.count,x.stars]),[[1,4,'★★★'],[2,2,'★★☆'],[3,1,'★☆☆']]);
  assert.equal(C.stars(0),'');assert.equal(C.stars(3),'★★★');
});
test('排序：同命中數依任務編號；不跨病人；停用項目不展開',()=>{
  const C=core(),wishes=[{id:'a',rel:[3,1,2]}];
  assert.deepEqual(plain(C.related({wishes:['a'],custom:[]},wishes,[1,2,3],{2:true})).map(x=>x.id),[1,3]);
  assert.equal(C.related({wishes:[],custom:[]},wishes,[1,2,3]).length,0);
});
test('最終選取：必須先初選；可超過五個；取消後可重新選取',()=>{
  const C=core(),p={wishCandidates:['a','b','c','d','e','f'],wishes:[]};
  for(const id of ['a','b','c','d','e'])C.selectFinal(p,id,5);
  C.selectFinal(p,'f');assert.equal(p.wishes.length,6);assert.throws(()=>C.selectFinal(p,'z'),/初選/);
  C.selectFinal(p,'a');C.selectFinal(p,'a');assert.equal(p.wishes.length,6);
});
test('取消願望：只移除零命中功能位置，保留願望舊位置與歷史計畫',()=>{
  const C=core(),p={functionPlace:{1:{x:20,y:20},2:{x:80,y:80}},place:{a:{x:20,y:30}},plans:[{ver:1}]};
  C.reconcile(p,[{id:2}]);assert.deepEqual(Object.keys(p.functionPlace),['2']);assert.equal(p.plans.length,1);assert.ok(p.place.a);
});
test('移轉：補入版本與新增欄位；不截斷舊願望；不修改輸入資料',()=>{
  const C=core(),old=fixture();old.patients[0].wishes=['a','b','c','d','e','f'];const before=JSON.stringify(old);
  const db=plain(C.migrate(old,fixture(),['PT','ST']));
  assert.equal(JSON.stringify(old),before);assert.equal(db.schemaVersion,5);assert.equal(db.patients[0].wishes.length,6);
  assert.deepEqual(db.patients[0].wishCandidates,old.patients[0].wishes);assert.deepEqual(db.patients[0].functionPlace,{});assert.ok(db.patients[0].place.a);
  assert.deepEqual(db.patients[0].famEnabled,['PT','ST']);
});
test('匯入驗證：拒絕空清單、重複識別碼、新版本與錯誤計畫',()=>{
  const C=core();assert.throws(()=>C.migrate({patients:[]},fixture(),[]));
  let bad=fixture();bad.patients.push(plain(bad.patients[0]));assert.throws(()=>C.migrate(bad,fixture(),[]),/重複/);
  bad=fixture();bad.schemaVersion=999;assert.throws(()=>C.migrate(bad,fixture(),[]),/較新/);
  bad=fixture();bad.patients[0].plans=[{ver:1,snap:{}}];assert.throws(()=>C.migrate(bad,fixture(),[]),/計畫/);
});
test('讀取失敗：不覆寫原始資料，進入唯讀模式',()=>{
  const C=core();let writes=0;const store=new C.Store({getItem:()=>'{broken',setItem:()=>writes++},'key');
  assert.ok(store.read(fixture(),['PT']).patients.length);assert.equal(store.blocked,true);
  assert.throws(()=>store.write(fixture()),/讀取失敗/);assert.equal(writes,0);assert.equal(store.raw,'{broken');
});
test('儲存失敗：向呼叫端報錯，不忽略容量錯誤',()=>{
  const C=core(),store=new C.Store({setItem:()=>{throw new Error('quota')}},'key');
  assert.throws(()=>store.write(fixture()),/儲存失敗.*quota/);
});
test('願望分類與任務領域分離；媒體只接受本機 assets 路徑',()=>{
  const C=core();assert.equal(Object.keys(C.CATEGORIES).length,6);assert.equal(C.category({id:'wish-food-04',d:'食'}),'home');
  assert.equal(C.mediaPath('assets/icons/1.png','image'),'assets/icons/1.png');
  for(const value of ['javascript:alert(1)','assets/../private.png','https://example.com/x.png','data:image/png;base64,x'])assert.throws(()=>C.mediaPath(value,'image'));
});

/* 使用輕量 DOM 替身驗證整個載入順序、畫面模板及事件。這不是瀏覽器測試。 */
function app(initial=null,failWrites=false){
  const nodes=new Map(),listeners=new Map(),storage=new Map();if(initial!==null)storage.set('yk-demo3-v2',initial);
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){return null},addEventListener(type,fn){listeners.set(selector+':'+type,fn)}});return nodes.get(selector)};
  const ctx=vm.createContext({console,Date,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout:()=>0,clearTimeout(){},confirm:()=>true,scrollY:0,
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(failWrites)throw new Error('quota');storage.set(key,value)}},
    document:{querySelector:node,querySelectorAll:()=>[],addEventListener(type,fn){listeners.set('document:'+type,fn)},body:{classList:{add(){},remove(){},toggle(){}}}},
    Snd:{view(){},win(){},toggle(){},isMuted(){return false}},Big:{toggle(){}},Book:{},scrollTo(){},addEventListener(){},print(){}});
  ctx.window=ctx;
  for(const name of ['data.js','demo-core.js','app.js','app-plan.js','app-workflow.js','app-admin.js','app-access.js'])vm.runInContext(code(name),ctx,{filename:name});
  return {ctx,node,storage,listeners,run:code=>vm.runInContext(code,ctx)};
}
test('完整載入與主要畫面：保留 150 項任務、護照與計畫',()=>{
  const a=app();assert.equal(a.run('TASKS.length'),150);assert.equal(a.run('db.patients.length'),4);
  for(const view of ['patient','familiar','wishes','quad','tasks','plan','passport','report'])assert.ok(a.run(`VIEWS.${view}()`).length>30,view);
  a.run("db.role='Admin'");for(const tab of ['patients','wishes','tasks','stages','goals','phrases','logs','export'])assert.ok(a.run(`ui.ad='${tab}';VIEWS.admin()`).length>30,tab);
});
test('儲存提示：正常時隱藏，發生錯誤才顯示，復原後再次隱藏',()=>{
  const a=app();assert.equal(a.node('#storageStatus').hidden,true);assert.equal(a.node('#storageStatus').textContent,'');
  a.run("store.error='儲存失敗';updateStorageStatus()");assert.equal(a.node('#storageStatus').hidden,false);
  a.run("store.error='';updateStorageStatus()");assert.equal(a.node('#storageStatus').hidden,true);
});
test('待放置：預設前五項，展開與收合不改資料；切換病人恢復前五項',()=>{
  const a=app(),before=a.run('JSON.stringify(db)');
  const trayIds=html=>[...html.split('id="tray">')[1].split('</div>\n    ')[0].matchAll(/data-tid="(\d+)"/g)].map(m=>Number(m[1]));
  const html=a.run('VIEWS.quad()'),expected=plain(a.run('relatedItems(P()).filter(item=>!P().functionPlace[item.id]).map(item=>item.id)'));
  assert.deepEqual(trayIds(html),expected.slice(0,5));assert.ok(!html.includes('已確認願望'));assert.ok(html.includes(`待放置（${expected.length}）`));
  a.run("ACT['quad-more']()");assert.deepEqual(trayIds(a.run('VIEWS.quad()')),expected);
  a.run("ACT['quad-more']()");assert.equal(trayIds(a.run('VIEWS.quad()')).length,5);assert.equal(a.run('JSON.stringify(db)'),before);
  a.run("ACT['quad-more']();db.cur='P-0002'");assert.ok(trayIds(a.run('VIEWS.quad()')).length<=5);
  a.run('P().wishes=[]');assert.equal(trayIds(a.run('VIEWS.quad()')).length,0);assert.ok(!a.run('VIEWS.quad()').includes('data-act="quad-more"'));
});
test('工作流程：初選不立即成為最終；星等與功能位置重整後保存',()=>{
  const a=app();
  a.run("runChange(()=>{P().wishCandidates=[];P().wishes=[];P().functionPlace={}})");
  a.run("runChange(()=>toggleCandidate('wish-food-01'))");assert.equal(a.run('P().wishes.length'),0);
  a.run("runChange(()=>ACT['wish-final']({dataset:{id:'wish-food-01'}}))");
  a.run('runChange(()=>setPlace(1,75,25))');assert.equal(a.run('P().functionPlace[1].x'),75);
  const b=app(a.storage.get('yk-demo3-v2'));assert.equal(b.run('P().functionPlace[1].x'),75);assert.equal(b.run('relatedItems(P())[0].count'),1);
  b.run("runChange(()=>toggleCandidate('wish-food-01'))");assert.equal(b.run('Object.keys(P().functionPlace).length'),0);assert.equal(b.run('P().plans.length'),2);
});
test('待放置不遞補：放置後剩四項，退回後立即顯示原卡片',()=>{
  const a=app();a.run('VIEWS.quad()');const ids=plain(a.run('ui.quadVisibleIds'));
  a.run(`runChange(()=>setPlace(${ids[0]},75,25))`);
  assert.equal(a.run('relatedItems(P()).filter(item=>!P().functionPlace[item.id]&&ui.quadVisibleIds.includes(item.id)).length'),4);
  a.run(`runChange(()=>returnToTray(${ids[0]}))`);
  assert.equal(a.run('relatedItems(P()).filter(item=>!P().functionPlace[item.id]&&ui.quadVisibleIds.includes(item.id)).length'),5);
  a.run(`runChange(()=>setPlace(${ids[0]},75,25));ACT['quad-more']()`);
  assert.equal(a.run('ui.quadMore'),true);
});
test('固定批次：五張全部放置後保持空白，展開再收合也不遞補',()=>{
  const a=app();a.run('VIEWS.quad()');const ids=plain(a.run('ui.quadVisibleIds'));
  for(const id of ids)a.run(`runChange(()=>setPlace(${id},75,25))`);
  assert.ok(a.run('relatedItems(P()).filter(item=>!P().functionPlace[item.id]).length')>0);
  assert.ok(a.run('VIEWS.quad()').includes('id="tray"></div>'));
  a.run("ACT['quad-more']()");assert.ok(a.run('ui.quadVisibleIds.length')>0);
  a.run("ACT['quad-more']()");assert.ok(a.run('VIEWS.quad()').includes('id="tray"></div>'));
  a.run(`runChange(()=>returnToTray(${ids[0]}))`);
  assert.equal(a.run('relatedItems(P()).filter(item=>!P().functionPlace[item.id]&&ui.quadVisibleIds.includes(item.id)).length'),1);
});
test('收合兩區合計五張：已放置卡片也計入原批次，退回不增加名額',()=>{
  const a=app();const ids=plain(a.run('relatedItems(P()).slice(0,5).map(item=>item.id)'));
  a.run(`P().functionPlace[${ids[0]}]={x:75,y:25}`);
  const html=a.run('VIEWS.quad()');assert.equal([...html.matchAll(/data-tid="/g)].length,5);
  a.run(`runChange(()=>returnToTray(${ids[0]}))`);
  assert.equal([...a.run('VIEWS.quad()').matchAll(/data-tid="/g)].length,5);
  assert.equal(a.run('ui.quadBatchIds.length'),5);
});
test('展開額外卡片可放置，收合後隱藏但保留位置，再展開恢復',()=>{
  const a=app();a.run('VIEWS.quad()');const extra=a.run('relatedItems(P())[5].id');
  a.run(`ACT['quad-more']();runChange(()=>setPlace(${extra},75,25));ACT['quad-more']()`);
  assert.equal([...a.run('VIEWS.quad()').matchAll(/data-tid="/g)].length,5);
  assert.ok(!a.run('VIEWS.quad()').includes(`data-tid="${extra}"`));assert.equal(a.run(`P().functionPlace[${extra}].x`),75);
  a.run("ACT['quad-more']()");assert.ok(a.run('VIEWS.quad()').includes(`data-tid="${extra}"`));
  a.run(`runChange(()=>returnToTray(${extra}));ACT['quad-more']()`);
  assert.equal(a.run('ui.quadBatchIds.length'),5);assert.equal([...a.run('VIEWS.quad()').matchAll(/data-tid="/g)].length,5);
});
test('自動排列：依放置順序排在所屬象限，保留其他象限',()=>{
  const a=app();a.run('VIEWS.quad()');const ids=plain(a.run('ui.quadVisibleIds'));
  a.run(`runChange(()=>setPlace(${ids[1]},75,25));runChange(()=>setPlace(${ids[0]},75,25));runChange(()=>setPlace(${ids[2]},25,75))`);
  assert.ok(a.run(`P().functionPlace[${ids[1]}].order<P().functionPlace[${ids[0]}].order`));
  assert.equal(a.run(`qOf(P().functionPlace[${ids[2]}])`),'bl');
  const html=a.run('VIEWS.quad()');assert.ok(html.includes('data-quadrant="tr"'));assert.ok(html.includes('data-act="quad-remove"'));
  a.run(`runChange(()=>returnToTray(${ids[1]}))`);assert.equal(a.run(`qOf(P().functionPlace[${ids[2]}])`),'bl');
});
test('模擬權限：書記建檔、各職類分區、病人模式限制',()=>{
  const a=app();assert.equal(a.run("canFamily('PT')"),true);assert.equal(a.run("canFamily('OT')"),false);assert.equal(a.run('canBuild()'),false);
  a.run("db.role='Clerk'");assert.equal(a.run('canBuild()'),true);assert.equal(a.run('canPlan()'),false);assert.equal(a.run('canManage()'),false);
  a.run("db.role='Admin'");assert.equal(a.run('canManage()'),true);assert.equal(a.run("canFamily('common')"),true);
  a.run('ui.patientMode=true');assert.equal(a.run("canView('admin')"),false);assert.equal(a.run('canPlan()'),false);assert.equal(a.run('canInterview()'),true);
});
test('事件權限：不能透過手動呼叫事件寫入他職類或後台',()=>{
  const a=app();const before=a.run('JSON.stringify(db)');
  a.run("invokeAction({dataset:{act:'ad-toggle',id:'1'},getAttribute(){return null}})");assert.equal(a.run('JSON.stringify(db)'),before);
  a.run("ui.ft='OT';invokeAction({dataset:{act:'fam-save'},getAttribute(){return null}})");assert.equal(a.run('JSON.stringify(db)'),before);
});
test('匯入後建檔：依現有最大編號建立主檔，不使用病人筆數作識別碼',()=>{
  const a=app();a.run("db.role='Clerk';db.patients[3].id='P-0005'");
  for(const id of ['fName','fSex','fAge','fBed','fMrn','fPac','fXin','fDx','fCg','fDec','fStage'])a.node('#'+id).value=id==='fStage'?'PAC':'';
  a.node('#fName').value='測試個案';
  a.run("runChange(()=>ACT['patient-add']())");assert.equal(a.run('P().id'),'P-0006');
  assert.equal(a.run('new Set(db.patients.map(p=>p.id)).size'),5);
});
test('儲存失敗：交易回復記憶體資料，顯示失敗，不保留假成功',()=>{
  const a=app(null,true),before=a.run('JSON.stringify(db)');
  assert.equal(a.run("runChange(()=>toggleCandidate('wish-food-03'))"),false);
  assert.equal(a.run('JSON.stringify(db)'),before);assert.match(a.node('#storageStatus').textContent,/儲存失敗/);assert.match(a.node('#toast').textContent,/儲存失敗/);
});
test('匯入預覽不寫入；確認前可拒絕無效格式',()=>{
  const a=app();a.run("db.role='Admin'");const before=a.run('JSON.stringify(db)');
  a.run('prepareImport(JSON.stringify(db))');assert.equal(a.run('JSON.stringify(db)'),before);assert.equal(a.storage.size,0);
  assert.throws(()=>a.run("prepareImport('{bad')"));
});
test('損壞資料的復原：可切換管理員並下載原始資料；不允許一般寫入',()=>{
  const a=app('{broken');
  a.listeners.get('#roleSel:change')({target:{value:'Admin'}});
  assert.equal(a.run('db.role'),'Admin');assert.equal(a.storage.get('yk-demo3-v2'),'{broken');
  assert.equal(a.run("canAction({dataset:{act:'export-raw'}})"),true);
  assert.equal(a.run("canAction({dataset:{act:'wish-admin-save'}})"),false);
  a.run("runChange(()=>ACT['reset-demo']())");assert.equal(a.run('store.blocked'),false);
  assert.equal(JSON.parse(a.storage.get('yk-demo3-v2')).schemaVersion,5);
});
test('病人資料與計畫版本：移轉不改寫歷史；新版本保存願望名稱、任務及功能位置',()=>{
  const a=app();const old=a.run('JSON.stringify(P().plans)');a.run('ensureDraft(P())');assert.equal(a.run('JSON.stringify(P().plans)'),old);
  a.node('#cmType').value='定期檢討';a.node('#cmReason').value='測試修訂';
  a.run('runChange(()=>planCommit())');assert.equal(a.run('P().plans.length'),3);assert.ok(a.run('P().plans[2].snap.taskIds.length')>0);
  assert.ok(a.run('P().plans[2].snap.expect.every(e=>e.name)'));assert.equal(a.run('JSON.stringify(P().plans.slice(0,2))'),old);
});
test('R-04／R-06 藥師：版本 4 資料移轉後加入藥師參與，原有熟識人內容不變',()=>{
  const C=core(),old=fixture();old.schemaVersion=4;old.patients[0].famEnabled=['PT'];old.patients[0].fam={PT:{rom:'右下肢肌力 2/5',_by:'PT',_at:'2026-08-12'}};
  const before=JSON.stringify(old.patients[0].fam);
  const db=plain(C.migrate(old,fixture(),['PT','OT','Pharm']));
  assert.equal(db.schemaVersion,5);assert.deepEqual(db.patients[0].famEnabled,['PT','Pharm']);assert.equal(JSON.stringify(db.patients[0].fam),before);
  const v5=plain(C.migrate({...db,patients:[{...db.patients[0],famEnabled:['PT']}]},fixture(),['PT','OT','Pharm']));
  assert.deepEqual(v5.patients[0].famEnabled,['PT'],'版本 5 資料保留使用者取消藥師參與的設定');
});
test('R-04／R-06 藥師：熟識人區塊、模擬角色、權限、總覽與報表',()=>{
  const a=app();
  assert.ok(a.run("ROLES.some(r=>r.k==='Pharm'&&r.label.includes('藥師'))"));assert.ok(a.run("FAM.Pharm.label.includes('藥師')"));
  assert.ok(a.run("P().famEnabled.includes('Pharm')"));
  a.run("db.role='Pharm'");assert.equal(a.run("canFamily('Pharm')"),true);assert.equal(a.run("canFamily('PT')"),false);assert.equal(a.run('canPlan()'),false);
  a.run("P().fam.Pharm={meds:'Aspirin 100mg QD',_by:'藥師',_at:'2026-10-14'}");
  assert.ok(a.run("ui.ft='overview';VIEWS.familiar()").includes('Aspirin 100mg QD'));
  assert.ok(a.run('VIEWS.report()').includes('Aspirin 100mg QD'));
});
test('R-05 區塊設定合併：內建改名、停用欄位、新增欄位、自訂區塊；不改動內建定義',()=>{
  const C=core(),base={common:{label:'共同資料',fields:[['basic','基本資料']]},PT:{label:'物理治療 PT',fields:[['rom','肌力'],['note','備註']]}};
  const before=JSON.stringify(base);
  const cfg={blocks:{PT:{label:'物理治療',fieldLabel:{rom:'肌力與關節'},fieldOff:{note:true},extra:[['f1','步態']]},
    X1:{custom:true,label:'其他參與者',fields:[['who','身分與關係',{req:true}],['content','內容']]},X2:{custom:true,label:'停用區塊',off:true,fields:[['a','A']]}}};
  const d=plain(C.famDef(base,cfg));
  assert.equal(JSON.stringify(base),before);
  assert.equal(d.PT.label,'物理治療');assert.equal(d.PT.custom,false);
  assert.deepEqual(d.PT.fields.map(f=>[f[0],f[1],!!f[2].off]),[['rom','肌力與關節',false],['note','備註',true],['f1','步態',false]]);
  assert.equal(d.X1.custom,true);assert.equal(d.X1.fields[0][2].req,true);assert.equal(d.X2.off,true);
  assert.deepEqual(Object.keys(d),['common','PT','X1','X2']);
  assert.deepEqual(Object.keys(plain(C.famDef(base,undefined))),['common','PT']);
});
test('R-05 移轉：區塊設定預設為空；自訂區塊可列入參與職類；拒絕格式錯誤的設定',()=>{
  const C=core(),old=fixture();old.famConfig={blocks:{X1:{custom:true,label:'其他參與者',fields:[['who','身分與關係',{req:true}]]}}};old.patients[0].famEnabled=['PT','X1','ZZ'];
  const db=plain(C.migrate(old,fixture(),['PT','ST']));
  assert.deepEqual(db.patients[0].famEnabled,['PT','X1']);
  assert.deepEqual(plain(C.migrate(fixture(),fixture(),['PT'])).famConfig,{blocks:{}});
  const bad=fixture();bad.famConfig={blocks:{X1:{custom:true,label:'',fields:'x'}}};assert.throws(()=>C.migrate(bad,fixture(),['PT']),/熟識人區塊/);
});
test('R-05 後台區塊設定：新增自訂區塊、權限、總覽與報表、停用再啟用不遺失、改名不影響資料、必填欄位',()=>{
  const a=app();
  a.run("db.role='PT'");assert.throws(()=>a.run("famCfgAddBlock('其他參與者')"),/管理員/);
  a.run("db.role='Admin'");const key=a.run("runChange(()=>famCfgAddBlock('其他參與者'));Object.keys(db.famConfig.blocks).find(k=>db.famConfig.blocks[k].custom)");
  assert.ok(a.run(`db.patients.every(p=>p.famEnabled.includes('${key}'))`));
  assert.ok(a.run("db.logs[0].action").includes('熟識人區塊'));
  a.run("db.role='Nurse'");assert.equal(a.run(`canFamily('${key}')`),true);a.run("db.role='PT'");assert.equal(a.run(`canFamily('${key}')`),false);
  a.run(`P().fam['${key}']={who:'長女',content:'每週三陪同復健',_by:'專責護理師',_at:'2026-10-14'}`);
  a.run("ui.ft='overview'");assert.ok(a.run('VIEWS.familiar()').includes('每週三陪同復健'));assert.ok(a.run('VIEWS.report()').includes('每週三陪同復健'));
  a.run("db.role='Admin';P().fam.PT={rom:'右下肢肌力 2/5',_by:'PT',_at:'2026-10-14'}");
  a.run("runChange(()=>famCfgSet('PT',{off:true}))");
  assert.ok(!a.run('VIEWS.familiar()').includes('右下肢肌力 2/5'));assert.ok(!a.run('enabledFam(P())').includes('PT'));assert.equal(a.run('P().fam.PT.rom'),'右下肢肌力 2/5');
  a.run("runChange(()=>famCfgSet('PT',{off:false}))");assert.ok(a.run('VIEWS.familiar()').includes('右下肢肌力 2/5'));
  a.run("runChange(()=>famCfgField('PT','rom',{label:'肌力與關節活動'}))");const html=a.run('VIEWS.familiar()');
  assert.ok(html.includes('肌力與關節活動')&&html.includes('右下肢肌力 2/5'));
  a.run("runChange(()=>famCfgAddField('PT','步態觀察'))");assert.ok(a.run("famAll().PT.fields.some(f=>f[1]==='步態觀察')"));
  a.run("runChange(()=>famCfgField('PT','rom',{off:true}))");assert.ok(!a.run('VIEWS.familiar()').includes('右下肢肌力 2/5'));assert.equal(a.run('P().fam.PT.rom'),'右下肢肌力 2/5');
  a.run(`db.role='Nurse';ui.ft='${key}';ui.famKey='';VIEWS.familiar();ui.famDraft={content:'只填內容'}`);
  assert.equal(a.run("runChange(()=>ACT['fam-save']())"),false,'必填欄位未填不能儲存');
  assert.equal(a.run(`P().fam['${key}'].content`),'每週三陪同復健','未儲存時不覆寫既有內容');assert.equal(a.run('ui.famDraft.content'),'只填內容','保留使用者已輸入的草稿');
});
test('R-07 提醒設定三層：個案優先於照護模式，照護模式優先於系統預設',()=>{
  const C=core();
  let s=plain(C.reminderSettings('PAC',{},{}));assert.deepEqual([s.review,s.revise,s.reviewSrc,s.reviseSrc],[14,80,'系統預設','系統預設']);
  s=plain(C.reminderSettings('PAC',{PAC:{revise:60}},{}));assert.deepEqual([s.revise,s.reviseSrc],[60,'照護模式預設']);
  s=plain(C.reminderSettings('OPD',{PAC:{revise:60}},{}));assert.deepEqual([s.revise,s.reviseSrc],[80,'系統預設']);
  s=plain(C.reminderSettings('PAC',{PAC:{revise:60}},{revise:14,review:7}));assert.deepEqual([s.revise,s.reviseSrc,s.review,s.reviewSrc],[14,'個案設定',7,'個案設定']);
  s=plain(C.reminderSettings('PAC',{},{reviseDate:'2026-11-01'}));assert.equal(s.reviseDate,'2026-11-01');assert.equal(s.reviseSrc,'個案指定日期');
});
test('R-07 提醒計算：天數、指定日期、完成後改依天數、舊版「80天修訂」仍為修訂基準',()=>{
  const C=core(),D=864e5,t0=new Date('2026-08-12T08:00:00').getTime(),at=d=>new Date(t0+d*D).toISOString(),set=c=>C.reminderSettings('PAC',{},c);
  const plans=[{ver:1,at:at(0),type:'初版'}];
  let r=C.reminderInfo(plans,set({}),t0+63*D);
  assert.equal(r.revise.state,'upcoming');assert.equal(r.revise.daysLeft,17);assert.equal(r.review.state,'overdue');assert.equal(r.cyc,63);
  assert.equal(C.reminderInfo(plans,set({revise:14}),t0+14*D).revise.state,'due');
  assert.equal(C.reminderInfo(plans,set({revise:14}),t0+13*D).revise.state,'upcoming');
  assert.equal(C.reminderInfo(plans,set({review:10}),t0+12*D).review.state,'due');
  assert.equal(C.reminderInfo(plans,set({review:10}),t0+18*D).review.state,'overdue');
  const date='2026-09-01',day=new Date(date+'T00:00:00').getTime();
  assert.equal(C.reminderInfo(plans,set({reviseDate:date}),day-D).revise.state,'upcoming');
  assert.equal(C.reminderInfo(plans,set({reviseDate:date}),day+9*3600e3).revise.state,'due');
  const done=[...plans,{ver:2,at:new Date(day+10*3600e3).toISOString(),type:'週期修訂'}];
  r=C.reminderInfo(done,set({reviseDate:date,revise:30}),day+2*D);
  assert.equal(r.revise.state,'upcoming','指定日期後已完成修訂，改依天數計算');assert.equal(r.revise.daysLeft,28,'9/1 存檔、每 30 天 → 10/1 到期；9/3 時剩 28 個日曆日（D-16）');
  const legacy=[...plans,{ver:2,at:at(80),type:'80天修訂'}];
  assert.equal(C.reminderInfo(legacy,set({}),t0+90*D).cyc,10);
  assert.equal(C.reminderInfo([],set({}),t0),null);
});
test('R-07 移轉：提醒設定預設為空；拒絕無效天數與日期',()=>{
  const C=core(),db=plain(C.migrate(fixture(),fixture(),['PT']));
  assert.deepEqual(db.reminderCfg,{});assert.deepEqual(db.patients[0].reminder,{});
  let bad=fixture();bad.reminderCfg={PAC:{revise:0}};assert.throws(()=>C.migrate(bad,fixture(),['PT']),/提醒/);
  bad=fixture();bad.patients[0].reminder={reviseDate:'2026/11/01'};assert.throws(()=>C.migrate(bad,fixture(),['PT']),/提醒/);
  bad=fixture();bad.patients[0].reminder={review:400};assert.throws(()=>C.migrate(bad,fixture(),['PT']),/提醒/);
});
test('R-07 計畫頁：個案提醒設定、照護模式預設、修訂類型與 AI 句子依設定；不改動既有版本',()=>{
  const a=app();a.run("db.role='PT'");
  const html=a.run('VIEWS.plan()');assert.ok(html.includes('週期修訂'));assert.ok(!/80 ?天修訂/.test(html));
  assert.ok(a.run('(commitModal(),document.querySelector("#modal").innerHTML)').includes('週期修訂'));
  const plansBefore=a.run('JSON.stringify(P().plans)');
  a.run("runChange(()=>setReminder({revise:14}))");assert.equal(a.run('P().reminder.revise'),14);assert.ok(a.run('db.logs[0].action').includes('提醒'));
  assert.ok(a.run('VIEWS.plan()').includes('每 14 天'));
  a.run("runChange(()=>setReminder({reviseDate:'2026-12-01'}))");assert.equal(a.run('JSON.stringify(P().plans)'),plansBefore);
  assert.ok(a.run("aiPrognosis(P()).map(x=>x.text).join('')").includes('2026-12-01'));
  a.run("runChange(()=>setReminder({}))");assert.deepEqual(plain(a.run('P().reminder')),{});
  a.run("db.role='OT'");assert.throws(()=>a.run("setModeReminder('PAC',{revise:30})"),/管理員/);
  a.run("db.role='Admin'");a.run("runChange(()=>setModeReminder('PAC',{revise:60}))");assert.equal(a.run('db.reminderCfg.PAC.revise'),60);
  a.run("db.role='PT'");assert.ok(a.run('VIEWS.plan()').includes('每 60 天'));
  assert.ok(a.run("aiPrognosis(P()).map(x=>x.text).join('')").includes('60 天'));
});
test('R-08 護照不區分版本：單一頁面含進度、獎盃、願望→目標→任務連結、150 項生活任務',()=>{
  const a=app();a.run("db.cur='P-0001'");const html=a.run('VIEWS.passport()');
  assert.ok(!/護照\s*[12]\.0|data-act="pv"|[12]\.0｜/.test(html),'不出現版本分頁');
  for(const t of ['獎盃櫃','成就徽章','我的願望與目標','150 項生活任務','長期目標','預後目標'])assert.ok(html.includes(t),t);
  assert.ok(html.indexOf('獎盃櫃')<html.indexOf('我的願望與目標')&&html.indexOf('我的願望與目標')<html.indexOf('150 項生活任務'),'區塊順序依 Q3 預設');
  const links=plain(a.run('passportLinks(P())'));assert.ok(links.rows.length>0);
  for(const r of links.rows){assert.ok(html.includes(`data-wish-link="${r.wish.id}"`));
    for(const t of r.tasks){assert.ok(a.run(`(WISHES.find(w=>w.id==='${r.wish.id}')||P().custom.find(w=>w.id==='${r.wish.id}')).rel.includes(${t.id})`),'任務屬於該願望')}}
  const ids=links.rows.flatMap(r=>r.tasks.map(t=>t.id)).concat(links.extra.map(t=>t.id));
  assert.deepEqual([...new Set(ids)].sort((x,y)=>x-y),plain(a.run('(P().plans.at(-1).snap.taskIds||P().sel)')).slice().sort((x,y)=>x-y),'計畫任務全部出現在願望連結或其他任務');
});
test('R-08 護照連結即時反映任務狀態與共學夥伴；不需計畫的病人顯示已選任務',()=>{
  const a=app();a.run("db.cur='P-0001'");
  const id=a.run('passportLinks(P()).rows.find(r=>r.tasks.length).tasks[0].id');
  a.run(`P().tasks[${id}]={st:'已解鎖',at:'2026-10-14T08:00',partner:'家屬夥伴'}`);
  const t=plain(a.run(`passportLinks(P()).rows.flatMap(r=>r.tasks).find(t=>t.id===${id})`));assert.equal(t.st,'已解鎖');
  const chip=(html,tid)=>(new RegExp(`<button class="wl-task[^"]*" data-act="pp-open" data-id="${tid}">[\\s\\S]*?</button>`).exec(html)||[''])[0];
  const free=a.run("passportLinks(P()).rows.flatMap(r=>r.tasks).find(t=>!t.partner).id");
  assert.ok(!chip(a.run('VIEWS.passport()'),free).includes('共學夥伴：多功能型照顧服務員'),'修改前不成立');
  a.run(`P().tasks[${free}]={...(P().tasks[${free}]||{st:'未開始',at:''}),partner:'多功能型照顧服務員'}`);
  assert.ok(chip(a.run('VIEWS.passport()'),free).includes('共學夥伴：多功能型照顧服務員'),'願望連結卡顯示共學夥伴');
  const off=a.run('db.patients.find(p=>!planOn(p)&&p.sel.length).id');a.run(`db.cur='${off}'`);
  const l=plain(a.run('passportLinks(P())'));assert.equal(l.snap,null);
  assert.deepEqual([...new Set(l.rows.flatMap(r=>r.tasks.map(t=>t.id)).concat(l.extra.map(t=>t.id)))].sort((x,y)=>x-y),plain(a.run('P().sel')).slice().sort((x,y)=>x-y));
  assert.ok(a.run('VIEWS.passport()').includes('目前照護模式不需建立復健計畫'));
});
test('G6-M2 名稱跳脫：區塊與欄位名稱含 < " 時，各畫面不產生 HTML',()=>{
  const a=app();a.run("db.role='Admin'");
  a.run(`runChange(()=>famCfgSet('PT',{label:'物理治療 <img src=x onerror=alert(1)> "PT"'}))`);
  a.run(`runChange(()=>famCfgField('PT','rom',{label:'肌力 <b>"x"</b>'}))`);
  a.run("P().fam.PT={rom:'2/5',_by:'PT',_at:'2026-10-14'};P().famHist.push({tab:'PT',by:'PT',at:'2026-10-14',data:{rom:'2/5'}})");
  const pages=[a.run("ui.ft='overview';VIEWS.familiar()"),a.run("ui.ft='PT';ui.famKey='';VIEWS.familiar()"),a.run('VIEWS.report()'),a.run("ui.ad='patients';adminPatients()"),a.run('adminFamCfg()')];
  for(const html of pages){assert.ok(!html.includes('<img src=x'),'區塊名稱已跳脫');assert.ok(!html.includes('<b>"x"'),'欄位名稱已跳脫')}
});
test('G6-M2 停用期間新增的病人，重新啟用後仍參與該區塊；參與設定可看到停用區塊',()=>{
  const a=app();a.run("db.role='Admin'");a.run("runChange(()=>famCfgSet('Pharm',{off:true}))");
  for(const id of ['fName','fSex','fAge','fBed','fMrn','fPac','fXin','fDx','fCg','fDec','fStage'])a.node('#'+id).value=id==='fStage'?'PAC':'';
  a.node('#fName').value='停用期間新病人';a.run("runChange(()=>ACT['patient-add']())");
  assert.ok(a.run("P().famEnabled.includes('Pharm')"));
  assert.ok(a.run("ui.ad='patients';adminPatients()").includes('data-fam-enabled="Pharm"'));
  a.run("runChange(()=>famCfgSet('Pharm',{off:false}))");a.run("db.role='Pharm'");assert.equal(a.run("canFamily('Pharm')"),true);
});
test('G6-M2 代碼不重複使用：刪除設定後保留參與設定；新區塊與新欄位跳過已有內容或歷史的代碼',()=>{
  const C=core(),old=fixture();old.famConfig={blocks:{}};old.patients[0].famEnabled=['PT','X1'];old.patients[0].fam={X1:{who:'長女',_by:'N',_at:'2026-10-01'}};
  assert.deepEqual(plain(C.migrate(old,fixture(),['PT'])).patients[0].famEnabled,['PT','X1'],'刪除設定後保留自訂區塊的參與設定');
  const a=app();a.run("db.role='Admin';P().fam.X1={who:'長女',content:'舊家屬內容',_by:'N',_at:'2026-10-01'};P().famHist.push({tab:'X2',by:'N',at:'2026-10-01',data:{who:'x'}})");
  const key=a.run("runChange(()=>famCfgAddBlock('其他參與者'));Object.keys(db.famConfig.blocks).find(k=>db.famConfig.blocks[k].custom)");
  assert.equal(key,'X3','跳過已有內容或歷史的代碼');
  a.run("P().fam.PT={...(P().fam.PT||{}),f1:'舊欄位內容'}");a.run("runChange(()=>famCfgAddField('PT','步態'))");
  assert.ok(!a.run("famAll().PT.fields.some(f=>f[0]==='f1')"),'不沿用已有內容的欄位代碼');
});
test('G6-M2 欄位停用後再儲存該區塊，停用欄位的原值保留',()=>{
  const a=app();a.run("db.role='Admin';P().fam.PT={rom:'右下肢 2/5',balance:'站立需扶持',_by:'PT',_at:'2026-10-01'}");
  a.run("runChange(()=>famCfgField('PT','rom',{off:true}))");
  a.run("db.role='PT';ui.ft='PT';ui.famKey='';VIEWS.familiar();ui.famDraft.balance='可獨立站立 1 分鐘'");
  a.run("runChange(()=>ACT['fam-save']())");
  assert.equal(a.run('P().fam.PT.rom'),'右下肢 2/5');assert.equal(a.run('P().fam.PT.balance'),'可獨立站立 1 分鐘');
});
test('G6-M3 檢討期邊界：第 N～N+7 天（含）為檢討期，之後才逾期；拒絕不存在的日期',()=>{
  const C=core(),D=864e5,t0=new Date('2026-08-12T08:00:00').getTime(),set=c=>C.reminderSettings('PAC',{},c),plans=[{ver:1,at:new Date(t0).toISOString(),type:'初版'}];
  assert.equal(C.reminderInfo(plans,set({review:10}),t0+17*D+12*3600e3).review.state,'due','第 17 天仍在檢討期');
  assert.equal(C.reminderInfo(plans,set({review:10}),t0+18*D).review.state,'overdue');
  assert.equal(C.reminderInfo(plans,set({}),new Date('2026-09-02T23:00:00').getTime()).review.state,'due','預設第 21 天（9/2）深夜仍在檢討期');
  assert.equal(C.reminderInfo(plans,set({}),new Date('2026-09-03T00:30:00').getTime()).review.state,'overdue','第 22 天（9/3）起逾期（日曆日，D-16）');
  assert.throws(()=>C.validateReminder({reviseDate:'2026-02-30'},'x'),/提醒/);
});
test('G6-M3 指定日期用掉後，摘要、儲存視窗與 AI 句子改依天數；只設檢討日期時文字與紀錄含日期',()=>{
  const a=app();a.run("db.role='PT';db.cur='P-0001'");
  a.run("runChange(()=>setReminder({reviseDate:'2026-10-20',reviewDate:'2026-10-18'}))");
  assert.ok(a.run("reminderText(reminderOf(P()))").includes('2026-10-18'),'摘要含檢討日期');
  assert.ok(a.run('db.logs[0].detail').includes('2026-10-18')&&a.run('db.logs[0].detail').includes('2026-10-20'),'紀錄含兩個日期');
  a.run("P().plans.push({ver:P().plans.length+1,at:new Date('2026-10-21T09:00:00').toISOString(),by:'PT',type:'週期修訂',reason:'x',snap:clone(P().plans.at(-1).snap)})");
  a.run("db.dayShift=Math.ceil((new Date('2026-10-22T09:00:00')-Date.now())/864e5)");
  assert.ok(!a.run("reminderText(reminderOf(P()))").includes('2026-10-20'),'摘要不再顯示用掉的修訂日期');
  assert.ok(!a.run("(commitModal(),document.querySelector('#modal').innerHTML)").includes('2026-10-20'),'儲存視窗不再顯示用掉的修訂日期');
  assert.ok(!a.run("aiPrognosis(P()).map(x=>x.text).join('')").includes('2026-10-20'),'AI 句子不再顯示用掉的修訂日期');
});
test('G6-M3 提醒設定輸入錯誤：提示錯誤、不寫入',()=>{
  const a=app();a.run("db.role='PT';db.cur='P-0001'");const before=a.run('JSON.stringify(P().reminder)');
  a.node('[data-remind-mode="review"]').value='date';a.node('[data-remind-date="review"]').value='2026-10-20';
  a.node('[data-remind-mode="revise"]').value='days';a.node('[data-remind-days="revise"]').value='0';
  assert.equal(a.run("runChange(()=>ACT['remind-save']())"),false);
  assert.equal(a.run('JSON.stringify(P().reminder)'),before,'不寫入');
  assert.match(a.node('#toast').textContent,/1～365/);
  // 表單是否保留已輸入內容，需在真實瀏覽器驗證（DOM 替身不會因重畫清空輸入框），見 browser-loop.js G6-M3。
});
test('G6-M4 願望圖示跳脫；停用任務不計入「另有 N 項」；不需計畫的病人不出現「本次計畫」字樣',()=>{
  const a=app(),off=a.run('db.patients.find(p=>!planOn(p)&&p.sel.length).id');a.run(`db.cur='${off}'`);
  a.run(`P().custom.push({id:'custom-x',n:'自訂願望',s:'說明',i:'<svg onload=1>',rel:[1,2,3,4,5]});P().wishCandidates.push('custom-x');P().wishes.push('custom-x')`);
  for(const v of ['passport','wishes','quad'])assert.ok(!a.run(`VIEWS.${v}()`).includes('<svg onload'),v+' 圖示已跳脫');
  assert.ok(!a.run("(wishDetail('custom-x'),document.querySelector('#modal').innerHTML)").includes('<svg onload'),'願望詳情圖示已跳脫');
  const others=()=>a.run("passportLinks(P()).rows.find(r=>r.wish.id==='custom-x').others");
  const before=others();assert.ok(before>0,'自訂願望有未選取的相關任務');
  const offTask=a.run("[1,2,3,4,5].find(id=>!P().sel.includes(id))");a.run(`db.taskOff[${offTask}]=true`);
  assert.equal(others(),before-1,'停用任務不計入');
  const html=a.run('VIEWS.passport()');assert.ok(!html.includes('本次計畫'),'不需計畫的病人不出現本次計畫字樣');assert.ok(html.includes('尚未選取'));
  a.run("db.cur='P-0001';db.role='PT';ensureDraft(P()).expect.push({wid:'custom-y',text:'x'});P().custom.push({id:'custom-y',n:'計畫願望',i:'<svg onload=2>',rel:[]})");
  assert.ok(!a.run('VIEWS.plan()').includes('<svg onload'),'計畫頁圖示已跳脫');
});
/* 不變量測試（方案 3.5）：以固定種子的隨機操作序列反覆驗證使用者明說的規則；種子固定，失敗可重現。 */
const rng=seed=>()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
test('不變量：象限收合時，待放置與象限的卡片合計恆等於原批次數（200 步隨機操作 × 3 個種子）',()=>{
  for(const seed of [7,42,2026]){
    const a=app(),r=rng(seed);a.run("db.role='PT';db.cur='P-0001'");a.run('VIEWS.quad()');
    for(let step=0;step<200;step++){
      const op=Math.floor(r()*4);
      if(op===0){const ids=plain(a.run('relatedItems(P()).filter(i=>!P().functionPlace[i.id]&&ui.quadVisibleIds.includes(i.id)).map(i=>i.id)'));if(ids.length)a.run(`runChange(()=>setPlace(${ids[Math.floor(r()*ids.length)]},${r()<.5?25:75},${r()<.5?25:75}))`)}
      else if(op===1){const ids=plain(a.run('Object.keys(P().functionPlace).map(Number)'));if(ids.length)a.run(`runChange(()=>returnToTray(${ids[Math.floor(r()*ids.length)]}))`)}
      else if(op===2)a.run("ACT['quad-more']()");
      a.run('VIEWS.quad()');
      if(!a.run('ui.quadMore')){
        const shown=[...a.run('VIEWS.quad()').matchAll(/data-tid="(\d+)"/g)].length,batch=a.run('ui.quadBatchIds.length');
        assert.equal(shown,batch,`種子 ${seed} 第 ${step} 步：收合時顯示 ${shown} 張，原批次 ${batch} 張`);
        assert.ok(batch<=5);
      }
    }
  }
});
test('不變量：任意交錯儲存新版本、改提醒、改熟識人設定，既有計畫版本與熟識人內容永不改變（120 步 × 3 個種子）',()=>{
  for(const seed of [3,99,1014]){
    const a=app(),r=rng(seed);a.run("db.cur='P-0001'");
    const famBefore=a.run('JSON.stringify(db.patients.map(p=>p.fam))');
    for(let step=0;step<120;step++){
      const plansBefore=plain(a.run('P().plans.map(v=>JSON.stringify(v))')),op=Math.floor(r()*5);
      if(op===0){a.run("db.role='PT';commitModal()");a.node('#cmType').value=['定期檢討','週期修訂','其他修訂'][Math.floor(r()*3)];a.node('#cmReason').value='隨機測試 '+step;a.run('runChange(()=>planCommit())')}
      else if(op===1){const n=1+Math.floor(r()*365);a.run(`db.role='PT';runChange(()=>setReminder(${r()<.5?`{revise:${n}}`:`{reviseDate:'2026-1${Math.floor(r()*3)}-1${Math.floor(r()*9)}'}`}))`)}
      else if(op===2){const k=['PT','OT','Pharm','Dr'][Math.floor(r()*4)];a.run(`db.role='Admin';runChange(()=>famCfgSet('${k}',{off:${r()<.5}}))`)}
      else if(op===3){a.run(`db.role='Admin';runChange(()=>famCfgField('PT','${['rom','balance','transfer'][Math.floor(r()*3)]}',{${r()<.5?`label:'改名${step}'`:`off:${r()<.5}`}}))`)}
      else a.run(`db.role='Admin';runChange(()=>setModeReminder('PAC',{revise:${r()<.3?'null':1+Math.floor(r()*200)}}))`);
      const after=plain(a.run('P().plans.map(v=>JSON.stringify(v))'));
      assert.deepEqual(after.slice(0,plansBefore.length),plansBefore,`種子 ${seed} 第 ${step} 步：既有版本被改動`);
      assert.equal(a.run('JSON.stringify(db.patients.map(p=>p.fam))'),famBefore,`種子 ${seed} 第 ${step} 步：熟識人內容被改動`);
    }
    assert.ok(a.run('P().plans.length')>2,'序列中確實新增了版本');
  }
});
test('R-14 提醒總覽：列出所有需計畫的病人；到期日與計畫頁一致；未建計畫者優先，其餘依到期先後排序',()=>{
  const a=app();a.run("db.role='Admin'");
  a.run("db.patients.push({...clone(db.patients[0]),id:'P-0099',name:'未建計畫',plans:[],draft:null})");
  const rows=plain(a.run('remindRows()')),need=plain(a.run('db.patients.filter(planOn).map(p=>p.id)'));
  assert.deepEqual(rows.map(r=>r.id).slice().sort(),need.slice().sort(),'列出所有需計畫的病人');
  assert.equal(rows[0].id,'P-0099');assert.equal(rows[0].noPlan,true);
  for(const r of rows.filter(r=>!r.noPlan)){
    const ri=plain(a.run(`(()=>{const ri=reviewInfo(db.patients.find(p=>p.id==='${r.id}'));return [ri.review.due,ri.revise.due]})()`));
    assert.deepEqual([r.reviewDue,r.reviseDue],ri,`${r.id} 到期日與計畫頁一致`);
  }
  const keys=rows.filter(r=>!r.noPlan).map(r=>r.next);for(let i=1;i<keys.length;i++)assert.ok(keys[i-1]<=keys[i],'依到期先後排序');
  const html=a.run("ui.ad='remind';VIEWS.admin()");
  assert.ok(html.includes('待修訂個案'));for(const id of need)assert.ok(html.includes(`data-id="${id}"`),id);
  assert.ok(html.includes(a.run("fmtD(remindRows().find(r=>!r.noPlan).reviseDue)")),'畫面顯示修訂日期');
});
test('R-14 提醒總覽：篩選、儲存新版本後立即更新、開啟計畫切到該病人、非管理員看不到',()=>{
  const a=app();a.run("db.role='Admin';db.dayShift=200");
  const all=a.run('remindRows().length');a.run("ui.rf='due'");
  assert.ok(a.run('remindRows().filter(remindMatch).length')<=all);
  assert.ok(plain(a.run('remindRows().filter(remindMatch)')).every(r=>r.noPlan||['overdue','due'].includes(r.level)),'只列已到期');
  const id=a.run("remindRows().find(r=>!r.noPlan).id"),before=plain(a.run(`remindRows().find(r=>r.id==='${id}')`));
  a.run(`db.cur='${id}';commitModal()`);a.node('#cmType').value='週期修訂';a.node('#cmReason').value='總覽測試';a.run('runChange(()=>planCommit())');
  const after=plain(a.run(`remindRows().find(r=>r.id==='${id}')`));
  assert.equal(after.ver,before.ver+1);assert.notEqual(after.reviseDue,before.reviseDue,'儲存新版本後修訂日期重新計算');
  a.run("db.cur='P-0001';ui.view='admin'");a.run(`runChange(()=>ACT['remind-open']({dataset:{id:'${id}'}}))`);
  assert.equal(a.run('db.cur'),id);assert.equal(a.run('ui.view'),'plan');
  a.run("db.role='Clerk';ui.ad='remind'");assert.ok(!a.run('VIEWS.admin()').includes('待修訂個案'),'非管理員看不到');
});
test('G6-M6 提醒總覽：到期日受控的 6 位病人，逐一驗證各篩選的成員與數量標籤',()=>{
  const a=app();a.run("db.role='Admin';db.dayShift=0");
  // 每位病人只用定期檢討控制到期日（修訂設為 365 天，不影響排序）。
  a.run(`(()=>{const D=864e5,t=now().getTime(),tpl=db.patients.find(p=>p.plans.length&&planOn(p)),stage=tpl.stages.at(-1).stage;
    const mk=(id,ago,review,plans=true)=>{const p=clone(tpl);p.id=id;p.name=id;p.stages=[{stage,from:'2026-08-01',to:null,note:''}];p.reminder={review,revise:365};
      p.plans=plans?[{...clone(tpl.plans[0]),ver:1,type:'初版',at:new Date(t-ago*D).toISOString()}]:[];return p};
    db.patients=[mk('OVER',30,14),mk('DUE',16,14),mk('WEEK',11,14),mk('TWO',4,14),mk('LATER',0,20),mk('NOPLAN',0,14,false)];db.cur='OVER'})()`);
  const level=Object.fromEntries(plain(a.run('remindRows()')).map(r=>[r.id,r.level]));
  assert.deepEqual(level,{NOPLAN:'none',OVER:'overdue',DUE:'due',WEEK:'week',TWO:'two',LATER:'later'});
  const by=f=>plain(a.run(`remindRows().filter(r=>remindMatchBy(r,'${f}')).map(r=>r.id)`)).sort();
  assert.deepEqual(by('due'),['DUE','NOPLAN','OVER']);
  assert.deepEqual(by('week'),['DUE','NOPLAN','OVER','WEEK']);
  assert.deepEqual(by('two'),['DUE','NOPLAN','OVER','TWO','WEEK']);
  assert.equal(by('all').length,6);
  const html=a.run("ui.ad='remind';ui.rf='week';VIEWS.admin()");
  for(const t of ['全部（6）','已到期（3）','7 天內（4）','14 天內（5）'])assert.ok(html.includes(t),t);
  assert.ok(!html.includes('data-id="TWO"')&&html.includes('data-id="WEEK"'),'7 天內篩選只顯示符合的列');
});
test('G6-M6 到期日以日曆日計算：第 N 天當天起即為到期，不必等到建立計畫的時刻',()=>{
  const C=core(),D=864e5,t0=new Date('2026-09-30T11:00:00').getTime(),plans=[{ver:1,at:new Date(t0).toISOString(),type:'初版'}];
  const set=C.reminderSettings('PAC',{},{review:14,revise:14});
  const morning=new Date('2026-10-14T07:56:00').getTime();
  const r=C.reminderInfo(plans,set,morning);
  assert.equal(r.review.state,'due','第 14 天早上即進入檢討期');assert.equal(r.revise.state,'due','第 14 天早上即需修訂');
  assert.equal(C.reminderInfo(plans,set,new Date('2026-10-13T23:59:00').getTime()).review.state,'upcoming');
});

