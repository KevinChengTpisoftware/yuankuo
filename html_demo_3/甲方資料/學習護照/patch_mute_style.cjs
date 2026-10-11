const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      <button
        onClick={() => {
          const newMute = !isMuted;
          setIsMuted(newMute);
          toggleMute(newMute);
        }}
        className="fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border-2 border-stone-200 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
        title={isMuted ? "開啟音效" : "靜音"}
      >`;

const replacement = `      <button
        onClick={() => {
          const newMute = !isMuted;
          setIsMuted(newMute);
          toggleMute(newMute);
        }}
        className={\`fixed top-4 left-4 z-50 p-3 rounded-full transition-all active:scale-95 \${
          (showPrologue || milestoneStory) 
            ? "text-stone-500 hover:text-stone-300 hover:bg-white/10" 
            : "text-stone-400 hover:text-emerald-600 hover:bg-black/5"
        }\`}
        title={isMuted ? "開啟音效" : "靜音"}
      >`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
