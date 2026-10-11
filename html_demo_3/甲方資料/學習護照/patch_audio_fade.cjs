const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldFade = `      let vol = 0;
      fadeInterval = setInterval(() => {
        vol += 0.05;
        if (vol >= currentMasterVolume) {
          clearInterval(fadeInterval);
          audio.volume = isMuted ? 0 : currentMasterVolume;
        } else {
          audio.volume = vol;
        }
      }, 100);`;

const newFade = `      let vol = 0;
      fadeInterval = setInterval(() => {
        if (isMuted) {
          clearInterval(fadeInterval);
          audio.volume = 0;
          return;
        }
        vol += 0.05;
        if (vol >= currentMasterVolume) {
          clearInterval(fadeInterval);
          audio.volume = currentMasterVolume;
        } else {
          audio.volume = vol;
        }
      }, 100);`;

code = code.replace(oldFade, newFade);
fs.writeFileSync('src/lib/audio.ts', code);
