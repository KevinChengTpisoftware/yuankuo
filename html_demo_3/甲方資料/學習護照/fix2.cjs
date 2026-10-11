const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/}\)`\)\.join\('\n'\) : '尚未完成任何任務'}\n`;\n`;/, "})`).join('\\n') : '尚未完成任何任務'}\n`;");

fs.writeFileSync('src/App.tsx', code);
