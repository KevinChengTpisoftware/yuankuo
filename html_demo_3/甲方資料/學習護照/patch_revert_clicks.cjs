const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'onClick={() => { playClickSound(); toggleTask(task.id); }}',
  'onClick={() => toggleTask(task.id)}'
);

code = code.replace(
  'onClick={(e) => { playClickSound(); handleSpeakText(e, task.title, task.description); }}',
  'onClick={(e) => handleSpeakText(e, task.title, task.description)}'
);

code = code.replace(
  'onClick={() => { playClickSound(); handleExport(); setTimeout(() => setShowMenuModal(false), 1500); }}',
  `onClick={() => {
                    handleExport();
                    setTimeout(() => setShowMenuModal(false), 1500);
                  }}`
);

code = code.replace(
  'onClick={() => { playClickSound(); handleExportJSON(); setShowMenuModal(false); }}',
  `onClick={() => {
                    handleExportJSON();
                    setShowMenuModal(false);
                  }}`
);

fs.writeFileSync('src/App.tsx', code);
