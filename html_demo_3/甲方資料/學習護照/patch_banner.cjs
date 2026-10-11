const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{/* Task List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">`;

const replacement = `{/* Task List */}
        {activeCategory === '選修' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-2">
              <span className="text-2xl">🥇</span>
              健康學習徽章 (選修)
            </h3>
            <p className="text-amber-800 font-medium text-lg">
              健康學習徽章： <span className="text-2xl ml-1 text-amber-600">⭐ x {electiveCompleted} 枚</span>
            </p>
          </div>
        )}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
