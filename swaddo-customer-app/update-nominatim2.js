const fs = require('fs');
const file = 'src/context/LocationContext.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /const detailedName = data\.display_name\.split\(\',\', 3\)\.map\(s => s\.trim\(\)\)\.slice\(0, 3\)\.join\(\', \'\);/,
    `// Prioritize local area names from address object
              const addr = data.address || {};
              const localArea = addr.neighbourhood || addr.suburb || addr.residential || addr.hamlet || addr.village || addr.road || data.display_name.split(',')[0];
              const cityStr = addr.city || addr.town || addr.county || '';
              const detailedName = cityStr && localArea !== cityStr ? \`\${localArea}, \${cityStr}\` : localArea;`
);

// Ah wait, my previous regex was: const detailedName = data.display_name.split(',').map(s => s.trim()).slice(0, 3).join(', ');
// Let's replace the whole block again.
code = code.replace(
    /const detailedName = data\.display_name\.split\(\',\', 3\)\.map\(s => s\.trim\(\)\)\.slice\(0, 3\)\.join\(\', \'\);/g, // if it was 3
    ''
);

// Wait, the previous block I injected was:
/*
            if (data && data.display_name) {
              // Extract the first 3 parts of the detailed address (usually building/road, area, city)
              const detailedName = data.display_name.split(',').map(s => s.trim()).slice(0, 3).join(', ');
              setCurrentLocation(detailedName);
            }
*/
const oldBlock = `if (data && data.display_name) {
              // Extract the first 3 parts of the detailed address (usually building/road, area, city)
              const detailedName = data.display_name.split(',').map(s => s.trim()).slice(0, 3).join(', ');
              setCurrentLocation(detailedName);
            }`;

const newBlock = `if (data && data.address) {
              const addr = data.address;
              const localArea = addr.neighbourhood || addr.suburb || addr.residential || addr.hamlet || addr.road || data.display_name.split(',')[0];
              const cityStr = addr.city || addr.town || addr.village || '';
              const detailedName = (cityStr && localArea && localArea !== cityStr) ? \`\${localArea}, \${cityStr}\` : localArea;
              setCurrentLocation(detailedName);
            }`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync(file, code);
console.log('Updated location to use suburb/neighbourhood');
