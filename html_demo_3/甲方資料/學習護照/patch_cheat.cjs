const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateHookMatch = `  const prevCategoryRef = useRef<Category>('食');`;
const stateHookReplacement = `  const prevCategoryRef = useRef<Category>('食');
  const [cheatClicks, setCheatClicks] = useState(0);
  const cheatTimeoutRef = useRef<any>(null);

  const handleCheatClick = () => {
    setCheatClicks(prev => {
      const next = prev + 1;
      if (next >= 15) {
        // Trigger cheat
        setCompletedTasks(currentTasks => {
          const mainTasks = TASKS.filter(t => t.category !== '選修');
          const currentMainCount = Array.from(currentTasks).filter(id => {
            const t = TASKS.find(x => x.id === id);
            return t && t.category !== '選修';
          }).length;
          
          let targetCount = 0;
          // Jump to 49 (1 click away from 50/33%), 99 (1 click from 100/66%), 149 (1 click from 150/100%), then 0.
          if (currentMainCount < 49) targetCount = 49;
          else if (currentMainCount < 99) targetCount = 99;
          else if (currentMainCount < 149) targetCount = 149;
          else targetCount = 0;

          if (targetCount === 0) {
            setSeenMilestones(new Set());
            localStorage.removeItem('passport_seen_milestones');
            return new Set(Array.from(currentTasks).filter(id => {
              const t = TASKS.find(x => x.id === id);
              return t && t.category === '選修';
            })); // Keep elective tasks only
          } else {
            const nextTasks = new Set(currentTasks);
            // clear main tasks
            for (const t of mainTasks) {
              nextTasks.delete(t.id);
            }
            // add up to targetCount
            for (let i = 0; i < targetCount; i++) {
              nextTasks.add(mainTasks[i].id);
            }
            return nextTasks;
          }
        });
        return 0;
      }
      return next;
    });

    if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
    cheatTimeoutRef.current = setTimeout(() => {
      setCheatClicks(0);
    }, 1000);
  };`;

code = code.replace(stateHookMatch, stateHookReplacement);

const headerMatch = `<header className="bg-[#FCFAF5] shadow-sm border-b border-stone-200">`;
const headerReplacement = `<header 
          className="bg-[#FCFAF5] shadow-sm border-b border-stone-200 transition-colors"
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== 'BUTTON') {
              handleCheatClick();
            }
          }}
          style={{ backgroundColor: cheatClicks > 0 ? \`rgba(252, 250, 245, \${1 - cheatClicks * 0.05})\` : undefined }}
        >`;

code = code.replace(headerMatch, headerReplacement);

fs.writeFileSync('src/App.tsx', code);
