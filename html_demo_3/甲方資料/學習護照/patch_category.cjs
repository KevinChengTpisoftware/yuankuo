const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  // If we change category and current active tier is not available, default to the first one available
  useEffect(() => {
    if (activeCategory === '全部') {
      setActiveTier('platinum');
    } else if (activeTier === 'platinum') {
      setActiveTier('bronze');
    }
  }, [activeCategory, activeTier]);`;

const replacement = `  // Reset to bronze when switching categories
  useEffect(() => {
    if (activeCategory === '全部') {
      setActiveTier('platinum');
    } else {
      setActiveTier('bronze');
    }
  }, [activeCategory]);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
