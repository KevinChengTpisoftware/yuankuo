import { TASKS } from './src/data';
console.log("Total:", TASKS.length);
console.log("Main:", TASKS.filter(t => t.category !== '選修').length);
