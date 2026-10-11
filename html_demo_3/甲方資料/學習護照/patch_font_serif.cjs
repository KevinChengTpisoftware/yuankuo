const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const classicWrapperMatch = 'wrapper: "bg-[#FCFAF5] p-8 md:p-12 rounded-2xl shadow-sm border-[12px] border-double border-emerald-100 relative overflow-hidden text-center min-h-[600px] flex flex-col justify-center print:shadow-none print:border-[8px]",';
const classicWrapperReplacement = 'wrapper: "bg-[#FCFAF5] p-8 md:p-12 rounded-2xl shadow-sm border-[12px] border-double border-emerald-100 relative overflow-hidden text-center min-h-[600px] flex flex-col justify-center font-serif print:shadow-none print:border-[8px]",';
code = code.replace(classicWrapperMatch, classicWrapperReplacement);

const elegantWrapperMatch = 'wrapper: "bg-[#FAFAFA] p-8 md:p-12 rounded-2xl shadow-md border-[8px] border-slate-800 relative overflow-hidden text-center min-h-[600px] flex flex-col justify-center print:shadow-none print:border-4 print:border-slate-800",';
const elegantWrapperReplacement = 'wrapper: "bg-[#FAFAFA] p-8 md:p-12 rounded-2xl shadow-md border-[8px] border-slate-800 relative overflow-hidden text-center min-h-[600px] flex flex-col justify-center font-serif print:shadow-none print:border-4 print:border-slate-800",';
code = code.replace(elegantWrapperMatch, elegantWrapperReplacement);

const vibrantWrapperMatch = 'wrapper: "bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-8 md:p-12 rounded-2xl shadow-lg border border-indigo-100 relative overflow-hidden text-center min-h-[600px] flex flex-col justify-center print:shadow-none print:border-none",';
const vibrantWrapperReplacement = 'wrapper: "bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-8 md:p-12 rounded-2xl shadow-lg border border-indigo-100 relative overflow-hidden text-center min-h-[600px] flex flex-col justify-center font-serif print:shadow-none print:border-none",';
code = code.replace(vibrantWrapperMatch, vibrantWrapperReplacement);

fs.writeFileSync('src/App.tsx', code);
