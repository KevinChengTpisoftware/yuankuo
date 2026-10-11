let audioCtx: AudioContext | null = null;
let activeNodes: (GainNode | OscillatorNode | AudioBufferSourceNode)[] = [];
let activeAudioElement: HTMLAudioElement | null = null;
let fadeInterval: any = null;
export let currentMasterVolume = 0.3;
let synthMasterGain: GainNode | null = null;
let isMuted = false;
let currentBGMType: string | null = null;
let currentPlayId = 0;

export const toggleMute = (muted: boolean) => {
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
};

const playSynthBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  if (isMuted) return;
  if (!window.AudioContext && !(window as any).webkitAudioContext) return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const masterGain = audioCtx.createGain();
  synthMasterGain = masterGain;
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(isMuted ? 0 : currentMasterVolume * 0.5, audioCtx.currentTime + 3);
  masterGain.connect(audioCtx.destination);
  activeNodes.push(masterGain);

  const freqs = type === 'prologue' 
    ? [146.83, 220.00, 261.63, 329.63] 
    : type === 'milestone'
    ? [196.00, 246.94, 293.66, 392.00]
    : type === 'cover'
    ? [220.00, 277.18, 329.63, 440.00]
    : [261.63, 329.63, 392.00, 523.25]; 

  freqs.forEach((freq, idx) => {
    const osc = audioCtx!.createOscillator();
    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    
    const lfo = audioCtx!.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + Math.random() * 0.1;
    
    const lfoGain = audioCtx!.createGain();
    lfoGain.gain.value = 5; 
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    
    const oscGain = audioCtx!.createGain();
    oscGain.gain.value = 1.0 / freqs.length; 
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    
    osc.start();
    lfo.start();
    
    activeNodes.push(osc, lfoGain as any, oscGain);
  });

  if (type === 'prologue') {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    const filterLfo = audioCtx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.15;
    const filterLfoGain = audioCtx.createGain();
    filterLfoGain.gain.value = 200;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start();

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0, audioCtx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 5);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    noise.start();
    activeNodes.push(noise, filter, filterLfo, filterLfoGain as any, noiseGain);
  }
};

export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  if (currentBGMType === type && activeAudioElement && !activeAudioElement.paused) return;
  stopBGM(true); // Fast clear previous
  currentBGMType = type;
  const playId = ++currentPlayId;
  if (isMuted) return;

  // Try loading custom audio file first
  const audio = new Audio(`/${type}.mp3`);
  audio.loop = true;
  audio.volume = 0;
  activeAudioElement = audio; // assign early so stopBGM can try to pause it

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      if (playId !== currentPlayId) {
        audio.pause();
        return;
      }
      activeAudioElement = audio;
      let vol = 0;
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
      }, 100);
    }).catch((e) => {
      if (e.name === 'NotAllowedError') {
        console.log("Autoplay blocked for", type, ". Waiting for user interaction...");
        const resumeOnInteract = () => {
          if (isMuted || playId !== currentPlayId) return;
          audio.play().then(() => {
            if (playId !== currentPlayId) {
               audio.pause();
               return;
            }
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
      } else if (e.name === 'AbortError') {
        console.log(`Play aborted for ${type}.mp3 (likely stopped or switched)`);
      } else {
        console.log(`Custom BGM ${type}.mp3 not found or error (${e.name}), using synth fallback`);
        playSynthBGM(type);
      }
    });
  }
};

export const stopBGM = (immediate = false) => {
  currentBGMType = null;
  currentPlayId++;
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (activeAudioElement) {
    if (immediate) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    } else {
      const audio = activeAudioElement;
      activeAudioElement = null;
      let vol = audio.volume;
      const fadeOut = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          clearInterval(fadeOut);
          audio.pause();
          audio.currentTime = 0;
        } else {
          audio.volume = Math.max(0, vol);
        }
      }, 100);
    }
  }

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
};

export const playClickSound = () => {
  if (isMuted) return;
  if (!window.AudioContext && !(window as any).webkitAudioContext) return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // UI Click sound
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'sine';
  
  // Frequency envelope for a "pop/click"
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
  
  // Amplitude envelope
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
};

export const playSuccessSound = () => {
  if (isMuted) return;
  if (!window.AudioContext && !(window as any).webkitAudioContext) return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, idx) => {
    const osc = audioCtx!.createOscillator();
    const gainNode = audioCtx!.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);

    gainNode.gain.setValueAtTime(0, now + idx * 0.07);
    gainNode.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

    osc.connect(gainNode);
    gainNode.connect(audioCtx!.destination);

    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.3);
  });
};

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
