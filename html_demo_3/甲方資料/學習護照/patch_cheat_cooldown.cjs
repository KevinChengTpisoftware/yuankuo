const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const cheatMatch = `      if (next >= 15) {
        // Trigger cheat
        setCompletedTasks(currentTasks => {`;
const cheatReplace = `      if (next >= 15) {
        // Prevent rapid double triggering
        if (window._lastCheatTime && Date.now() - window._lastCheatTime < 2000) {
          return 0;
        }
        window._lastCheatTime = Date.now();

        // Trigger cheat
        setCompletedTasks(currentTasks => {`;

code = code.replace(cheatMatch, cheatReplace);
fs.writeFileSync('src/App.tsx', code);
