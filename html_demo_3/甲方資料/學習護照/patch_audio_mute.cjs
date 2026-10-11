const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const target1 = `let fadeInterval: any = null;`;
const replacement1 = `let fadeInterval: any = null;
let isMuted = false;

export const toggleMute = (muted: boolean) => {
  isMuted = muted;
  if (isMuted) {
    stopBGM(true);
  }
};`;

code = code.replace(target1, replacement1);

const targetBGM = `const playSynthBGM = (type: 'prologue' | 'milestone') => {`;
const replacementBGM = `const playSynthBGM = (type: 'prologue' | 'milestone') => {
  if (isMuted) return;`;
code = code.replace(targetBGM, replacementBGM);

const targetBGM2 = `export const startBGM = (type: 'prologue' | 'milestone') => {
  stopBGM(true); // Fast clear previous`;
const replacementBGM2 = `export const startBGM = (type: 'prologue' | 'milestone') => {
  stopBGM(true); // Fast clear previous
  if (isMuted) return;`;
code = code.replace(targetBGM2, replacementBGM2);

const targetClick = `export const playClickSound = () => {`;
const replacementClick = `export const playClickSound = () => {
  if (isMuted) return;`;
code = code.replace(targetClick, replacementClick);

fs.writeFileSync('src/lib/audio.ts', code);
