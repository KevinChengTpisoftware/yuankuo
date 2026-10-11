const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetConfetti = `      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34d399', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e']
      });`;

const replacementConfetti = `      const task = TASKS.find(t => t.id === taskId);
      const isHighTier = task?.tier === 'gold' || task?.tier === 'platinum';

      if (isHighTier) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF8C00', '#ffffff'],
          shapes: ['star', 'circle'],
          ticks: 300,
          gravity: 0.7,
          scalar: 1.2
        });
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#ffffff'],
            ticks: 250
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#ffffff'],
            ticks: 250
          });
        }, 150);
      } else {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34d399', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e']
        });
      }`;

code = code.replace(targetConfetti, replacementConfetti);


const targetMotionDiv = `                    {/* Completion Overlay effect */}
                    <AnimatePresence>
                      {isCompleted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 3, rotate: -25 }}
                          animate={{ opacity: 1, scale: 1, rotate: -15 }}
                          exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25 
                          }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
                        >`;

const replacementMotionDiv = `                    {/* Completion Overlay effect */}
                    <AnimatePresence>
                      {isCompleted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 3, rotate: -25 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            rotate: -15,
                            ...( (task.tier === 'gold' || task.tier === 'platinum') ? {
                              x: [0, -3, 3, -3, 3, 0],
                              y: [0, 3, -3, 3, -3, 0]
                            } : {})
                          }}
                          exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25,
                            ...( (task.tier === 'gold' || task.tier === 'platinum') ? {
                              x: { duration: 0.3, delay: 0.2, repeat: 1 },
                              y: { duration: 0.3, delay: 0.2, repeat: 1 }
                            } : {})
                          }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
                        >`;

code = code.replace(targetMotionDiv, replacementMotionDiv);
fs.writeFileSync('src/App.tsx', code);
