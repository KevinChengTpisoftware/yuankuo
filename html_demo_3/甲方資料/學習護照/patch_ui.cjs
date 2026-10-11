const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                        <p className={\`text-sm leading-relaxed transition-colors \${isCompleted ? 'text-stone-400' : 'text-stone-600'}\`}>
                          {task.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Completion Overlay effect */}`;

const replacement = `                        <p className={\`text-sm leading-relaxed transition-colors \${isCompleted ? 'text-stone-400' : 'text-stone-600'}\`}>
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {isCompleted && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-emerald-100/50 relative z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">共學夥伴 (可複選)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['自己完成', '家屬陪伴', '多功能型照顧服務員', '醫療團隊'].map(partner => {
                            const isSelected = (taskPartners[task.id] || []).includes(partner);
                            return (
                              <button
                                key={partner}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePartner(task.id, partner);
                                }}
                                className={\`px-3 py-1.5 rounded-full text-xs font-bold transition-all \${
                                  isSelected 
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-sm' 
                                    : 'bg-stone-50 text-stone-500 border-2 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                                }\`}
                              >
                                {partner}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Completion Overlay effect */}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
