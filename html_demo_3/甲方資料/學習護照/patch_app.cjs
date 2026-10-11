const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch 1
code = code.replace(
  `import { startBGM, stopBGM, playClickSound, toggleMute } from "./lib/audio";`,
  `import { startBGM, stopBGM, playClickSound, toggleMute, setMasterVolume } from "./lib/audio";`
);

// Patch 2
code = code.replace(
  `const [isMuted, setIsMuted] = useState(false);`,
  `const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);`
);

// Patch 3
const oldUseEffect = `  useEffect(() => {
    if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      stopBGM();
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };
  }, [showPrologue, milestoneStory]);`;

const newUseEffect = `  useEffect(() => {
    if (!isBookOpen) {
      stopBGM();
      return;
    }
    
    if (showPrologue) {
      startBGM('prologue');
    } else if (milestoneStory) {
      startBGM('milestone');
    } else {
      startBGM('main');
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };
  }, [showPrologue, milestoneStory, isBookOpen]);`;

code = code.replace(oldUseEffect, newUseEffect);

// Patch 4
const oldExportMenu = `              <div className="px-6 pb-6 space-y-2">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">資料匯出</div>
                <button
                  onClick={() => {
                    handleExport();`;

const newExportMenu = `              <div className="px-6 pb-6 space-y-6">
                <div>
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">系統設定</div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-3">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-stone-500" />}
                      <span className="font-bold text-sm text-stone-700 w-12">音量</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          setMasterVolume(v);
                          if (v > 0 && isMuted) {
                             setIsMuted(false);
                             toggleMute(false);
                          } else if (v === 0 && !isMuted) {
                             setIsMuted(true);
                             toggleMute(true);
                          }
                        }}
                        className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">資料匯出</div>
                  <button
                    onClick={() => {
                      handleExport();`;

code = code.replace(oldExportMenu, newExportMenu);

// Fix missing </div> for export menu section
code = code.replace(
`                  <span className="font-bold text-sm">匯出存檔 (JSON)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>`,
`                  <span className="font-bold text-sm">匯出存檔 (JSON)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>`
);

fs.writeFileSync('src/App.tsx', code);
