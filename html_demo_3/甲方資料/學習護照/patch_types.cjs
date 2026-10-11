const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace("export type Category = '食' | '衣' | '住' | '行' | '育' | '樂' | '全部';", "export type Category = '食' | '衣' | '住' | '行' | '育' | '樂' | '選修' | '全部';");
fs.writeFileSync('src/types.ts', code);
