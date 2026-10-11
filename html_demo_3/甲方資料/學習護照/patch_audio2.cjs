const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

code = code.replace(/  const freqs = type === 'prologue' \n     \? \[146\.83, 220\.00, 261\.63, 329\.63\] \n     : \[196\.00, 246\.94, 293\.66, 392\.00\];/g, `  const freqs = type === 'prologue' 
    ? [146.83, 220.00, 261.63, 329.63] 
    : type === 'milestone'
    ? [196.00, 246.94, 293.66, 392.00]
    : [261.63, 329.63, 392.00, 523.25];`);

fs.writeFileSync('src/lib/audio.ts', code);
