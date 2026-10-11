const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Add currentBGMType variable
code = code.replace(
  `let isMuted = false;`,
  `let isMuted = false;
let currentBGMType: string | null = null;`
);

// Update stopBGM to clear currentBGMType
code = code.replace(
  `export const stopBGM = (immediate = false) => {`,
  `export const stopBGM = (immediate = false) => {
  currentBGMType = null;`
);

// Update startBGM
const oldStartBGM = `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  stopBGM(true); // Fast clear previous
  if (isMuted) return;

  // Try loading custom audio file first
  const audio = new Audio(\`/\${type}.mp3\`);
  audio.loop = true;
  audio.volume = 0;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      activeAudioElement = audio;`;

const newStartBGM = `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  stopBGM(true); // Fast clear previous
  currentBGMType = type;
  if (isMuted) return;

  // Try loading custom audio file first
  const audio = new Audio(\`/\${type}.mp3\`);
  audio.loop = true;
  audio.volume = 0;
  activeAudioElement = audio; // assign early so stopBGM can try to pause it

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      if (currentBGMType !== type) {
        audio.pause();
        return;
      }
      activeAudioElement = audio;`;

code = code.replace(oldStartBGM, newStartBGM);

// Also need to handle the interact fallback inside startBGM
const oldInteractFallback = `        const resumeOnInteract = () => {
          if (isMuted) return;
          audio.play().then(() => {
            activeAudioElement = audio;
            audio.volume = currentMasterVolume;
          }).catch(err => {`;

const newInteractFallback = `        const resumeOnInteract = () => {
          if (isMuted || currentBGMType !== type) return;
          audio.play().then(() => {
            if (currentBGMType !== type) {
               audio.pause();
               return;
            }
            activeAudioElement = audio;
            audio.volume = currentMasterVolume;
          }).catch(err => {`;

code = code.replace(oldInteractFallback, newInteractFallback);

fs.writeFileSync('src/lib/audio.ts', code);
