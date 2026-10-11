const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove handleSpeakText function
const speakFnTarget = `  const handleSpeakText = (e: React.MouseEvent, title: string, description: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      // Browsers sometimes get stuck, canceling first is good
      window.speechSynthesis.cancel();
      
      // Small timeout helps clear the stuck state in Safari/Chrome on iOS/Android
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(\`\${title}。\${description}\`);
        utterance.lang = 'zh-TW';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };`;

if (code.includes(speakFnTarget)) {
  code = code.replace(speakFnTarget, '');
  console.log("Removed handleSpeakText");
} else {
  console.log("handleSpeakText not found");
}

// Remove the button
const buttonTarget = `                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {task.location && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                                {task.location}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleSpeakText(e, task.title, task.description)}
                            className={\`p-3 -m-1.5 md:p-2 md:-m-0.5 rounded-full transition-colors flex-shrink-0 \${
                              isCompleted 
                                ? 'text-stone-300 hover:text-stone-500 hover:bg-stone-200/50 active:bg-stone-300/50' 
                                : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
                            }\`}
                            title="朗讀任務"
                            aria-label="朗讀任務"
                          >
                            <Volume2 className="w-5 h-5 md:w-4 md:h-4" />
                          </button>
                        </div>`;

const buttonReplacement = `                        {task.location && (
                          <div className="mb-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 inline-block">
                              {task.location}
                            </span>
                          </div>
                        )}`;

if (code.includes(buttonTarget)) {
  code = code.replace(buttonTarget, buttonReplacement);
  console.log("Removed button");
} else {
  console.log("Button target not found");
}

// Add onClick to cover
const coverTarget = `        <motion.div 
          key="cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeIn" }}
          className="min-h-screen bg-[#F4F0E6] flex items-center justify-center p-4 md:p-8 perspective-[1500px]"
        >`;

const coverReplacement = `        <motion.div 
          key="cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeIn" }}
          className="min-h-screen bg-[#F4F0E6] flex items-center justify-center p-4 md:p-8 perspective-[1500px]"
          onClick={() => startBGM('cover')}
          onTouchStart={() => startBGM('cover')}
        >`;

if (code.includes(coverTarget)) {
  code = code.replace(coverTarget, coverReplacement);
  console.log("Added cover interaction handlers");
} else {
  console.log("Cover target not found");
}

fs.writeFileSync('src/App.tsx', code);
