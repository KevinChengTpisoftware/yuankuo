const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// when closing prologue, make sure to stop BGM
const target = `onClick={() => {
                        if (showPrologue) setShowPrologue(false);
                        else setMilestoneStory(null);
                      }}`;
const replacement = `onClick={() => {
                        stopBGM(true);
                        if (showPrologue) setShowPrologue(false);
                        else setMilestoneStory(null);
                      }}`;
code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
