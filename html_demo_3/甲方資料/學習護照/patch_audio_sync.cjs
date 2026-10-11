const fs = require('fs');

// PATCH AUDIO.TS
let audioCode = fs.readFileSync('src/lib/audio.ts', 'utf8');
const oldStartBGM = `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  stopBGM(true); // Fast clear previous
  currentBGMType = type;
  const playId = ++currentPlayId;
  if (isMuted) return;`;

const newStartBGM = `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  if (currentBGMType === type && activeAudioElement && !activeAudioElement.paused) return;
  stopBGM(true); // Fast clear previous
  currentBGMType = type;
  const playId = ++currentPlayId;
  if (isMuted) return;`;

audioCode = audioCode.replace(oldStartBGM, newStartBGM);
fs.writeFileSync('src/lib/audio.ts', audioCode);

// PATCH APP.TSX
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  `onClick={() => { playClickSound(); setIsBookOpen(true); setShowPrologue(true); }}`,
  `onClick={() => { playClickSound(); setIsBookOpen(true); setShowPrologue(true); startBGM('prologue'); }}`
);

appCode = appCode.replace(
  `                      onClick={() => {
                        stopBGM(true);
                        if (showPrologue) setShowPrologue(false);
                        else setMilestoneStory(null);
                      }}`,
  `                      onClick={() => {
                        stopBGM(true);
                        if (showPrologue) setShowPrologue(false);
                        else setMilestoneStory(null);
                        startBGM('main');
                      }}`
);

appCode = appCode.replace(
  `onClick={() => { playClickSound(); setShowMenuModal(false); setIsBookOpen(false); }}`,
  `onClick={() => { playClickSound(); setShowMenuModal(false); setIsBookOpen(false); startBGM('cover'); }}`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log("Patched successfully");
