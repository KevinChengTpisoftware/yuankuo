const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/fixed top-4 left-4 z-50/g, 'fixed top-4 right-4 z-50');

fs.writeFileSync('src/App.tsx', code);
