async page => {
  // 20261014 修訂新增需求的瀏覽器驗收（編號對照見 20261014_修訂開發與技術驗收紀錄.md 附錄）。由 tests/run-browser.cjs 執行；不使用院內正式資料。
  // 每個需求一段，段首註明需求編號；需求通過後，該段即成為回歸測試。
  const results=[],errors=[];
  const check=(ok,name)=>{if(!ok)throw new Error(name);results.push(name)};
  const nav=async view=>page.locator(`#nav [data-v="${view}"]`).click();
  const role=async value=>page.locator('#roleSel').selectOption(value);
  const act=(name,id)=>page.locator(`[data-act="${name}"]${id?`[data-id="${id}"]`:''}`).first();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/');
  check(await page.locator('#view').innerHTML()!=='','系統正常載入');
  // R-01：外部系統名稱「信祥」改為「杏翔」。
  await nav('patient');
  check((await page.locator('#view').innerText()).includes('杏翔系統 ID'),'R-01 個案主檔顯示杏翔系統 ID');
  await role('Clerk');await nav('admin');await act('edit-patient').click();
  check((await page.locator('#modal').innerText()).includes('杏翔系統 ID'),'R-01 主檔編輯視窗顯示杏翔系統 ID');
  check(!/信祥|信翔|信想/.test(await page.locator('body').innerText()),'R-01 畫面不出現舊名稱');
  await page.locator('#modal [data-act="close"]').first().click();await role('PT');

  // R-02：「照護階段」改為「照護模式」；指稱 PAC 等四種時不再單用「階段」。
  await nav('patient');
  const patientText=await page.locator('#view').innerText();
  check(patientText.includes('目前照護模式')&&patientText.includes('照護模式歷程'),'R-02 個案主檔使用照護模式');
  check(await page.locator('[data-act="stage-modal"]').first().innerText()==='變更照護模式','R-02 變更按鈕名稱');
  await act('stage-modal').click();
  check((await page.locator('#modal').innerText()).includes('新照護模式'),'R-02 變更視窗使用照護模式');
  await page.locator('#modal [data-act="close"]').first().click();
  await nav('passport');
  check((await page.locator('.passport-hero').innerText()).includes('照護模式：'),'R-02 護照頁首使用照護模式');
  await role('Admin');await nav('admin');
  check((await page.locator('[data-act="ad-tab"][data-k="stages"]').innerText())==='照護模式設定','R-02 後台分頁名稱');
  await page.locator('[data-act="ad-tab"][data-k="stages"]').click();
  const bare=/照護階段|(?<!現)階段(?!\s*[A-D])/;
  for(const view of ['patient','tasks','plan','passport','admin','analytics']){
    await nav(view);
    const text=await page.locator('#view').innerText();
    check(!bare.test(text),`R-02 ${view} 不以「階段」指稱照護模式`);
  }
  await role('PT');
  // R-02（G6-M1 補強）：不需復健計畫的病人，走過任務、任務紀錄、計畫與護照的說明文字。
  const offId=await page.evaluate(()=>db.patients.find(p=>!planOn(p)).id);
  await page.locator('#patientSel').selectOption(offId);
  await nav('tasks');
  const offTasks=await page.locator('#view').innerText();
  check(offTasks.includes('此照護模式選完任務即可儲存')&&!bare.test(offTasks),'R-02 不需計畫病人的任務頁使用照護模式');
  await act('task-record').click();
  check(!bare.test(await page.locator('#view').innerText()),'R-02 任務紀錄使用照護模式');
  await nav('plan');
  const offPlan=await page.locator('#view').innerText();
  check(offPlan.includes('目前照護模式不需要復健計畫')&&!bare.test(offPlan),'R-02 不需計畫病人的計畫頁使用照護模式');
  await nav('passport');
  const offPass=await page.locator('#view').innerText();
  check(!bare.test(offPass),'R-02 不需計畫病人的護照頁使用照護模式');
  await page.locator('#patientSel').selectOption('P-0001');

  // R-03：「協助夥伴」改為「共學夥伴」；既有夥伴選項與選擇資料不變。
  await nav('passport');
  const taskId=await page.locator('[data-act="pp-open"]').first().getAttribute('data-id');
  const card=page.locator(`[data-act="pp-open"][data-id="${taskId}"]`).first();
  // 卡片中央的圖示另有 data-act="book-open"（點圖示開大圖閱讀），滑鼠點卡片中心會開大圖；此處要開任務視窗，故直接觸發卡片的點擊事件。
  await card.dispatchEvent('click');
  const modalText=await page.locator('#modal').innerText();
  check(modalText.includes('共學夥伴')&&!modalText.includes('協助夥伴'),'R-03 任務視窗使用共學夥伴');
  await page.locator('[data-act="pp-partner"][data-p="家屬夥伴"]').click();
  check(await page.evaluate(id=>P().tasks[id]?.partner==='家屬夥伴'&&db.logs[0].action==='護照共學夥伴',taskId),'R-03 夥伴選擇保存並寫入共學夥伴紀錄');
  await page.locator('#modal [data-act="close"]').first().click();
  check(!(await page.locator('#view').innerText()).includes('協助夥伴'),'R-03 護照頁不出現協助夥伴');
  // R-03（G6-M1 補強）：示範資料中既有的夥伴選擇，在共學夥伴按鈕上正確標示。
  const [seedId,seedPartner]=await page.evaluate(()=>{const e=Object.entries(P().tasks).find(([,t])=>t.partner);return e?[e[0],e[1].partner]:[]});
  check(!!seedId,'R-03 示範資料有既有的夥伴選擇');
  await page.evaluate(id=>passportModal(+id),seedId);
  const shown=await page.locator('#modal [data-act="pp-partner"]').evaluateAll(bs=>bs.filter(b=>b.classList.contains('on')).map(b=>b.textContent.trim()));
  check(shown.length===1&&shown[0]===seedPartner,`R-03 既有夥伴選擇正確顯示（期望 ${seedPartner}，實際 ${shown.join('、')||'無'}）`);
  await page.locator('#modal [data-act="close"]').first().click();

  // R-04／R-06：熟識人補上藥師；總覽、報表、參與職類與權限。
  await role('Pharm');await nav('familiar');
  check(await page.locator('[data-act="fam-tab"][data-k="Pharm"]').count()===1,'R-04 熟識人有藥師分頁');
  await page.locator('[data-act="fam-tab"][data-k="Pharm"]').click();
  await page.locator('#fam-meds').fill('Aspirin 100mg QD；Amlodipine 5mg QD');await act('fam-save').click();
  await page.locator('[data-act="fam-tab"][data-k="overview"]').click();
  const overview=await page.locator('#view').innerText();
  check(overview.includes('藥師')&&overview.includes('Aspirin 100mg QD'),'R-06 跨專業總覽包含藥師內容');
  await page.locator('[data-act="fam-tab"][data-k="PT"]').click();
  check(await act('fam-save').isDisabled(),'R-06 藥師不能編輯其他職類');
  await page.locator('[data-act="nav"][data-v="report"]').click();
  check((await page.locator('.case-report').innerText()).includes('Aspirin 100mg QD'),'R-06 整合報表包含藥師內容');
  await role('Admin');await nav('admin');await page.locator('[data-act="ad-tab"][data-k="patients"]').click();
  check(await page.locator('[data-fam-enabled="Pharm"]').count()===1,'R-06 參與職類可設定藥師');
  await role('PT');

  // R-05：熟識人區塊與欄位可由後台調整；停用只隱藏不刪除；自訂區塊必填欄位。
  await role('Admin');await nav('admin');await page.locator('[data-act="ad-tab"][data-k="famcfg"]').click();
  await page.locator('#famcfgNew').fill('其他參與者');await act('famcfg-block-add').click();
  const xKey=await page.evaluate(()=>Object.keys(db.famConfig.blocks).find(k=>db.famConfig.blocks[k].custom));
  check(!!xKey&&await page.locator(`[data-famcfg="label"][data-k="${xKey}"]`).count()===1,'R-05 後台新增自訂區塊');
  await role('Nurse');await nav('familiar');
  check(await page.locator(`[data-act="fam-tab"][data-k="${xKey}"]`).count()===1,'R-05 熟識人出現自訂區塊分頁');
  await page.locator(`[data-act="fam-tab"][data-k="${xKey}"]`).click();
  await page.locator('#fam-content').fill('每週三陪同復健，負責居家練習');await act('fam-save').click();
  check(await page.evaluate(k=>!P().fam[k],xKey)&&(await page.locator('#fam-content').inputValue()).includes('每週三陪同復健'),'R-05 必填欄位未填不儲存，且保留已輸入內容');
  await page.locator('#fam-who').fill('長女（主要照顧者）');await act('fam-save').click();
  await page.locator('[data-act="fam-tab"][data-k="overview"]').click();
  check((await page.locator('#view').innerText()).includes('長女（主要照顧者）'),'R-05 跨專業總覽包含自訂區塊內容');
  await page.locator('[data-act="nav"][data-v="report"]').click();
  check((await page.locator('.case-report').innerText()).includes('每週三陪同復健'),'R-05 整合報表包含自訂區塊內容');
  await role('Admin');await nav('admin');await page.locator('[data-act="ad-tab"][data-k="famcfg"]').click();
  const ptBefore=await page.evaluate(()=>JSON.stringify(P().fam.PT||{}));
  await page.locator('[data-famcfg="off"][data-k="PT"]').uncheck();
  await nav('familiar');
  check(await page.locator('[data-act="fam-tab"][data-k="PT"]').count()===0&&await page.evaluate(b=>JSON.stringify(P().fam.PT||{})===b,ptBefore),'R-05 停用區塊後分頁隱藏，內容保留');
  const ptRom=await page.evaluate(()=>P().fam.PT&&P().fam.PT.rom);check(!!ptRom,'R-05 示範資料的 PT 區塊已有內容');
  await page.locator('[data-act="fam-tab"][data-k="overview"]').click();
  check(!(await page.locator('#view').innerText()).includes(ptRom),'R-05 停用區塊不在總覽顯示');
  await nav('admin');await page.locator('[data-act="ad-tab"][data-k="famcfg"]').click();
  await page.locator('[data-famcfg="off"][data-k="PT"]').check();
  await nav('familiar');
  check(await page.locator('[data-act="fam-tab"][data-k="PT"]').count()===1,'R-05 重新啟用後恢復區塊');
  await page.locator('[data-act="fam-tab"][data-k="overview"]').click();
  check((await page.locator('#view').innerText()).includes(ptRom),'R-05 重新啟用後總覽顯示原內容');
  await nav('admin');await page.locator('[data-act="ad-tab"][data-k="famcfg"]').click();
  const transfer=await page.evaluate(()=>P().fam.PT&&P().fam.PT.transfer);
  check(!!transfer,'R-05 示範資料的 PT 移位能力已有內容');
  const relabel=page.locator('[data-famcfg="field-label"][data-k="PT"][data-f="transfer"]');
  await relabel.fill('床椅移位');await relabel.dispatchEvent('change');
  await nav('familiar');await page.locator('[data-act="fam-tab"][data-k="overview"]').click();
  check(await page.evaluate(v=>famAll().PT.fields.find(f=>f[0]==='transfer')[1]==='床椅移位'&&P().fam.PT.transfer===v,transfer),'R-05 欄位改名不影響已填內容');
  check((await page.locator('#view').innerText()).includes('床椅移位：'+transfer),'R-05 總覽顯示新欄位名稱與原內容');
  await role('PT');

  // R-07：計畫時程依照護模式與個案設定；可指定日期；提醒不限制儲存；不改動既有版本。
  await role('PT');await page.locator('#patientSel').selectOption('P-0001');await nav('plan');
  const plansBefore=await page.evaluate(()=>JSON.stringify(P().plans));
  const planText=await page.locator('#view').innerText();
  check(planText.includes('週期修訂')&&!/80 ?天修訂/.test(planText),'R-07 計畫頁使用週期修訂，不寫死 80 天');
  await page.locator('.remind-cfg summary').click();
  await page.locator('[data-remind-mode="revise"]').selectOption('days');
  check(await page.locator('[data-remind-days="revise"]').isVisible(),'R-07 選自訂天數時顯示天數欄位');
  await page.locator('[data-remind-days="revise"]').fill('14');await act('remind-save').click();
  check(await page.evaluate(()=>P().reminder.revise===14&&db.logs[0].action==='個案提醒設定'),'R-07 個案修訂天數儲存並寫入紀錄');
  check((await page.locator('#view').innerText()).includes('每 14 天重新修訂'),'R-07 提醒依個案天數顯示');
  await page.locator('[data-act="shift-to"][data-to="revise"]').click();
  check((await page.locator('#view').innerText()).includes('本輪已滿'),'R-07 快轉到下次修訂後顯示到期');
  await act('plan-commit-modal').click();
  check(await page.locator('#cmType').inputValue()==='週期修訂','R-07 到期時儲存視窗預選週期修訂');
  await page.locator('#modal [data-act="close"]').first().click();
  await page.locator('[data-act="shift"][data-n="0"]').click();
  if(!await page.locator('[data-remind-mode="revise"]').isVisible())await page.locator('.remind-cfg summary').click();
  await page.locator('[data-remind-mode="revise"]').selectOption('date');
  await page.locator('[data-remind-date="revise"]').fill('2026-12-01');await act('remind-save').click();
  check(await page.evaluate(()=>P().reminder.reviseDate==='2026-12-01'&&P().reminder.revise===undefined),'R-07 指定日期儲存');
  check((await page.locator('.remind-cfg summary').innerText()).includes('2026-12-01'),'R-07 提醒摘要顯示指定日期');
  check(await page.evaluate(b=>JSON.stringify(P().plans)===b,plansBefore),'R-07 修改提醒設定不改動既有版本');
  if(!await page.locator('[data-remind-mode="revise"]').isVisible())await page.locator('.remind-cfg summary').click();
  await page.locator('[data-remind-mode="revise"]').selectOption('default');await act('remind-save').click();
  await role('Admin');await nav('admin');await page.locator('[data-act="ad-tab"][data-k="stages"]').click();
  const modeInput=page.locator('[data-mode-remind="revise"][data-s="PAC"]');
  await modeInput.fill('60');await modeInput.dispatchEvent('change');
  check(await page.evaluate(()=>db.reminderCfg.PAC.revise===60),'R-07 管理員設定照護模式修訂天數');
  await role('PT');await nav('plan');
  check((await page.locator('#view').innerText()).includes('每 60 天重新修訂'),'R-07 個案未設定時使用照護模式預設');
  await role('Admin');await nav('admin');await page.locator('[data-act="ad-tab"][data-k="stages"]').click();
  await page.locator('[data-mode-remind="revise"][data-s="PAC"]').fill('');await page.locator('[data-mode-remind="revise"][data-s="PAC"]').dispatchEvent('change');
  check(await page.evaluate(()=>!db.reminderCfg.PAC),'R-07 清空照護模式設定後回到系統預設');
  await role('PT');

  // G6-M3：輸入錯誤時提示並保留已輸入內容；指定檢討日期；紀錄內容含設定值。
  await role('PT');await page.locator('#patientSel').selectOption('P-0001');await nav('plan');
  const openCfg=async()=>{if(!await page.locator('[data-remind-mode="review"]').isVisible())await page.locator('.remind-cfg summary').click()};
  await openCfg();
  await page.locator('[data-remind-mode="review"]').selectOption('date');await page.locator('[data-remind-date="review"]').fill('2026-10-20');
  await page.locator('[data-remind-mode="revise"]').selectOption('days');await page.locator('[data-remind-days="revise"]').fill('0');
  const remindBefore=await page.evaluate(()=>JSON.stringify(P().reminder));
  await act('remind-save').click();
  check((await page.locator('#toast').innerText()).includes('1～365'),'G6-M3 天數錯誤時提示');
  check(await page.locator('[data-remind-mode="review"]').inputValue()==='date'&&await page.locator('[data-remind-date="review"]').inputValue()==='2026-10-20','G6-M3 輸入錯誤時保留已輸入內容');
  check(await page.evaluate(b=>JSON.stringify(P().reminder)===b,remindBefore),'G6-M3 輸入錯誤時不寫入');
  await page.locator('[data-remind-days="revise"]').fill('30');await act('remind-save').click();
  check(await page.evaluate(()=>P().reminder.reviewDate==='2026-10-20'&&P().reminder.revise===30&&db.logs[0].detail.includes('2026-10-20')&&db.logs[0].detail.includes('每 30 天')),'G6-M3 指定檢討日期儲存，紀錄含設定值');
  check((await page.locator('.remind-cfg summary').innerText()).includes('於 2026-10-20 檢討'),'G6-M3 摘要顯示檢討日期');
  await openCfg();
  await page.locator('[data-remind-mode="review"]').selectOption('default');await page.locator('[data-remind-mode="revise"]').selectOption('default');await act('remind-save').click();
  check(await page.evaluate(()=>Object.keys(P().reminder).length===0),'G6-M3 改回預設時清除個案設定');

  // R-08：護照不區分版本；願望 → 目標 → 任務連結；解鎖後進度、獎盃與連結同時更新。
  await role('PT');await page.locator('#patientSel').selectOption('P-0001');await nav('passport');
  const passText=await page.locator('#view').innerText();
  check(!/護照\s*[12]\.0|[12]\.0｜/.test(passText)&&await page.locator('[data-act="pv"]').count()===0,'R-08 護照不出現 1.0／2.0');
  check(['獎盃櫃','我的願望與目標','150 項生活任務'].every(t=>passText.includes(t)),'R-08 單一頁面含三大區塊');
  const link=page.locator('[data-wish-link] .wl-task').first();
  const linkId=await link.getAttribute('data-id');
  await page.evaluate(id=>{P().tasks[id]={...(P().tasks[id]||{}),st:'未開始',at:''};render()},linkId);
  const before2=await page.evaluate(()=>progressOf(P()).done);
  await page.locator(`[data-wish-link] .wl-task[data-id="${linkId}"]`).first().dispatchEvent('click');
  await page.locator(`#modal [data-act="pp-set"][data-st="已解鎖"]`).click();
  await page.locator('#modal [data-act="close"]').first().click();
  check(await page.evaluate(()=>progressOf(P()).done)===before2+1,'R-08 解鎖後進度加一');
  check((await page.locator(`[data-wish-link] .wl-task[data-id="${linkId}"]`).first().innerText()).includes('已解鎖'),'R-08 願望連結的任務卡顯示已解鎖');
  check((await page.locator('.progress-meta').innerText()).includes(`${before2+1} / 150`),'R-08 護照首頁進度同步更新');
  // G6-M4：在願望連結卡選共學夥伴，關閉視窗後卡片立即顯示。
  const freeId=await page.evaluate(()=>passportLinks(P()).rows.flatMap(r=>r.tasks).find(t=>!t.partner)?.id);
  check(freeId!==undefined,'G6-M4 有尚未設定夥伴的願望任務');
  await page.locator(`[data-wish-link] .wl-task[data-id="${freeId}"]`).first().dispatchEvent('click');
  await page.locator('#modal [data-act="pp-partner"][data-p="多功能型照顧服務員"]').click();
  await page.locator('#modal [data-act="close"]').first().click();
  check((await page.locator(`[data-wish-link] .wl-task[data-id="${freeId}"]`).first().innerText()).includes('共學夥伴：多功能型照顧服務員'),'G6-M4 選夥伴後願望卡立即顯示');
  await page.locator('[data-act="pp-dom"][data-d="行"]').click();
  check((await page.locator('#view').innerText()).includes('行・'),'R-08 150 項任務的領域分頁可切換');

  // R-14：後台提醒總覽（候選 C4）。
  await role('Admin');await nav('admin');await page.locator('[data-act="ad-tab"][data-k="remind"]').click();
  const needPlan=await page.evaluate(()=>db.patients.filter(planOn).map(p=>p.id));
  check(await page.locator('[data-act="remind-open"]').count()===needPlan.length,'R-14 總覽列出所有需計畫的病人');
  const firstRow=await page.evaluate(()=>{const r=remindRows().find(r=>!r.noPlan);return {id:r.id,due:fmtD(r.reviseDue),ver:r.ver}});
  const rowText=()=>page.locator(`tr:has([data-act="remind-open"][data-id="${firstRow.id}"])`).innerText();
  check((await rowText()).includes(firstRow.due),'R-14 總覽顯示修訂日期');
  await page.locator(`[data-act="remind-open"][data-id="${firstRow.id}"]`).click();
  check(await page.evaluate(id=>db.cur===id&&ui.view==='plan',firstRow.id),'R-14 開啟計畫切到該病人');
  await act('plan-commit-modal').click();await page.locator('#cmType').selectOption('週期修訂');await page.locator('#cmReason').fill('提醒總覽驗收');await act('plan-commit').click();
  await nav('admin');await page.locator('[data-act="ad-tab"][data-k="remind"]').click();
  check((await rowText()).includes('v'+(firstRow.ver+1)),'R-14 儲存新版本後總覽立即更新');
  // 剛存新版本的病人尚未到期，「已到期」篩選必須排除他；否則篩選形同虛設也測不出來。
  check(await page.evaluate(id=>!['overdue','due'].includes(remindRows().find(r=>r.id===id).level),firstRow.id),'R-14 前提：剛修訂的病人不在已到期範圍');
  await page.locator('[data-act="remind-filter"][data-f="due"]').click();
  const dueTags=await page.locator('#view tbody tr .badge').allInnerTexts();
  check(dueTags.length>0&&dueTags.every(t=>['檢討已逾期','已到期','尚未建立計畫'].includes(t.trim())),'R-14 已到期篩選只顯示已逾期、已到期或未建計畫的個案');
  check(await page.locator(`[data-act="remind-open"][data-id="${firstRow.id}"]`).count()===0,'R-14 已到期篩選排除剛修訂的病人');
  await page.locator('[data-act="remind-filter"][data-f="all"]').click();
  await role('PT');

  check(errors.length===0,'沒有未捕捉的瀏覽器錯誤');
  return {passed:results.length,results,errors};
}
