const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<button
                            onClick={(e) => handleSpeakText(e, task.title, task.description)}
                            className={\`p-1.5 rounded-full transition-colors \${
                              isCompleted 
                                ? 'text-stone-300 hover:text-stone-500 hover:bg-stone-200/50' 
                                : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }\`}
                            title="朗讀任務"
                            aria-label="朗讀任務"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>`;

const replacement = `<button
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
                          </button>`;

code = code.replace(target, replacement);

const handleSpeakTextTarget = `  const handleSpeakText = (e: React.MouseEvent, title: string, description: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(\`\${title}。\${description}\`);
      utterance.lang = 'zh-TW';
      window.speechSynthesis.speak(utterance);
    }
  };`;

const handleSpeakTextReplacement = `  const handleSpeakText = (e: React.MouseEvent, title: string, description: string) => {
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

code = code.replace(handleSpeakTextTarget, handleSpeakTextReplacement);

fs.writeFileSync('src/App.tsx', code);
