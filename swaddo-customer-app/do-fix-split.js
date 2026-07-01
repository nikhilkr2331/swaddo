const fs = require('fs');
const file = 'src/components/LocationSelector.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /let locationName = result\.mainText \|\| result\.description\.split\(","\)\[0\];/,
    `let locationName = result.mainText || (result.description ? result.description.split(",")[0] : (result.title || "Location"));`
);

fs.writeFileSync(file, code);
console.log('Fixed undefined split');
