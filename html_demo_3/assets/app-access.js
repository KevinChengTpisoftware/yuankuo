'use strict';
/* 僅為展示權限。正式使用時，必須由 API 再次驗證授權。 */
ui.patientMode=false;
let transaction=false;
const canManage=()=>!ui.patientMode&&db.role==='Admin';
const canBuild=()=>!ui.patientMode&&['Admin','Clerk'].includes(db.role);
const canPlan=()=>!ui.patientMode&&['Admin','PT','OT','ST','Dr'].includes(db.role);
const canInterview=()=>ui.patientMode||db.role!=='Clerk';
const canFamily=tab=>{
  if(ui.patientMode)return false;if(canManage())return true;
  if(tab==='common')return db.role==='Nurse';
  const f=famAll()[tab];if(!f||f.off||!P().famEnabled.includes(tab))return false;
  return f.custom?db.role==='Nurse':db.role===tab; // 自訂區塊（例如其他參與者）由護理師填寫
};
function canView(view){
  if(ui.patientMode)return ['wishes','quad'].includes(view);
  if(view==='admin')return canBuild();
  return true;
}
const INTERVIEW_ACTIONS=new Set(['wish-toggle','wish-final','wish-clear','wish-custom','quad-reset','quad-place','quad-unplace','quad-remove']);
const PLAN_ACTIONS=new Set(['task-toggle','task-suggest','task-record','plan-override','term','goal-from-tasks','goal-phrase-add','prog-add','prog-blank','prog-del','prog-ai','plan-reset','plan-commit-modal','plan-commit','pp-set','pp-partner','remind-save']);
const ADMIN_ACTIONS=new Set(['ad-toggle','ad-edit','ad-save','phrase-reset','log-clear','ex-csv','ex-json','reset-demo','export-raw','import-confirm','wish-admin-new','wish-admin-edit','wish-admin-save','goal-phrases-save','famcfg-field-add','famcfg-block-add']);
function canAction(el){
  const action=el.dataset.act;
  const writes=INTERVIEW_ACTIONS.has(action)||PLAN_ACTIONS.has(action)||ADMIN_ACTIONS.has(action)||['patient-save','patient-add','fam-save','stage-save','shift','shift-to'].includes(action);
  if(store?.blocked&&writes&&!['reset-demo','export-raw','ex-json','ex-csv'].includes(action))return false;
  if(action==='nav')return canView(el.dataset.v);
  if(INTERVIEW_ACTIONS.has(action))return canInterview();
  if(PLAN_ACTIONS.has(action))return canPlan()&&!(action==='task-toggle'&&db.taskOff[el.dataset.id]);
  if(ADMIN_ACTIONS.has(action))return canManage();
  if(['new-patient','edit-patient','patient-save','patient-add'].includes(action))return canBuild();
  if(['stage-modal','stage-save','shift','shift-to'].includes(action))return canPlan();
  if(action==='fam-save')return canFamily(ui.ft);
  if(action==='report-print')return !ui.patientMode;
  if(action==='ad-tab')return canBuild()&&(canManage()||el.dataset.k==='patients');
  return true;
}
function updateStorageStatus(){
  const el=$('#storageStatus');
  el.textContent=store.error||'';
  el.hidden=!store.error;
  el.classList.toggle('storage-error',!!store.error);
}
function applyAccess(){
  document.body.classList.toggle('patient-mode',!!ui.patientMode);
  document.body.classList.toggle('report-view',ui.view==='report');
  $('#patientModeBtn').textContent=ui.patientMode?'返回工作人員模式':'病人操作模式';
  document.querySelectorAll('#nav [data-act="nav"]').forEach(el=>el.hidden=!canView(el.dataset.v));
  if(store)updateStorageStatus();
}
function applyViewAccess(){
  document.querySelectorAll('#view [data-act],#modal [data-act]').forEach(el=>{
    const allowed=canAction(el);
    if(!allowed){el.disabled=true;el.setAttribute('aria-disabled','true');if(el.dataset.act==='nav')el.hidden=true}
  });
  if(ui.view==='plan'&&!canPlan())document.querySelectorAll('#view textarea').forEach(el=>el.disabled=true);
}
function runChange(fn,{sessionOnly=false}={}){
  if(transaction)return fn();
  const before=clone(db),blockedBefore=store.blocked;
  transaction=true;
  try{
    const result=fn();
    if(!sessionOnly&&JSON.stringify(db)!==JSON.stringify(before))store.write(db);
    updateStorageStatus();applyViewAccess();return result;
  }catch(error){
    db=before;store.blocked=blockedBefore;ui.pend=null;ui.famKey='';
    closeModal();$('#book').classList.remove('open');$('#celebrate').classList.remove('show');render();toast(error.message);updateStorageStatus();return false;
  }finally{transaction=false}
}
function invokeAction(el,e){
  if(el.disabled||el.getAttribute('aria-disabled')==='true')return;
  if(!canAction(el)){toast('此模擬身分沒有操作權限');return}
  const handler=ACT[el.dataset.act];if(handler)runChange(()=>handler(el,e),{sessionOnly:store.blocked&&['nav','close','ad-tab','remind-filter','remind-open','fam-tab','wish-dom','wish-detail','star-help','patient-mode','book-open','ver-view','report-print','export-raw','ex-json','ex-csv'].includes(el.dataset.act)});
}
ACT['patient-mode']=()=>{closeModal();$('#book').classList.remove('open');ui.patientMode=!ui.patientMode;ui.pend=null;ui.famKey='';go(ui.patientMode?'wishes':'patient')};

let printDetails=[];
window.addEventListener('beforeprint',()=>{
  if(ui.view!=='report')return;
  printDetails=[...document.querySelectorAll('.case-report details:not([open])')];
  printDetails.forEach(el=>el.open=true);
});
window.addEventListener('afterprint',()=>{printDetails.forEach(el=>el.open=false);printDetails=[]});
load();
db.patients.forEach(syncFunctions);
render();
