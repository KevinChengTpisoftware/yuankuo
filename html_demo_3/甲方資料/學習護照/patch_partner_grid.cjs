const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="flex flex-wrap gap-2">
                          {['自己完成', '家屬陪伴', '多功能型照顧服務員', '醫療團隊'].map(partner => {
                            const isSelected = taskPartners[task.id]?.includes(partner);
                            return (
                              <button
                                key={partner}
                                onClick={(e) => { e.stopPropagation(); playClickSound(); togglePartner(task.id, partner); }}
                                className={\`px-3 py-1.5 rounded-full text-xs font-bold transition-all \${
                                  isSelected 
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-sm' 
                                    : 'bg-stone-50 text-stone-500 border-2 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                                }\`}
                              >
                                {partner}
                              </button>`;

const replacement = `<div className="grid grid-cols-2 gap-2">
                          {['自己完成', '家屬陪伴', '多功能型照顧服務員', '醫療團隊'].map(partner => {
                            const isSelected = taskPartners[task.id]?.includes(partner);
                            return (
                              <button
                                key={partner}
                                onClick={(e) => { e.stopPropagation(); playClickSound(); togglePartner(task.id, partner); }}
                                className={\`w-full py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center text-center \${
                                  isSelected 
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-sm' 
                                    : 'bg-stone-50 text-stone-500 border-2 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                                }\`}
                              >
                                {partner}
                              </button>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
