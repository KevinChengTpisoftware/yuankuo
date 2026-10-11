const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldShareHtml = `{/* Share Card (Hidden) */}
              {shareData && (
                <div className="absolute -left-[9999px] top-0">
                  <div ref={shareCardRef} className="w-[400px] bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-3xl border border-yellow-200/50 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-6 drop-shadow-md">{shareData.icon}</div>
                    <div className="text-2xl font-black text-yellow-900 tracking-wider mb-2">{shareData.name}</div>
                    <div className="text-sm font-medium text-yellow-700/80 mb-6">{shareData.desc}</div>
                    
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent mb-6"></div>
                    
                    <div className="text-xs font-bold tracking-widest text-yellow-600/60 uppercase">
                      生活大師 • {shareData.date}
                    </div>
                  </div>
                </div>
              )}`;

const newShareHtml = `{/* Share Card (Hidden) */}
              {shareData && (
                <div className="absolute -left-[9999px] top-0">
                  <div ref={shareCardRef} className="w-[400px] p-8 flex flex-col items-center justify-center text-center" style={{ background: 'linear-gradient(to bottom right, #fefce8, #fff7ed)', borderRadius: '1.5rem', border: '1px solid rgba(254, 240, 138, 0.5)' }}>
                    <div className="text-6xl mb-6" style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.07))' }}>{shareData.icon}</div>
                    <div className="text-2xl font-black tracking-wider mb-2" style={{ color: '#713f12' }}>{shareData.name}</div>
                    <div className="text-sm font-medium mb-6" style={{ color: 'rgba(161, 98, 7, 0.8)' }}>{shareData.desc}</div>
                    
                    <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, #fde047, transparent)' }}></div>
                    
                    <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(202, 138, 4, 0.6)' }}>
                      生活大師 • {shareData.date}
                    </div>
                  </div>
                </div>
              )}`;

code = code.replace(oldShareHtml, newShareHtml);

const oldShareJS = `          const canvas = await html2canvas(shareCardRef.current, { backgroundColor: null, scale: 2 });
          const dataUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = \`成就達成_\${badge.name}.png\`;
          a.click();
          setShareData(null);`;

const newShareJS = `          const canvas = await html2canvas(shareCardRef.current, { backgroundColor: null, scale: 2 });
          const dataUrl = canvas.toDataURL('image/png');
          
          if (navigator.share) {
             try {
                // Convert base64 to blob
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], \`成就達成_\${badge.name}.png\`, { type: 'image/png' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                    title: '生活大師解鎖成就！',
                    text: \`我在「生活功能解鎖護照」獲得了「\${badge.name}」成就！\`,
                    files: [file]
                  });
                } else {
                  // Fallback to download if cannot share file
                  const a = document.createElement('a');
                  a.href = dataUrl;
                  a.download = \`成就達成_\${badge.name}.png\`;
                  a.click();
                }
             } catch (err) {
                console.error("Share failed", err);
                // Fallback to download
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = \`成就達成_\${badge.name}.png\`;
                a.click();
             }
          } else {
             const a = document.createElement('a');
             a.href = dataUrl;
             a.download = \`成就達成_\${badge.name}.png\`;
             a.click();
          }
          setShareData(null);`;

code = code.replace(oldShareJS, newShareJS);

fs.writeFileSync('src/App.tsx', code);
