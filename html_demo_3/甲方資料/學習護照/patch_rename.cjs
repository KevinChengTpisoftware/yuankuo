const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');
code = code.replace(/playPageFlipSound/g, 'playClickSound');
fs.writeFileSync('src/lib/audio.ts', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/playPageFlipSound/g, 'playClickSound');
fs.writeFileSync('src/App.tsx', appCode);
