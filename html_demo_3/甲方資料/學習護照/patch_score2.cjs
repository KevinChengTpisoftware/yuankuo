const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="text-[10px] md:text-xs text-emerald-600 font-medium whitespace-nowrap">總達成率 {totalProgress}%</div>`;
const replacement = `<div className="text-[10px] md:text-xs text-emerald-600 font-medium whitespace-nowrap">達成率 {totalProgress}%</div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
