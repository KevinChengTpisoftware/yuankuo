const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCheat = `          // Jump to 31, 98, 148, then 0.
          if (currentMainCount < 31) targetCount = 31;
          else if (currentMainCount < 98) targetCount = 98;
          else if (currentMainCount < 148) targetCount = 148;
          else targetCount = 0;`;

const newCheat = `          if (currentMainCount < 48) targetCount = 48;
          else if (currentMainCount < 98) targetCount = 98;
          else if (currentMainCount < 148) targetCount = 148;
          else targetCount = 0;`;

code = code.replace(oldCheat, newCheat);

fs.writeFileSync('src/App.tsx', code);
