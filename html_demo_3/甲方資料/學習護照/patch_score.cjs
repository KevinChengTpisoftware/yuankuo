const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="text-lg md:text-2xl font-bold text-emerald-700 leading-none mb-1">{totalProgress}%</div>
                <div className="text-[10px] md:text-xs text-emerald-600 font-medium">總達成率</div>`;
const replacement = `<div className="text-lg md:text-2xl font-bold text-emerald-700 leading-none mb-1">{completedTasks.size}/{TASKS.length}</div>
                <div className="text-[10px] md:text-xs text-emerald-600 font-medium whitespace-nowrap">總達成率 {totalProgress}%</div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
