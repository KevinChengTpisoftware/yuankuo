const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const headEnd = '</head>';
const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Noto+Serif+TC:wght@400;500;700;900&display=swap" rel="stylesheet">
  </head>`;

code = code.replace(headEnd, fontLinks);
fs.writeFileSync('index.html', code);

let cssCode = fs.readFileSync('src/index.css', 'utf8');
const newCssCode = `@import "tailwindcss";

@theme {
  --font-sans: "Noto Sans TC", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-serif: "Noto Serif TC", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}
`;
fs.writeFileSync('src/index.css', newCssCode);
