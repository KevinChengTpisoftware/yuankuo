const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Remove the old inline listener
const inlineListener = `
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
code = code.replace(inlineListener, '');

const exportsCode = `
export const suspendAllAudio = () => {
  if (activeAudioElement) {
    activeAudioElement.pause();
  }
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend();
  }
};

export const resumeAllAudio = () => {
  if (activeAudioElement && !isMuted && currentBGMType) {
    activeAudioElement.play().catch(() => {});
  }
  if (audioCtx && audioCtx.state === 'suspended' && !isMuted) {
    audioCtx.resume();
  }
};
`;

code = code + exportsCode;
fs.writeFileSync('src/lib/audio.ts', code);
