const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

code = code.replace(/180 天 PAC 計畫/g, '復健計畫');
code = code.replace(/PAC 計畫/g, '復健計畫');
code = code.replace(/PAC 結案/g, '復健結案');
code = code.replace(/180 天 PAC 尾聲/g, '復健計畫尾聲');
code = code.replace(/180 天 PAC 期程/g, '復健期程');
code = code.replace(/180 天的 PAC 旅程/g, '復健旅程');
code = code.replace(/PAC/g, '復健');

fs.writeFileSync('src/data.ts', code);
