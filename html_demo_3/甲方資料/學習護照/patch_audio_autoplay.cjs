const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const target = `  audio.play().then(() => {
    activeAudioElement = audio;
    let vol = 0;
    fadeInterval = setInterval(() => {
      vol += 0.05;
      if (vol >= currentMasterVolume) {
        clearInterval(fadeInterval);
        audio.volume = isMuted ? 0 : currentMasterVolume;
      } else {
        audio.volume = vol;
      }
    }, 100);
  }).catch((e) => {
    // Custom audio file not found or auto-play prevented
    console.log("Custom BGM not found or blocked, using synth fallback");
    playSynthBGM(type);
  });`;

const replacement = `  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      activeAudioElement = audio;
      let vol = 0;
      fadeInterval = setInterval(() => {
        vol += 0.05;
        if (vol >= currentMasterVolume) {
          clearInterval(fadeInterval);
          audio.volume = isMuted ? 0 : currentMasterVolume;
        } else {
          audio.volume = vol;
        }
      }, 100);
    }).catch((e) => {
      if (e.name === 'NotAllowedError') {
        console.log("Autoplay blocked for", type, ". Waiting for user interaction...");
        const resumeOnInteract = () => {
          if (isMuted) return;
          audio.play().then(() => {
            activeAudioElement = audio;
            audio.volume = currentMasterVolume;
          }).catch(err => {
            console.log("Failed to play on interact:", err);
            if (err.name !== 'NotAllowedError') playSynthBGM(type);
          });
          window.removeEventListener('click', resumeOnInteract);
          window.removeEventListener('touchstart', resumeOnInteract);
        };
        window.addEventListener('click', resumeOnInteract);
        window.addEventListener('touchstart', resumeOnInteract);
      } else {
        console.log(\`Custom BGM \${type}.mp3 not found or error (\${e.name}), using synth fallback\`);
        playSynthBGM(type);
      }
    });
  }`;

if (code.includes('catch((e) => {')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/lib/audio.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
