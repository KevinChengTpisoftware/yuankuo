#!/usr/bin/env bash
# tpi-deck → PDF（16:9、每頁一張、背景色與分段進度條保留）
#
# 用法：  bash make_pdf.sh <輸出目錄> <html 檔名> [pdf 檔名] [port]
# 範例：  bash make_pdf.sh html_PPT "前瞻產品應用創新部 成立提案 - 簡報版.html"
#
# 需求：專案已安裝 playwright（npx --no-install playwright-cli 可用）、python3。

set -euo pipefail

DIR="${1:?輸出目錄}"
HTML="${2:?html 檔名}"
PDF="${3:-${HTML%.html}.pdf}"
PORT="${4:-8129}"

# URL-encode 檔名（空白 / 中文）
ENC=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$HTML")

( cd "$DIR" && python3 -m http.server "$PORT" >/dev/null 2>&1 & echo $! > /tmp/tpi_deck_httpd.pid )
sleep 2
trap 'kill "$(cat /tmp/tpi_deck_httpd.pid)" 2>/dev/null || true' EXIT

npx --no-install playwright-cli open "http://localhost:${PORT}/${ENC}" >/dev/null
npx --no-install playwright-cli resize 1920 1080 >/dev/null
npx --no-install playwright-cli run-code "async page => { await page.emulateMedia({ media:'print' }); await page.pdf({ path:'${DIR}/${PDF}', width:'1920px', height:'1080px', printBackground:true, preferCSSPageSize:true, margin:{ top:'0', bottom:'0', left:'0', right:'0' } }); }"

echo "✔ ${DIR}/${PDF}"
