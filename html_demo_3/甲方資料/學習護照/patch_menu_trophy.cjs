const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetMatch = `                <button
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowStats(true); }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-200 text-blue-700 transition-colors"
                >
                  <Activity className="w-8 h-8 text-blue-500" />
                  <span className="font-bold text-sm">展開圖表</span>
                </button>



                <button`;

const targetReplace = `                <button
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowStats(true); }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-200 text-blue-700 transition-colors"
                >
                  <Activity className="w-8 h-8 text-blue-500" />
                  <span className="font-bold text-sm">展開圖表</span>
                </button>

                <button
                  onClick={() => { playClickSound(); setShowMenuModal(false); setShowTrophyCabinet(true); }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-2xl border border-yellow-200 text-yellow-700 transition-colors"
                >
                  <Medal className="w-8 h-8 text-yellow-500" />
                  <span className="font-bold text-sm">成就獎盃櫃</span>
                </button>

                <button`;

code = code.replace(targetMatch, targetReplace);
fs.writeFileSync('src/App.tsx', code);
