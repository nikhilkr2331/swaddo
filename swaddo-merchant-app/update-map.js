const fs = require('fs');
const file = 'src/app/profile/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /options=\{\{ disableDefaultUI: true \}\}/,
    `options={{ disableDefaultUI: true, gestureHandling: 'greedy', keyboardShortcuts: false }}`
);

fs.writeFileSync(file, code);
console.log('Successfully updated map options for draggable capability');
