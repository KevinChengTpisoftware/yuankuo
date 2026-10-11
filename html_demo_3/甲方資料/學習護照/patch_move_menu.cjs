const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const leftSideMenuMatch = `              <div className="mt-4">
                <button
                  onClick={() => { playClickSound(); setShowMenuModal(true); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                >
                  <Menu className="w-5 h-5" />
                  護照工具選單
                </button>
              </div>`;

code = code.replace(leftSideMenuMatch, '');

const rightSideContainerMatch = `            <div className="flex items-stretch gap-2 md:gap-3 shrink-0 mt-2 md:mt-0">`;

const rightSideContainerReplace = `            <div className="flex items-stretch gap-2 md:gap-3 shrink-0 mt-2 md:mt-0">
              <button
                onClick={() => { playClickSound(); setShowMenuModal(true); }}
                className="flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 rounded-xl md:rounded-2xl p-3 md:p-4 border border-stone-200 min-w-[80px] md:w-[120px] transition-colors shrink-0"
              >
                <Menu className="w-6 h-6 md:w-8 md:h-8 text-stone-500 mb-1" />
                <div className="text-[10px] md:text-xs font-bold text-stone-700">工具選單</div>
              </button>`;

code = code.replace(rightSideContainerMatch, rightSideContainerReplace);

fs.writeFileSync('src/App.tsx', code);
