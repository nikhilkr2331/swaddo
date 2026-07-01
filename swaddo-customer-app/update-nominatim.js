const fs = require('fs');
const file = 'src/context/LocationContext.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /const res = await fetch\(`https:\/\/nominatim\.openstreetmap\.org\/reverse\?format=json&lat=\$\{latitude\}&lon=\$\{longitude\}&zoom=10`\);\s*const data = await res\.json\(\);\s*if \(data && data\.address\) \{\s*const city = data\.address\.city \|\| data\.address\.town \|\| data\.address\.village \|\| data\.address\.county;\s*const state = data\.address\.state;\s*if \(city && state\) \{\s*setCurrentLocation\(`\$\{city\}, \$\{state\}`\);\s*\} else \{\s*setCurrentLocation\("Location found"\);\s*\}\s*\}/,
    `const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latitude}&lon=\${longitude}&zoom=18\`);
            const data = await res.json();
            if (data && data.display_name) {
              // Extract the first 3 parts of the detailed address (usually building/road, area, city)
              const detailedName = data.display_name.split(',').map(s => s.trim()).slice(0, 3).join(', ');
              setCurrentLocation(detailedName);
            }`
);

fs.writeFileSync(file, code);
console.log('Successfully updated LocationContext for detailed address');
