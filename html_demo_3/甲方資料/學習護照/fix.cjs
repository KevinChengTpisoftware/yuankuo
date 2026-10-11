const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/白金'\\n    }\)/g, "白金'\n    })");
fs.writeFileSync('src/App.tsx', code);
