const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert state
code = code.replace(
  'const [showTrophyCabinet, setShowTrophyCabinet] = useState(false);',
  `const [showTrophyCabinet, setShowTrophyCabinet] = useState(false);
  const [trophyFilter, setTrophyFilter] = useState<'all' | 'unlocked' | 'locked'>('all');`
);

// Insert filter buttons & apply filter to map
const targetHeader = `<div className="flex items-center justify-between mb-8 sticky top-0 bg-[#FCFAF5] z-10 py-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-stone-800">
                  <Medal className="w-6 h-6 text-yellow-500" />
                  成就獎盃櫃
                </h2>
                <button 
                  onClick={() => setShowTrophyCabinet(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BADGES.map((badge, idx) => {
                  const isUnlocked = !!unlockedBadges[badge.id];`;

const replacementHeader = `<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 bg-[#FCFAF5] z-10 py-2">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-stone-800">
                    <Medal className="w-6 h-6 text-yellow-500" />
                    成就獎盃櫃
                  </h2>
                  <button 
                    onClick={() => setShowTrophyCabinet(false)}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors md:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl flex-shrink-0">
                  <button 
                    onClick={() => { playClickSound(); setTrophyFilter('all'); }}
                    className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all \${trophyFilter === 'all' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}\`}
                  >
                    全部
                  </button>
                  <button 
                    onClick={() => { playClickSound(); setTrophyFilter('unlocked'); }}
                    className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all \${trophyFilter === 'unlocked' ? 'bg-white shadow-sm text-yellow-700' : 'text-stone-500 hover:text-stone-700'}\`}
                  >
                    已解鎖
                  </button>
                  <button 
                    onClick={() => { playClickSound(); setTrophyFilter('locked'); }}
                    className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-all \${trophyFilter === 'locked' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}\`}
                  >
                    待解鎖
                  </button>
                </div>

                <button 
                  onClick={() => setShowTrophyCabinet(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors hidden md:block"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BADGES.filter(badge => {
                  const isUnlocked = !!unlockedBadges[badge.id];
                  if (trophyFilter === 'unlocked') return isUnlocked;
                  if (trophyFilter === 'locked') return !isUnlocked;
                  return true;
                }).map((badge, idx) => {
                  const isUnlocked = !!unlockedBadges[badge.id];`;

code = code.replace(targetHeader, replacementHeader);

fs.writeFileSync('src/App.tsx', code);
