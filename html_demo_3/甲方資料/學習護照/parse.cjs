const fs = require('fs');

const data = fs.readFileSync('raw_tasks.txt', 'utf8');
const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const tasks = [];
let currentCategory = '';
let currentTier = '';
let currentPhase = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const catMatch = line.match(/創意護照：【(.*?)[：:](.*?)】/);
  if (catMatch) {
    currentCategory = catMatch[1].trim();
    currentPhase = '';
    continue;
  }
  
  const platMatch = line.match(/白金獎盃.*\s*【#150\s+(.*?)】/);
  if (platMatch) {
    tasks.push({
      id: 150,
      category: '全部',
      tier: 'platinum',
      phase: '白金成就',
      title: platMatch[1].trim(),
      description: '在 180 天的 PAC 旅程結束時，累積解鎖上述 150 項任務中的 120 項以上。在賦健基地舉辦白金獎盃頒發儀式，貼在名人堂榮譽牆上！'
    });
    break;
  }

  const tierMatch = line.match(/(銅|銀|金)盃任務/);
  if (tierMatch) {
    const map = { '銅': 'bronze', '銀': 'silver', '金': 'gold' };
    currentTier = map[tierMatch[1]];
    if (currentTier !== 'bronze') {
      currentPhase = ''; 
    }
    continue;
  }

  const phaseMatch = line.match(/^[•o]\s*(階段\s*[A-Z]：.*)/);
  if (phaseMatch) {
    currentPhase = phaseMatch[1].trim();
    continue;
  }

  const taskMatch = line.match(/^[•o]\s*#(\d{3})\s*【([^】]+)】[：:](.*)/);
  if (taskMatch) {
    const id = parseInt(taskMatch[1], 10);
    const title = taskMatch[2].trim();
    let desc = taskMatch[3].trim();
    
    if (desc === '') {
      if (i + 1 < lines.length && lines[i+1].includes('任務內容：')) {
        desc = lines[i+1].replace(/^[•o]\s*任務內容：\s*/, '').trim();
        i++;
      }
    }
    
    tasks.push({
      id,
      category: currentCategory || '食',
      tier: currentTier,
      phase: currentPhase,
      title,
      description: desc
    });
    continue;
  }
  
  // also check without 0-padded for some tasks?
  const taskMatchNoZero = line.match(/^[•o]\s*#(\d+)\s*【([^】]+)】[：:](.*)/);
  if (taskMatchNoZero && !taskMatch) {
    const id = parseInt(taskMatchNoZero[1], 10);
    const title = taskMatchNoZero[2].trim();
    let desc = taskMatchNoZero[3].trim();
    
    if (desc === '') {
      if (i + 1 < lines.length && lines[i+1].includes('任務內容：')) {
        desc = lines[i+1].replace(/^[•o]\s*任務內容：\s*/, '').trim();
        i++;
      }
    }
    
    tasks.push({
      id,
      category: currentCategory || '食',
      tier: currentTier,
      phase: currentPhase,
      title,
      description: desc
    });
    continue;
  }
}

fs.writeFileSync('src/data.ts', `
import { Task } from './types';

export const TASKS: Task[] = ${JSON.stringify(tasks, null, 2)};
`);
console.log('Total tasks parsed:', tasks.length);
