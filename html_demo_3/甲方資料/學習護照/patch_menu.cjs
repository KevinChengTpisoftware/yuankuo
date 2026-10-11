const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const logoMatch = `                  <a href="https://www.yuankuo.com.tw/consultation-hours" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="員郭醫院 Logo" className="h-8 md:h-10 object-contain cursor-pointer mb-2" />
                  </a>`;

code = code.replace(logoMatch, '');

const buttonMatch = `                <button
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowTrophyCabinet(true); }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-2xl border border-yellow-200 text-yellow-700 transition-colors"
                >
                  <Medal className="w-8 h-8 text-yellow-500" />
                  <span className="font-bold text-sm">成就獎盃櫃</span>
                </button>`;

code = code.replace(buttonMatch, '');

fs.writeFileSync('src/App.tsx', code);
