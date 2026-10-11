const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (activeCategory === '全部') {
      if (isPlatinumComplete && !prev.platinum) {
        setCelebrateTier('platinum');
      }
    } else {
      if (isBronzeComplete && !prev.bronze) {
        setCelebrateTier('bronze');
      } else if (isSilverComplete && !prev.silver) {
        setCelebrateTier('silver');
      } else if (isGoldComplete && !prev.gold) {
        setCelebrateTier('gold');
      }
    }`;

const replacement = `    if (activeCategory === '全部') {
      if (isPlatinumComplete && !prev.platinum) {
        setCelebrateTier('platinum');
      }
    } else if (activeCategory !== '選修') {
      if (isBronzeComplete && !prev.bronze) {
        setCelebrateTier('bronze');
      } else if (isSilverComplete && !prev.silver) {
        setCelebrateTier('silver');
      } else if (isGoldComplete && !prev.gold) {
        setCelebrateTier('gold');
      }
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
