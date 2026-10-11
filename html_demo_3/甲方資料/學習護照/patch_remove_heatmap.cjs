const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove heatmapData
code = code.replace(/  const heatmapData = useMemo\(\(\) => \{[\s\S]*?\}, \[completedTasks\.size\]\);\n\n/, '');

// Remove the Heatmap JSX
const heatmapJSXMatch = `                {/* Heatmap */}
                <div className="bg-[#FCFAF5] p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    復健熱力圖 (近 28 天)
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-7 gap-2 mb-1 text-center text-xs font-bold text-stone-400">
                      <div>一</div>
                      <div>二</div>
                      <div>三</div>
                      <div>四</div>
                      <div>五</div>
                      <div>六</div>
                      <div>日</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {heatmapData.map((count, i) => {
                        let bgClass = "bg-stone-100";
                        if (count === 1) bgClass = "bg-emerald-200";
                        else if (count === 2) bgClass = "bg-emerald-300";
                        else if (count === 3) bgClass = "bg-emerald-400";
                        else if (count >= 4) bgClass = "bg-emerald-500";

                        return (
                          <motion.div 
                            key={i} 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.02 }}
                            className={\`w-full aspect-square rounded-lg \${bgClass} transition-colors duration-500 flex items-center justify-center relative overflow-hidden\`} 
                            title={count > 0 ? \`完成 \${count} 次任務\` : '無紀錄'} 
                          >
                            {count > 0 && (
                              <span className="text-sm font-bold text-emerald-950/40 select-none">
                                {count}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2 text-xs text-stone-500 font-medium">
                      <span>少</span>
                      <div className="w-3 h-3 rounded-sm bg-stone-100" />
                      <div className="w-3 h-3 rounded-sm bg-emerald-200" />
                      <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                      <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                      <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                      <span>多</span>
                    </div>
                  </div>
                </div>`;

code = code.replace(heatmapJSXMatch, '');

fs.writeFileSync('src/App.tsx', code);
