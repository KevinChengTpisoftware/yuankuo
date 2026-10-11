const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Category buttons
code = code.replace(
  /onClick=\{\(\) => setActiveCategory\(category\.id\)\}/g,
  'onClick={() => { playClickSound(); setActiveCategory(category.id); }}'
);

// Menu button
code = code.replace(
  /onClick=\{\(\) => setShowMenuModal\(true\)\}/g,
  'onClick={() => { playClickSound(); setShowMenuModal(true); }}'
);

// Trophy button
code = code.replace(
  /onClick=\{\(\) => setShowTrophyCabinet\(true\)\}/g,
  'onClick={() => { playClickSound(); setShowTrophyCabinet(true); }}'
);

// Task toggle
code = code.replace(
  /onClick=\{\(\) => toggleTask\(task\.id\)\}/g,
  'onClick={() => { playClickSound(); toggleTask(task.id); }}'
);

// Speaker button
code = code.replace(
  /onClick=\{\(e\) => handleSpeakText\(e, task\.title, task\.description\)\}/g,
  'onClick={(e) => { playClickSound(); handleSpeakText(e, task.title, task.description); }}'
);

// Menu items
code = code.replace(
  /onClick=\{\(\) => \{ setShowMenuModal\(false\); setIsBookOpen\(false\); \}\}/g,
  'onClick={() => { playClickSound(); setShowMenuModal(false); setIsBookOpen(false); }}'
);
code = code.replace(
  /onClick=\{\(\) => \{ setShowMenuModal\(false\); setShowStats\(true\); \}\}/g,
  'onClick={() => { playClickSound(); setShowMenuModal(false); setShowStats(true); }}'
);
code = code.replace(
  /onClick=\{\(\) => \{ setShowMenuModal\(false\); setShowTrophyCabinet\(true\); \}\}/g,
  'onClick={() => { playClickSound(); setShowMenuModal(false); setShowTrophyCabinet(true); }}'
);
code = code.replace(
  /onClick=\{\(\) => \{ setShowMenuModal\(false\); setShowCertificate\(true\); \}\}/g,
  'onClick={() => { playClickSound(); setShowMenuModal(false); setShowCertificate(true); }}'
);

// Export buttons
code = code.replace(
  /onClick=\{\(\) => \{\n\s*handleExport\(\);\n\s*setTimeout\(\(\) => setShowMenuModal\(false\), 1500\);\n\s*\}\}/g,
  'onClick={() => { playClickSound(); handleExport(); setTimeout(() => setShowMenuModal(false), 1500); }}'
);
code = code.replace(
  /onClick=\{\(\) => \{\n\s*handleExportJSON\(\);\n\s*setShowMenuModal\(false\);\n\s*\}\}/g,
  'onClick={() => { playClickSound(); handleExportJSON(); setShowMenuModal(false); }}'
);

// Partner toggle (inside the map)
code = code.replace(
  /onClick=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*togglePartner\(task\.id, partner\);\n\s*\}\}/g,
  'onClick={(e) => { e.stopPropagation(); playClickSound(); togglePartner(task.id, partner); }}'
);

// Trophy tabs
code = code.replace(
  /onClick=\{\(\) => setActiveTier\('bronze'\)\}/g,
  'onClick={() => { playClickSound(); setActiveTier(\\\'bronze\\\'); }}'.replace(/\\'/g, "'")
);
code = code.replace(
  /onClick=\{\(\) => setActiveTier\('silver'\)\}/g,
  'onClick={() => { playClickSound(); setActiveTier(\\\'silver\\\'); }}'.replace(/\\'/g, "'")
);
code = code.replace(
  /onClick=\{\(\) => setActiveTier\('gold'\)\}/g,
  'onClick={() => { playClickSound(); setActiveTier(\\\'gold\\\'); }}'.replace(/\\'/g, "'")
);
code = code.replace(
  /onClick=\{\(\) => setActiveTier\('platinum'\)\}/g,
  'onClick={() => { playClickSound(); setActiveTier(\\\'platinum\\\'); }}'.replace(/\\'/g, "'")
);

fs.writeFileSync('src/App.tsx', code);
