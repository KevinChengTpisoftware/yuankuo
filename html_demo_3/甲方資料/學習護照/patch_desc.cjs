const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `activeCategory === '樂' ? '休閒職能的重建。最重要的不是永無止境的運動，而是「找回快樂的能力」。' :
                '累積完成 120 項以上任務，解鎖最終白金成就，光榮退役！'}`;

const replacement = `activeCategory === '樂' ? '休閒職能的重建。最重要的不是永無止境的運動，而是「找回快樂的能力」。' :
                 activeCategory === '選修' ? '持續學習，持續健康。可依照自身需求，自由參與各項健康教育、照護訓練及生活促進活動。' :
                '累積完成 120 項以上任務，解鎖最終白金成就，光榮退役！'}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
