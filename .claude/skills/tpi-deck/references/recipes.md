# deck — 食譜與範例

## A. 從一個主色推導 4 個主題變數

主色設為 `BRAND`（例 `#006582`）：

| 變數 | 怎麼取 | 範例 |
| :---- | :---- | :---- |
| `--brand` | 主色原值 | `#006582` |
| `--brand-dark` | 主色明度 −12~18% | `#004f66` |
| `--brand-light` | 92% 白 + 8% 主色 | `#e6f1f4` |
| `--accent` | 品牌輔色；沒有就用和諧的綠 | `#3aa757` |
| `--vendor-accent` | 昕力紫，固定 | `#6a3fa6` |

封面漸層 `linear-gradient(118deg,#2b2350,var(--brand-dark),var(--brand))`；`#2b2350` 是偏紫的深角，若主色偏暖／偏綠會打架，改成 `var(--brand-dark)` 再深一階。

## B. 通用簡報範例（等分進度條、單一 Logo）

```js
const DECK = {
  footerName: "2026 產品發表",
  footerOrg:  "OO 公司",
  overviewLabel: "目錄",
  cornerLogo: "",                     // 不放頁角 Logo
  coverLogos: ["logo.png"],           // 封面單一 Logo（左上、轉白）
  showWeights: false,
};

const CHAPTERS = [
  { key:'s1', label:'市場與痛點' },
  { key:'s2', label:'產品方案' },
  { key:'s3', label:'導入成效' },
  { key:'s4', label:'下一步' },
];

const SLIDES = [
  { type:"cover", item:"all",
    title:"新一代平台<span class=\"dt\">產品發表</span>",
    sub:"用一句話講清楚這份簡報的主張",
    cover:[ "講者：OOO", "場合：OO 年會", "版本：v2.0" ],
    dateline:"2026 年 3 月 1 日" },

  { type:"points", item:"s1", kicker:"市場與痛點", title:"三個沒被解決的問題",
    sub:"結論先行：現有工具在 A、B、C 都失焦",
    points:[
      "<b>問題 A</b>：……",
      "<b>問題 B</b>：……",
      "<b>問題 C</b>：……",
    ]},

  { type:"shot", item:"s2", bare:true, kicker:"產品方案", title:"架構", sub:"—", img:"architecture.png" },

  { type:"video", item:"s3", kicker:"導入成效 · 影片", title:"客戶實際操作",
    sub:"90 秒完成原本 30 分鐘的流程",
    videoId:"XXXXXXXXXXX", poster:"demo_poster.jpg" },
];
```

## C. 政府標案「評選簡報」範例（加權進度條、封面雙 Logo）

```js
const DECK = {
  footerName: "115年在宅醫療照護資訊平台建置案",
  footerOrg:  "昕力資訊股份有限公司",
  overviewLabel: "六大評選項目對照",
  cornerLogo: "tpi_logo.png",
  coverLogos: ["nhi_logo.png", "tpi_logo.png"],   // 甲方大、乙方小白
  showWeights: true,                               // 進度條 + 頁尾顯示配分
};

const CHAPTERS = [
  { key:'i1', label:'廠商實績與能力',     weight:20 },
  { key:'i2', label:'專案需求解決方案',   weight:34 },
  { key:'i3', label:'專案管理與建議',     weight:12 },
  { key:'i4', label:'廠商資安能力及實績', weight:10 },
  { key:'i5', label:'價格分析',           weight:20 },
  { key:'i6', label:'廠商企業社會責任',   weight:4  },
];

const SLIDES = [
  { type:"cover", item:"all",
    title:"「115年在宅醫療照護資訊平台建置案」<span class=\"dt\">評選簡報</span>",
    sub:"以成熟醫療產品直接承接，最短時程交付穩定、可擴充、合規的中央平台",
    cover:[
      "投標廠商：<b>昕力資訊股份有限公司</b>（成立 2005，2024/10 興櫃 7781，員工約 600 人）",
      "方案主軸：<b>產品化交付，非從零開發</b>",
      "簡報主持人：陳瑞泰（FHIR／API 技術顧問、專案主持人、ISO 27001 Lead Auditor）",
      "報價：新臺幣 <b>25,473,000 元（含稅）</b>，低於預算 2,705 萬元",
    ],
    dateline:"簡報日期：中華民國 115 年 9 月 1 日" },

  { type:"table", item:"all", kicker:"評選架構", title:"評選架構總覽與建議書對照",
    sub:"六大評選項目滿分 100 分，合格分數為平均總評分 70 分（採序位法）",
    table:{ head:["評選項目","配分","建議書章節","本簡報頁次"], rows:[
      ["一、廠商實績與能力","20","第二章","P3–P5"],
      ["二、專案需求解決方案","34","第三章","P6–P18"],
      ["三、專案管理與建議","12","第四章","P19"],
      ["四、廠商資安能力及實績","10","第五章","P20"],
      ["五、價格分析","20","第六章","P21–P22"],
      ["六、廠商企業社會責任（CSR）","4","第七章","P23"],
    ]}},

  { type:"points", item:"i1", kicker:"評選項目一", title:"廠商實績與能力",
    sub:"國內自研 APIM 中台領導品牌 × FHIR 標準實作能量 × 大型系統整合經驗",
    points:[ "<b>要點一</b>：……", "<b>要點二</b>：……", "<b>要點三</b>：……", "<b>要點四</b>：……" ]},

   { type:"shot", item:"i2", bare:true, kicker:"評選項目二 · ②", title:"系統總體架構原則", sub:"—",
     img:"overall_architecture.png", nextHint:"下一頁：五大核心功能需求　→" },

  { type:"points", item:"i2", kicker:"評選項目二 · ④", title:"五大核心功能需求 × 產品化承接",
    sub:"依徵求文件五大核心功能需求逐項對應",
    points:[ "<b>跨系統資訊交換機制</b>：承接…｜補強…", "…", "…", "…" ],
    note:"註：徵求文件「三、專案範圍」僅條列 5 項核心需求；本頁項目名稱為本簡報歸納稱呼，非指單一系統之軟體模組。" },
];
```

## D. 驗證 & 匯出（playwright-cli）

```bash
# 1. 起本機伺服器（在輸出目錄）
cd <輸出目錄> && (python -m http.server 8123 &) ; sleep 2

# 2. 逐頁截圖檢查
cd .. && npx --no-install playwright-cli open "http://localhost:8123/index.html" >/dev/null
npx --no-install playwright-cli resize 1920 1080 >/dev/null
npx --no-install playwright-cli eval "document.querySelectorAll('.slide').length"
# 換頁檢查：npx playwright-cli press PageDown → screenshot --filename=_p.png → Read

# 3. 匯出 PDF —— 直接用內建腳本（最省事）
bash .claude/skills/tpi-deck/assets/make_pdf.sh <輸出目錄> "<html 檔名>"
#   → 產出 <輸出目錄>/<同名>.pdf；第 3 參數可自訂 pdf 檔名、第 4 參數自訂 port

# 3'. 或手動：起 http server 後，emulateMedia('print') 再 page.pdf()
npx --no-install playwright-cli open "http://localhost:8123/<URL-encode 後的檔名>"
npx --no-install playwright-cli resize 1920 1080
npx --no-install playwright-cli run-code "async page => { await page.emulateMedia({media:'print'}); await page.pdf({ path:'<輸出目錄>/deck.pdf', width:'1920px', height:'1080px', printBackground:true, preferCSSPageSize:true, margin:{top:'0',bottom:'0',left:'0',right:'0'} }); }"
# 驗證頁數：python3 -c "import re;print(len(re.findall(rb'/Type\s*/Page[^s]',open('<pdf>','rb').read())))"
```

### 在 Chrome 手動匯出（不用 playwright 時）

1. Chrome 開啟該 HTML → `Ctrl/Cmd + P`
2. 目的地：**另存為 PDF**；版面：**橫向**；邊界：**無**；**勾選「背景圖形」**（否則沒有底色／進度條）
3. 頁首及頁尾：取消；每張紙頁數：1 → 儲存
4. 被切半 → 縮放改「符合可列印範圍」或自訂 100%

## E. 常見坑

- **圖片兩側留白太多**：圖比例比 16:9 窄。自帶標題的圖加 `bare:true`；或請對方重出更寬的圖；系統截圖建議以 ~1600×740 視窗重新截取。
- **列印時進度條字超小**：template 已內建 `@media print` 專屬放大（`.s-chapters` 23px）；若自行改過 `.chap` 尺寸，記得同步調整 print 區塊。
- **YouTube 顯示「影片播放器設定錯誤」**：用 `file://` 直接開檔所致。template 預設只放縮圖＋播放鍵，http 開啟才頁內嵌入、file:// 則開新分頁——不要改回一律 iframe。
- **`preferCSSPageSize` 未生效／PDF 變 Letter**：一定要用 `page.pdf()` 帶 `preferCSSPageSize:true` 且 `width/height` 明給 `1920px/1080px`；純 `playwright-cli pdf` 指令不會套 `@page`。
- **封面兩個 Logo 一樣大**：標案封面甲方要明顯大於乙方（template 預設 client 104px / vendor 36px）。
- **進度條沒顯示配分**：把 `DECK.showWeights` 設 `true`，且 `CHAPTERS` 用 `weight`（或 `score`）。
- **頁尾在螢幕上和進度條之間有空白**：`placeChapters()` 會把 `#chapters` 釘在投影片下緣、`.s-foot` 用 `bottom:6px` 貼齊；`@media print` 再把 `.s-foot` 拉回 `bottom:66px` 以避開 PDF 內的靜態章節條。螢幕與 PDF 兩者刻意分開，不要改成一致。
