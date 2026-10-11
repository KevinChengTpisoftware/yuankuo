const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

const targetCatch = `      } else {
        console.log(\`Custom BGM \${type}.mp3 not found or error (\${e.name}), using synth fallback\`);
        playSynthBGM(type);
      }`;

const replacementCatch = `      } else if (e.name === 'AbortError') {
        console.log(\`Play aborted for \${type}.mp3 (likely stopped or switched)\`);
      } else {
        console.log(\`Custom BGM \${type}.mp3 not found or error (\${e.name}), using synth fallback\`);
        playSynthBGM(type);
      }`;

if (code.includes(targetCatch)) {
  code = code.replace(targetCatch, replacementCatch);
  fs.writeFileSync('src/lib/audio.ts', code);
  console.log("Patched AbortError");
} else {
  console.log("Target not found");
}
