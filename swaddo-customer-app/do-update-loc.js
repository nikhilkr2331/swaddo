const fs = require('fs');
const file = 'src/context/LocationContext.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the return; inside the savedLoc check with a comment
code = code.replace(
    /if \(savedLoc\) \{\n\s*setCurrentLocation\(savedLoc\);\n\s*if \(savedLat\) setLatitude\(parseFloat\(savedLat\)\);\n\s*if \(savedLng\) setLongitude\(parseFloat\(savedLng\)\);\n\s*return;\n\s*\}/,
    `if (savedLoc) {
      setCurrentLocation(savedLoc);
      if (savedLat) setLatitude(parseFloat(savedLat));
      if (savedLng) setLongitude(parseFloat(savedLng));
      // Removed 'return;' so it STILL fetches live GPS coordinates in the background!
    }`
);

// To ensure it actually saves the live coordinates to storage so it's fresh:
code = code.replace(
    /setCoordinates\(latitude, longitude, false\);/,
    `setCoordinates(latitude, longitude, true); // Force save live GPS to ensure pricing is accurate`
);

fs.writeFileSync(file, code);
console.log('Successfully updated LocationContext to force live GPS fetching');
