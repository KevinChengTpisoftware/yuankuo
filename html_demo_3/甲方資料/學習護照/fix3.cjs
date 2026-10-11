const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/「員郭村」以你為榮，去迎接屬於你的嶄新人生吧！`;\\n                  }/g, '「員郭村」以你為榮，去迎接屬於你的嶄新人生吧！`;\n                  }');
fs.writeFileSync('src/App.tsx', code);
