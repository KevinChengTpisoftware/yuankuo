const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const visibilityCode = `
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (activeAudioElement) {
        activeAudioElement.pause();
      }
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
      }
    } else {
      if (activeAudioElement && !isMuted && currentBGMType) {
        activeAudioElement.play().catch(() => {});
      }
      if (audioCtx && audioCtx.state === 'suspended' && !isMuted) {
        audioCtx.resume();
      }
    }
  });
}
`;

if (!code.includes('visibilitychange')) {
  fs.appendFileSync('src/lib/audio.ts', visibilityCode);
  console.log("Added visibilitychange listener");
} else {
  console.log("visibilitychange already exists");
}
