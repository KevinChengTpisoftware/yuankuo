const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `import { startBGM, stopBGM, playClickSound, toggleMute, setMasterVolume } from "./lib/audio";`,
  `import { startBGM, stopBGM, playClickSound, toggleMute, setMasterVolume, suspendAllAudio, resumeAllAudio } from "./lib/audio";`
);

const hookCode = `
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        suspendAllAudio();
      } else {
        resumeAllAudio();
      }
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Call suspendAllAudio on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      suspendAllAudio();
    };
  }, []);
`;

// Insert the hook inside App component, near the other global useEffects
const marker = `  // Load unlocked badges
  useEffect(() => {`;

code = code.replace(marker, hookCode + '\n' + marker);

fs.writeFileSync('src/App.tsx', code);
