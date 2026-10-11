const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const [taskPartners, setTaskPartners] = useState<Record<number, string>>({});',
  'const [taskPartners, setTaskPartners] = useState<Record<number, string[]>>({});'
);

const savedPartnersMatch = `    const savedPartners = localStorage.getItem('passport_task_partners');
    if (savedPartners) {
      try {
        setTaskPartners(JSON.parse(savedPartners));
      } catch (e) {
      }
    }`;
const newSavedPartnersMatch = `    const savedPartners = localStorage.getItem('passport_task_partners');
    if (savedPartners) {
      try {
        const parsed = JSON.parse(savedPartners);
        const migrated: Record<number, string[]> = {};
        for (const key in parsed) {
          if (Array.isArray(parsed[key])) {
            migrated[key] = parsed[key];
          } else if (typeof parsed[key] === 'string') {
            migrated[key] = [parsed[key]];
          }
        }
        setTaskPartners(migrated);
      } catch (e) {
      }
    }`;
code = code.replace(savedPartnersMatch, newSavedPartnersMatch);

const toggleMatch = `  const togglePartner = (taskId: number, partner: string) => {
    setTaskPartners(prev => {
      if (prev[taskId] === partner) {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
      return {
        ...prev,
        [taskId]: partner
      };
    });
  };`;
const newToggleMatch = `  const togglePartner = (taskId: number, partner: string) => {
    setTaskPartners(prev => {
      const currentPartners = prev[taskId] || [];
      const newPartners = currentPartners.includes(partner)
        ? currentPartners.filter(p => p !== partner)
        : [...currentPartners, partner];
      
      if (newPartners.length === 0) {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
      
      return {
        ...prev,
        [taskId]: newPartners
      };
    });
  };`;
code = code.replace(toggleMatch, newToggleMatch);

const isSelectedMatch = `const isSelected = taskPartners[task.id] === partner;`;
const newIsSelectedMatch = `const isSelected = taskPartners[task.id]?.includes(partner);`;
code = code.replace(isSelectedMatch, newIsSelectedMatch);

fs.writeFileSync('src/App.tsx', code);
