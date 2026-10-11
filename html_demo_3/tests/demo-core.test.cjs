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
  assert.equal(JSON.stringify(old),before);assert.equal(db.schemaVersion,4);assert.equal(db.patients[0].wishes.length,6);
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
  assert.equal(JSON.parse(a.storage.get('yk-demo3-v2')).schemaVersion,4);
});
test('病人資料與計畫版本：移轉不改寫歷史；新版本保存願望名稱、任務及功能位置',()=>{
  const a=app();const old=a.run('JSON.stringify(P().plans)');a.run('ensureDraft(P())');assert.equal(a.run('JSON.stringify(P().plans)'),old);
  a.node('#cmType').value='定期檢討';a.node('#cmReason').value='測試修訂';
  a.run('runChange(()=>planCommit())');assert.equal(a.run('P().plans.length'),3);assert.ok(a.run('P().plans[2].snap.taskIds.length')>0);
  assert.ok(a.run('P().plans[2].snap.expect.every(e=>e.name)'));assert.equal(a.run('JSON.stringify(P().plans.slice(0,2))'),old);
});
