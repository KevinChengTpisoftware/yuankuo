const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const platinumCompleted = TASKS.filter(t => t.tier === 'platinum' && completedTasks.has(t.id)).length;

  const totalProgress = Math.round((completedTasks.size / TASKS.length) * 100);`;

const replacement1 = `  const platinumCompleted = TASKS.filter(t => t.tier === 'platinum' && completedTasks.has(t.id)).length;

  const mainTasks = TASKS.filter(t => t.category !== '選修');
  const mainCompleted = Array.from(completedTasks).filter(id => {
    const task = TASKS.find(t => t.id === id);
    return task && task.category !== '選修';
  });
  const electiveCompleted = Array.from(completedTasks).filter(id => {
    const task = TASKS.find(t => t.id === id);
    return task && task.category === '選修';
  }).length;

  const totalProgress = Math.round((mainCompleted.length / mainTasks.length) * 100);`;

code = code.replace(target1, replacement1);

const target2 = `  const overallCompleted = completedTasks.size;
  const overallRemaining = TASKS.length - overallCompleted;
  const totalProgressPercentage = Math.round((overallCompleted / TASKS.length) * 100);`;

const replacement2 = `  const overallCompleted = mainCompleted.length;
  const overallRemaining = mainTasks.length - overallCompleted;
  const totalProgressPercentage = Math.round((overallCompleted / mainTasks.length) * 100);`;

code = code.replace(target2, replacement2);

const target3 = `總達成率：\${totalProgressPercentage}% (\${completedTasks.size}/\${TASKS.length})`;
const replacement3 = `總達成率：\${totalProgressPercentage}% (\${overallCompleted}/\${mainTasks.length})`;
code = code.replace(target3, replacement3);

const target4 = `<div className="text-lg md:text-2xl font-bold text-emerald-700 leading-none mb-1">{completedTasks.size}/{TASKS.length}</div>`;
const replacement4 = `<div className="text-lg md:text-2xl font-bold text-emerald-700 leading-none mb-1">{overallCompleted}/{mainTasks.length}</div>`;
code = code.replace(target4, replacement4);

const target5 = `<div className={\`text-4xl font-black mb-2 \${t.badge1Text}\`}>{completedTasks.size}</div>`;
const replacement5 = `<div className={\`text-4xl font-black mb-2 \${t.badge1Text}\`}>{overallCompleted}</div>`;
code = code.replace(target5, replacement5);

fs.writeFileSync('src/App.tsx', code);
