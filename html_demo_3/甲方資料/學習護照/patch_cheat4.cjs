const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCheat = `          if (currentMainCount < 48) targetCount = 48;
          else if (currentMainCount < 98) targetCount = 98;
          else if (currentMainCount < 148) targetCount = 148;
          else targetCount = 0;`;

const newCheat = `          if (currentMainCount < 48) {
            targetCount = 48;
          } else if (currentMainCount >= 48 && currentMainCount < 98) {
            targetCount = 98;
          } else if (currentMainCount >= 98 && currentMainCount < 148) {
            targetCount = 148;
          } else {
            targetCount = 0;
          }
          console.log("Cheat triggered! current:", currentMainCount, "target:", targetCount);
          `;

code = code.replace(oldCheat, newCheat);

fs.writeFileSync('src/App.tsx', code);
