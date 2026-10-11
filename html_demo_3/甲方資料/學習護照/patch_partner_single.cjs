const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Change State Type
code = code.replace(
  'const [taskPartners, setTaskPartners] = useState<Record<number, string[]>>({});',
  'const [taskPartners, setTaskPartners] = useState<Record<number, string>>({});'
);

// 2. Change togglePartner function
const oldToggle = `  const togglePartner = (taskId: number, partner: string) => {
    setTaskPartners(prev => {
      const currentPartners = prev[taskId] || [];
      if (currentPartners.includes(partner)) {
        return {
          ...prev,
          [taskId]: currentPartners.filter(p => p !== partner)
        };
      } else {
        return {
          ...prev,
          [taskId]: [...currentPartners, partner]
        };
      }
    });
  };`;

const newToggle = `  const togglePartner = (taskId: number, partner: string) => {
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
code = code.replace(oldToggle, newToggle);

// 3. Change UI rendering
const oldUI = `                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">共學夥伴 (可複選)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['自己完成', '家屬陪伴', '多功能型照顧服務員', '醫療團隊'].map(partner => {
                            const isSelected = (taskPartners[task.id] || []).includes(partner);`;

const newUI = `                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">共學夥伴</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['自己完成', '家屬陪伴', '多功能型照顧服務員', '醫療團隊'].map(partner => {
                            const isSelected = taskPartners[task.id] === partner;`;
code = code.replace(oldUI, newUI);

fs.writeFileSync('src/App.tsx', code);
