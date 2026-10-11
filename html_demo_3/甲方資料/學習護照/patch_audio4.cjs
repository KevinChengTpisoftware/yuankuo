const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const replacement = `export const stopBGM = (immediate = false) => {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const fadeTime = immediate ? 0.05 : 1;
  
  const nodesToStop = [...activeNodes];
  activeNodes = [];
  
  nodesToStop.forEach(node => {
    if (node instanceof GainNode) {
      try {
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(0, now + fadeTime);
      } catch (e) {}
    } else if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
      try {
        node.stop(now + fadeTime);
      } catch (e) {}
    }
  });
  
  setTimeout(() => {
    if (activeNodes.length === 0 && audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend();
    }
  }, (fadeTime + 0.1) * 1000);
};`;

code = code.replace(/export const stopBGM = [\s\S]*/, replacement);
fs.writeFileSync('src/lib/audio.ts', code);
