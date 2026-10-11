---
name: tpi-deck
description: 把一份「大綱 Markdown」（每頁一段：標題＋副標＋提綱要點，或指定圖片／影片）轉成單一 HTML 檔的滿版簡報（1920×1080／16:9；PgDn/PgUp/方向鍵/滾輪換頁；底部 YouTube 影片式分段進度條顯示章節與進度；可匯出每頁一張的 16:9 PDF），供後續二次加工為 pptx。主體色系依指定主色套用，可放 Logo（內建昕力 Logo）。政府標案「評選簡報」是內建的一種模式（分段進度條依配分加權、封面雙 Logo）。當使用者要求「大綱轉 HTML 簡報 / 網頁簡報 / PPT」「slide deck」「tpi-deck」「投標簡報 / 評選簡報 HTML」「Markdown 轉 PPTX 樣式」「把 xxx.md 生成簡報」時使用此 skill。
---

# 大綱 Markdown → HTML 滿版簡報

把「每頁一段、標題＋副標＋提綱要點」的 Markdown 大綱，轉成單一 HTML 檔的簡報：

- 版面固定 **1920×1080（16:9）**，依視窗等比縮放；PgUp/PgDn、方向鍵、空白鍵、滑鼠滾輪、觸控上下滑換頁
- 底部 **分段進度條**（YouTube 章節條風格）：每個「章節（section）」一段，顯示 `✓ / 目前 n/總` 進度、點段跳章；段寬可等分或依權重
- 每頁頁尾標明「目前章節＋頁碼＋案名／單位」；可選在右下角顯示下一頁提示
- 頁型：`cover`、`table`、`points`、`shot`（單圖滿版）、`shots`（2×2 圖）、`video`（YouTube）
- 可用瀏覽器列印或 Playwright 匯出 **PDF**（16:9、每頁一張、進度條保留）

## 資源

| 檔案 | 用途 |
| :---- | :---- |
| `assets/template.html` | 完整可直接套用的骨架（CSS 主題變數 + 全部頁型 + 換頁/進度條/列印引擎）。**Read 它當起點。** |
| `assets/tpi_logo.png` | 昕力資訊 Logo（若簡報要放昕力標誌就用它；不需要就不放） |
| `assets/make_pdf.sh` | 一鍵把成品 HTML 匯成 16:9 PDF（起 http server → emulateMedia('print') → `page.pdf`），處理中文／空白檔名的 URL-encode |
| `references/recipes.md` | 主色推導表、通用 & 標案兩份填好的範例、playwright 驗證/匯 PDF 指令、Chrome 手動匯出、常見坑 |

## 產出步驟

1. **讀大綱**：Read 來源 `.md`，逐頁拆出：頁型、所屬章節、kicker、標題、副標、提綱要點／圖檔／影片。

2. **定章節（`CHAPTERS`）**：找出大綱的主要區塊（例：背景與問題 / 解決方案 / 成效與結論），每個一個物件 `{ key, label }`。
   - 一般簡報：不給 `weight` → 進度條等分。
   - **標案評選簡報**：`weight` = 各評選項目配分，並把 `DECK.showWeights = true`（進度條與頁尾會顯示配分）。

3. **決定主色**：以簡報要呈現的品牌／機關主色為主體色，設定 `template.html` 頂端 `:root`：
   - `--brand`（主色：標題、項目符號、tag、表格數字）
   - `--brand-dark`（深一階：大標、封面漸層）
   - `--brand-light`（極淡：表頭底色）
   - `--accent`（副標左側色條＋進度條填充色；沒有輔色就用和諧的綠）
   取色方式：品牌官網／Logo／識別手冊，或問使用者。推導表見 `references/recipes.md`。

4. **設 `DECK`**：
   - `footerName`（頁尾案名／簡報名）、`footerOrg`（頁尾單位）、`overviewLabel`（封面/目錄頁的頁尾字，如「目錄」）
   - `cornerLogo`：頁 2+ 右上角小 Logo 檔名（`""` = 不放）
   - `coverLogos`：封面 Logo 陣列 —— `[]` 不放；`["a.png"]` 單一（左上、轉白）；`["client.png","vendor.png"]` **標案雙 Logo**（甲方大在左、乙方小白在右）
   - `showWeights`：標案設 `true`

5. **填 `SLIDES`**：每個 Markdown 頁一個物件（欄位見 template 註解與下方對照表）。`table` 頁的頁次欄等全部完成後回填。

6. **放素材**：`tpi_logo.png`（如需要）、其他 Logo、所有圖檔、影片縮圖，全部放 HTML 同目錄，**用相對路徑**。

7. **驗證**：在輸出目錄起 `python -m http.server`，用 `playwright-cli` 逐頁 goto + screenshot 檢查：滿版無溢出、圖不被裁、進度條分段與 current 標記正確、封面 Logo 階層。

8. **匯 PDF**（選用）：跑 `bash .claude/skills/tpi-deck/assets/make_pdf.sh <輸出目錄> "<html 檔名>"`。
   手動時務必：先起 `python -m http.server`、`page.emulateMedia({media:'print'})` 後再 `page.pdf({ width:'1920px', height:'1080px', printBackground:true, preferCSSPageSize:true, margin:{0} })`；中文／空白檔名要 URL-encode。
   不用 playwright → Chrome `Ctrl+P` 另存 PDF、橫向、邊界無、**勾背景圖形**（詳見 recipes.md）。

9. **回寫大綱**：若頁數／內容有調整，更新來源 `.md` 使兩者一致。

## Markdown 頁 → SLIDES 物件對照

| 大綱樣態 | `type` | 主要欄位 |
| :---- | :---- | :---- |
| 封面（標題、副標、meta、日期） | `cover` | `title`（可含 `<span class="dt">第二行</span>`）、`sub`、`cover:[行…]`、`dateline?` |
| 對照表 / 一覽表 | `table` | `table:{head,rows}`（第 2 欄自動置中強調；欄數不限） |
| 標題＋副標＋3–4 提綱 | `points` | `points:["<b>前導詞</b>：說明", …]`、可加 `note`（頁面小字）與 `nextHint`（右下角下一頁提示） |
| 一張架構圖／流程圖（圖內已含標題） | `shot` + `bare:true` | `img`，只留左上角 kicker 當進度標記、圖放到最大 |
| 一張需投影片標題的圖／截圖 | `shot` | `img`、`title`、`sub` |
| 多張圖總覽 | `shots` | `shots:[["file","caption"], …]`（2×2） |
| 操作／demo 影片 | `video` | `videoId`（YouTube ID）、`poster`（本地縮圖檔） |

`item` 欄：封面/目錄等用 `"all"`；其餘填該頁所屬章節的 `key`。

## 規範

- 核心章節頁：標題、副標題（**結論先行**）、3–4 個提綱要點；歸類分組、邏輯遞進
- 每頁靠頁尾／進度條標明所屬章節
- 「只需一頁」的章節就給一頁 `points`
- 圖檔比例盡量接近 16:9；自帶標題的圖用 `bare:true`
- 影片頁：現場頁內播放需用本機伺服器（http）開啟；直接開檔（file://）點擊會改用瀏覽器開 YouTube；列印時顯示縮圖＋網址

## 明確排除

- ❌ 不顯示使用者名稱 / 登入資訊 / AI 產生標註
- ❌ 主體色不要沿用範本預設藍——換成簡報主題的品牌／機關主色
- ❌ 標案封面雙 Logo：甲方（採購機關）要明顯大於投標廠商，廠商 Logo 置右上角
