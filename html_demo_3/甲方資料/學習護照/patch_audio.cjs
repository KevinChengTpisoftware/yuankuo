const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

// replace the volume logic
code = code.replace(/let fadeInterval: any = null;/g, `let fadeInterval: any = null;\nexport let currentMasterVolume = 0.3;\nlet synthMasterGain: GainNode | null = null;`);

code = code.replace(/export const toggleMute = \(muted: boolean\) => \{[\s\S]*?\};/g, `export const toggleMute = (muted: boolean) => {
  isMuted = muted;
  if (isMuted) {
    if (activeAudioElement) activeAudioElement.volume = 0;
    if (synthMasterGain) synthMasterGain.gain.linearRampToValueAtTime(0, audioCtx!.currentTime + 0.5);
  } else {
    if (activeAudioElement) activeAudioElement.volume = currentMasterVolume;
    if (synthMasterGain) synthMasterGain.gain.linearRampToValueAtTime(currentMasterVolume * 0.5, audioCtx!.currentTime + 0.5);
  }
};

export const setMasterVolume = (vol: number) => {
  currentMasterVolume = vol;
  if (!isMuted) {
    if (activeAudioElement) activeAudioElement.volume = currentMasterVolume;
    if (synthMasterGain && audioCtx) {
       synthMasterGain.gain.linearRampToValueAtTime(currentMasterVolume * 0.5, audioCtx.currentTime + 0.1);
    }
  }
};`);

code = code.replace(/  const masterGain = audioCtx.createGain\(\);/g, `  const masterGain = audioCtx.createGain();\n  synthMasterGain = masterGain;`);

code = code.replace(/  masterGain\.gain\.linearRampToValueAtTime\(0\.15, audioCtx\.currentTime \+ 3\);/g, `  masterGain.gain.linearRampToValueAtTime(isMuted ? 0 : currentMasterVolume * 0.5, audioCtx.currentTime + 3);`);

code = code.replace(/      if \(vol >= 0\.3\) \{/g, `      if (vol >= currentMasterVolume) {`);
code = code.replace(/        audio\.volume = 0\.3;/g, `        audio.volume = isMuted ? 0 : currentMasterVolume;`);

code = code.replace(/export const startBGM = \(type: 'prologue' \| 'milestone'\) => \{/g, `export const startBGM = (type: 'prologue' | 'milestone' | 'main') => {`);

code = code.replace(/const playSynthBGM = \(type: 'prologue' \| 'milestone'\) => \{/g, `const playSynthBGM = (type: 'prologue' | 'milestone' | 'main') => {`);

fs.writeFileSync('src/lib/audio.ts', code);
