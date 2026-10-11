const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const target = `export const playPageFlipSound = () => {
  if (!window.AudioContext && !(window as any).webkitAudioContext) return;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // A page flip is typically multiple short sounds: 
  // 1. the initial lifting/sliding of the page
  // 2. the page turning in the air
  // 3. the page landing

  const playBurst = (delay, duration, freq, q, gainVal) => {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;

    const gainNode = audioCtx.createGain();
    const startTime = audioCtx.currentTime + delay;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gainVal, startTime + duration * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);
  };

  // The lift (lower frequency friction)
  playBurst(0, 0.15, 600, 1.0, 0.4);
  // The flip (higher frequency movement)
  playBurst(0.08, 0.25, 1800, 0.5, 0.6);
  // The land (crisper high frequency tap)
  playBurst(0.2, 0.12, 1000, 1.5, 0.3);
};`;

const replacement = `export const playPageFlipSound = () => {
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
};`;

code = code.replace(target, replacement);

fs.writeFileSync('src/lib/audio.ts', code);
