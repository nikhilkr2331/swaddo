const fs = require('fs');
const file = 'src/components/LocationSelector.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /const locationName = data\.data\.city \|\| data\.data\.address;\s*setCurrentLocation\(locationName \|\| "Location found"\);/,
    `let locationName = data.data.city || "Location found";
              if (data.data.address) {
                const parts = data.data.address.split(',').map((s: string) => s.trim()).filter((s: string) => !s.includes('+') && !s.match(/^[A-Z0-9]{4}\\+[A-Z0-9]{2,}/));
                if (parts.length > 0) {
                  locationName = parts[0] + (parts[1] && parts[1] !== data.data.city ? ", " + parts[1] : "");
                }
              }
              setCurrentLocation(locationName);`
);

fs.writeFileSync(file, code);
console.log('Fixed current location extraction');
