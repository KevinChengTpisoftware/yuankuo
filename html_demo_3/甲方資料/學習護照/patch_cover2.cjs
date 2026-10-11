const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      {!isBookOpen ? (
        <motion.div 
          key="cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="min-h-screen bg-[#F4F0E6] flex items-center justify-center p-4 md:p-8 perspective-[2000px]"
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            exit={{ rotateY: -110, x: "-30%", scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ transformOrigin: "left center" }}
            className="max-w-md w-full bg-emerald-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-950 relative"
          >`;

const replacement = `      {!isBookOpen ? (
        <motion.div 
          key="cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeIn" }}
          className="min-h-screen bg-[#F4F0E6] flex items-center justify-center p-4 md:p-8 perspective-[1500px]"
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            exit={{ 
              rotateY: -140, 
              rotateZ: -5,
              skewY: 15,
              x: "-40%", 
              scale: 1.1, 
              opacity: 0,
              filter: "blur(4px)"
            }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left center" }}
            className="max-w-md w-full bg-emerald-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-950 relative"
          >`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
