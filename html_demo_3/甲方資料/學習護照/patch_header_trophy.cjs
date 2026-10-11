const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const headerStatsMatch = `              <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-100 min-w-[80px] md:w-[120px] shrink-0">
                <Award className="w-5 h-5 md:w-8 md:h-8 text-emerald-500 mb-1" />
                <div className="text-lg md:text-2xl font-bold text-emerald-700 leading-none mb-1">{overallCompleted}/{mainTasks.length}</div>
                <div className="text-[10px] md:text-xs text-emerald-600 font-medium whitespace-nowrap">達成率 {totalProgress}%</div>
              </div>`;

const headerStatsReplace = `              <button
                onClick={() => { playClickSound(); setShowTrophyCabinet(true); }}
                className="hidden md:flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 rounded-xl md:rounded-2xl p-3 md:p-4 border border-yellow-200 min-w-[80px] md:w-[120px] transition-colors shrink-0"
              >
                <Medal className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mb-1" />
                <div className="text-[10px] md:text-xs font-bold text-yellow-700">成就獎盃</div>
              </button>
              <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-100 min-w-[80px] md:w-[120px] shrink-0">
                <Award className="w-5 h-5 md:w-8 md:h-8 text-emerald-500 mb-1" />
                <div className="text-lg md:text-2xl font-bold text-emerald-700 leading-none mb-1">{overallCompleted}/{mainTasks.length}</div>
                <div className="text-[10px] md:text-xs text-emerald-600 font-medium whitespace-nowrap">達成率 {totalProgress}%</div>
              </div>`;

code = code.replace(headerStatsMatch, headerStatsReplace);
fs.writeFileSync('src/App.tsx', code);
