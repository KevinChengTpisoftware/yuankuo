const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (activeCategory === '全部') {
      const overallBronze = TASKS.filter(t => t.tier === 'bronze');
      const overallSilver = TASKS.filter(t => t.tier === 'silver');
      const overallGold = TASKS.filter(t => t.tier === 'gold');`;

const replacement = `    if (activeCategory === '全部') {
      const overallBronze = TASKS.filter(t => t.tier === 'bronze' && t.category !== '選修');
      const overallSilver = TASKS.filter(t => t.tier === 'silver' && t.category !== '選修');
      const overallGold = TASKS.filter(t => t.tier === 'gold' && t.category !== '選修');`;

code = code.replace(target, replacement);

const target2 = `    } else {
      statsText = \`[進度摘要 (目前領域: \${activeCategory})]
🏆 銅盃：\${bronzeCompleted}/\${bronzeCount}
🏆 銀盃：\${silverCompleted}/\${silverCount}
🏆 金盃：\${goldCompleted}/\${goldCount}\`;
    }

    const text = \`【生活功能解鎖護照】進度回報
總達成率：\${totalProgressPercentage}% (\${overallCompleted}/\${mainTasks.length})

\${statsText}`;

const replacement2 = `    } else if (activeCategory === '選修') {
      statsText = \`[進度摘要 (目前領域: \${activeCategory})]
🥇 健康學習徽章：\${electiveCompleted} 枚\`;
    } else {
      statsText = \`[進度摘要 (目前領域: \${activeCategory})]
🏆 銅盃：\${bronzeCompleted}/\${bronzeCount}
🏆 銀盃：\${silverCompleted}/\${silverCount}
🏆 金盃：\${goldCompleted}/\${goldCount}\`;
    }

    const text = \`【生活功能解鎖護照】進度回報
總達成率：\${totalProgressPercentage}% (\${overallCompleted}/\${mainTasks.length})
🥇 健康學習徽章：\${electiveCompleted} 枚

\${statsText}`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
