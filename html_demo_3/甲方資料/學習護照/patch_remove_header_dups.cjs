const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const headerLogoMatch = `              <div className="hidden md:flex flex-col items-center justify-center bg-white rounded-xl md:rounded-2xl p-2 border border-stone-200 min-w-[80px] md:w-[120px] shrink-0">
                <a href="https://www.yuankuo.com.tw/consultation-hours" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity w-full h-full flex items-center justify-center">
                  <img src="/logo.png" alt="員郭醫院 Logo" className="max-w-full max-h-12 md:max-h-16 object-contain cursor-pointer" />
                </a>
              </div>`;

const headerTrophyMatch = `              <button
                onClick={() => { playClickSound(); setShowTrophyCabinet(true); }}
                className="hidden md:flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 rounded-xl md:rounded-2xl p-3 md:p-4 border border-yellow-200 min-w-[80px] md:w-[120px] transition-colors shrink-0"
              >
                <Medal className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mb-1" />
                <div className="text-[10px] md:text-xs font-bold text-yellow-700">成就獎盃</div>
              </button>`;

code = code.replace(headerLogoMatch, '');
code = code.replace(headerTrophyMatch, '');

fs.writeFileSync('src/App.tsx', code);
