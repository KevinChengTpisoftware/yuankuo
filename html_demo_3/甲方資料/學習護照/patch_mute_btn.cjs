const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importLucideTarget = `Play, Volume2, Share2, Clock, Users } from 'lucide-react';`;
const importLucideReplacement = `Play, Volume2, VolumeX, Share2, Clock, Users } from 'lucide-react';`;
code = code.replace(importLucideTarget, importLucideReplacement);

const importAudioTarget = `import { startBGM, stopBGM, playClickSound } from "./lib/audio";`;
const importAudioReplacement = `import { startBGM, stopBGM, playClickSound, toggleMute } from "./lib/audio";`;
code = code.replace(importAudioTarget, importAudioReplacement);

// Add isMuted state to App
const stateTarget = `  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());`;
const stateReplacement = `  const [isMuted, setIsMuted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());`;
code = code.replace(stateTarget, stateReplacement);

// Global mute button at top level of the return statement
// Let's find return (
const returnTarget = `  return (
    <>`;
const returnReplacement = `  return (
    <>
      <button
        onClick={() => {
          const newMute = !isMuted;
          setIsMuted(newMute);
          toggleMute(newMute);
        }}
        className="fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border-2 border-stone-200 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
        title={isMuted ? "開啟音效" : "靜音"}
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>`;
code = code.replace(returnTarget, returnReplacement);

fs.writeFileSync('src/App.tsx', code);
