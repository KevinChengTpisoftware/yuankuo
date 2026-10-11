const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    // Cleanup on unmount or when dependencies change
    return () => {
      stopBGM(true);
    };
    if (showPrologue || milestoneStory) {`;

const replacement = `    if (showPrologue || milestoneStory) {`;

code = code.replace(target, replacement);

const target2 = `        if (i >= text.length) {
          clearInterval(timer);
          setIsTypingComplete(true);
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [showPrologue, milestoneStory, patientName]);`;

const replacement2 = `        if (i >= text.length) {
          clearInterval(timer);
          setIsTypingComplete(true);
        }
      }, 50);

      return () => {
        clearInterval(timer);
        stopBGM(true);
      };
    }
    
    return () => {
      stopBGM(true);
    };
  }, [showPrologue, milestoneStory, patientName]);`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
