const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCheat = `          // Jump to 49 (1 click away from 50/33%), 99 (1 click from 100/66%), 149 (1 click from 150/100%), then 0.
          if (currentMainCount < 49) targetCount = 49;
          else if (currentMainCount < 99) targetCount = 99;
          else if (currentMainCount < 149) targetCount = 149;
          else targetCount = 0;`;

const newCheat = `          // Jump to 31, 98, 148, then 0.
          if (currentMainCount < 31) targetCount = 31;
          else if (currentMainCount < 98) targetCount = 98;
          else if (currentMainCount < 148) targetCount = 148;
          else targetCount = 0;`;

code = code.replace(oldCheat, newCheat);

fs.writeFileSync('src/App.tsx', code);
