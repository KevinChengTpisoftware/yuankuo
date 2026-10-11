const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'import { startBGM, stopBGM } from "./lib/audio";',
  'import { startBGM, stopBGM, playPageFlipSound } from "./lib/audio";'
);

const oldBtn = `<button
                  onClick={() => { setIsBookOpen(true); setShowPrologue(true); }}`;

const newBtn = `<button
                  onClick={() => { playPageFlipSound(); setIsBookOpen(true); setShowPrologue(true); }}`;
                  
code = code.replace(oldBtn, newBtn);

fs.writeFileSync('src/App.tsx', code);
