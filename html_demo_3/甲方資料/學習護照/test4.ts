let currentMainCount = 98;
let targetCount = 0;
if (currentMainCount < 48) targetCount = 48;
else if (currentMainCount < 98) targetCount = 98;
else if (currentMainCount < 148) targetCount = 148;
else targetCount = 0;
console.log(targetCount);
