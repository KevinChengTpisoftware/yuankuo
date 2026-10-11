const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We need to add the cleanup function to the useEffect
const target = `  useEffect(() => {
    if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      stopBGM();
    }`;

const replacement = `  useEffect(() => {
    if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      stopBGM();
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
