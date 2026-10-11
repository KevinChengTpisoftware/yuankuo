const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

// We need a unique ID for each play attempt to prevent leaks
code = code.replace(
  `let currentBGMType: string | null = null;`,
  `let currentBGMType: string | null = null;
let currentPlayId = 0;`
);

code = code.replace(
  `export const stopBGM = (immediate = false) => {
  currentBGMType = null;`,
  `export const stopBGM = (immediate = false) => {
  currentBGMType = null;
  currentPlayId++;`
);

const oldStartBGM = `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
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

const newStartBGM = `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {
  stopBGM(true); // Fast clear previous
  currentBGMType = type;
  const playId = ++currentPlayId;
  if (isMuted) return;

  // Try loading custom audio file first
  const audio = new Audio(\`/\${type}.mp3\`);
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
      activeAudioElement = audio;`;

code = code.replace(oldStartBGM, newStartBGM);

const oldFallback = `        const resumeOnInteract = () => {
          if (isMuted || currentBGMType !== type) return;
          audio.play().then(() => {
            if (currentBGMType !== type) {
               audio.pause();
               return;
            }`;

const newFallback = `        const resumeOnInteract = () => {
          if (isMuted || playId !== currentPlayId) return;
          audio.play().then(() => {
            if (playId !== currentPlayId) {
               audio.pause();
               return;
            }`;

code = code.replace(oldFallback, newFallback);

fs.writeFileSync('src/lib/audio.ts', code);
