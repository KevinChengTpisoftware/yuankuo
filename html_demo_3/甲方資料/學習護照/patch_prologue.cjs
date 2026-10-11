const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      if (showPrologue) {
        text = \`歡迎來到「靈魂之心」。

這裡是「員郭村」中，專為勇者們重建力量的庇護所。

堅韌的勇者【\${patientName || '冒險者'}】啊，
導師將這本《生活功能解鎖護照》交給了你。

唯有通過「食、衣、住、行、育、樂」六大試煉，
才能點亮被封印的技能樹，找回曾經的自由與榮耀。

準備好迎接挑戰了嗎？\`;`;

const replacement = `      if (showPrologue) {
        text = \`歡迎來到「靈魂之心」。

這裡曾經是充滿歡笑的地方，但一場名為「失能」的風暴席捲了這裡。

在神秘光芒的引領下，來到了「YK未來室」，專為勇者們重建力量的庇護所。

堅韌的勇者【\${patientName || '冒險者'}】啊，
導師將這本《生活功能解鎖護照》交給了你。

唯有通過「食、衣、住、行、育、樂」六大試煉，
才能點亮被封印的技能樹，找回曾經的自由與榮耀。

準備好迎接挑戰了嗎？\`;`;

code = code.replace(target, replacement);


const target2 = `                  if (showPrologue) {
                    text = \`歡迎來到「靈魂之心」。

這裡是「員郭村」中，專為勇者們重建力量的庇護所。

堅韌的勇者【\${patientName || '冒險者'}】啊，
導師將這本《生活功能解鎖護照》交給了你。

唯有通過「食、衣、住、行、育、樂」六大試煉，
才能點亮被封印的技能樹，找回曾經的自由與榮耀。

準備好迎接挑戰了嗎？\`;`;

const replacement2 = `                  if (showPrologue) {
                    text = \`歡迎來到「靈魂之心」。

這裡曾經是充滿歡笑的地方，但一場名為「失能」的風暴席捲了這裡。

在神秘光芒的引領下，來到了「YK未來室」，專為勇者們重建力量的庇護所。

堅韌的勇者【\${patientName || '冒險者'}】啊，
導師將這本《生活功能解鎖護照》交給了你。

唯有通過「食、衣、住、行、育、樂」六大試煉，
才能點亮被封印的技能樹，找回曾經的自由與榮耀。

準備好迎接挑戰了嗎？\`;`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
