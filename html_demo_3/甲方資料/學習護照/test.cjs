const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');
const match = code.match(/export const TASKS: Task\[\] = \[(.+)\];/s);
if (match) {
    console.log("Tasks found!");
} else {
    console.log("Not found");
}
