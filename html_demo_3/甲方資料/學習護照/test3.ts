import { TASKS } from './src/data';
const mainTasks = TASKS.filter(t => t.category !== '選修');
console.log("Main Tasks length:", mainTasks.length);
