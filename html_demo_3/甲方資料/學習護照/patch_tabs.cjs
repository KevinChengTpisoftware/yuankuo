const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          {activeCategory !== '全部' ? (
            <>
              <TierTab 
                tier="bronze" `;

const replacement = `          {activeCategory !== '全部' && activeCategory !== '選修' ? (
            <>
              <TierTab 
                tier="bronze" `;

code = code.replace(target, replacement);

const target2 = `const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: '食', label: '食：米其林大廚', icon: '🍳' },
  { id: '衣', label: '衣：時尚伸展台', icon: '👕' },
  { id: '住', label: '住：住宅改造王', icon: '🏡' },
  { id: '行', label: '行：拓荒者行動', icon: '🚶' },
  { id: '育', label: '育：知性研究所', icon: '🧠' },
  { id: '樂', label: '樂：開心農場', icon: '🌱' },
  { id: '全部', label: '白金成就', icon: '👑' },
];`;

const replacement2 = `const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: '食', label: '食：米其林大廚', icon: '🍳' },
  { id: '衣', label: '衣：時尚伸展台', icon: '👕' },
  { id: '住', label: '住：住宅改造王', icon: '🏡' },
  { id: '行', label: '行：拓荒者行動', icon: '🚶' },
  { id: '育', label: '育：知性研究所', icon: '🧠' },
  { id: '樂', label: '樂：開心農場', icon: '🌱' },
  { id: '選修', label: '選修：學習徽章', icon: '🥇' },
  { id: '全部', label: '白金成就', icon: '👑' },
];`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
