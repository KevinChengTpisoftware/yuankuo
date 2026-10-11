const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');

code = code.replace(
  /export const startBGM = \(type: 'prologue' \| 'milestone' \| 'main'\) => \{/g,
  `export const startBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {`
);

code = code.replace(
  /const playSynthBGM = \(type: 'prologue' \| 'milestone' \| 'main'\) => \{/g,
  `const playSynthBGM = (type: 'prologue' | 'milestone' | 'main' | 'cover') => {`
);

code = code.replace(
  `const freqs = type === 'prologue' 
    ? [146.83, 220.00, 261.63, 329.63] 
    : type === 'milestone'
    ? [196.00, 246.94, 293.66, 392.00]
    : [261.63, 329.63, 392.00, 523.25];`,
  `const freqs = type === 'prologue' 
    ? [146.83, 220.00, 261.63, 329.63] 
    : type === 'milestone'
    ? [196.00, 246.94, 293.66, 392.00]
    : type === 'cover'
    ? [220.00, 277.18, 329.63, 440.00]
    : [261.63, 329.63, 392.00, 523.25];`
);

fs.writeFileSync('src/lib/audio.ts', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    if (!isBookOpen) {
      stopBGM();
      return;
    }
    
    if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      startBGM('main');
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };
  }, [showPrologue, milestoneStory, isBookOpen]);`;

const newUseEffect = `  useEffect(() => {
    if (!isBookOpen) {
      startBGM('cover');
    } else if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      startBGM('main');
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };
  }, [showPrologue, milestoneStory, isBookOpen]);`;

appCode = appCode.replace(oldUseEffect, newUseEffect);

// Add a volume button to the cover page too so they can unmute it if browser blocks it.
const oldCoverPage = `<div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl w-full max-w-md mx-auto transform transition-all border border-stone-200">`;
const newCoverPage = `
            {/* Audio Toggle on Cover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                playClickSound();
                const newMute = !isMuted;
                setIsMuted(newMute);
                toggleMute(newMute);
                if (!newMute) {
                  startBGM('cover'); // Trigger explicitly on click to bypass auto-play restrictions
                }
              }}
              className="absolute top-4 right-4 z-50 p-3 rounded-full transition-all active:scale-95 text-stone-400 hover:text-emerald-600 hover:bg-black/5"
              title={isMuted ? "開啟音效" : "靜音"}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
<div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl w-full max-w-md mx-auto transform transition-all border border-stone-200">`;

appCode = appCode.replace(oldCoverPage, newCoverPage);

fs.writeFileSync('src/App.tsx', appCode);
