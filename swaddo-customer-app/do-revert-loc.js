const fs = require('fs');
const file = 'src/components/LocationSelector.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /const res = await fetch\(`https:\/\/nominatim\.openstreetmap\.org\/search\?format=json&q=\$\{encodeURIComponent\(query\)\}&countrycodes=in&limit=5`\);\s*const data = await res\.json\(\);\s*setResults\(data \|\| \[\]\);/,
    `const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
          const res = await fetch(\`\${baseUrl}/location/autosuggest?query=\${encodeURIComponent(query)}\`);
          const data = await res.json();
          setResults(data.data || []);`
);

code = code.replace(
    /const handleSelectLocation = async \(result: any\) => \{\s*setIsSearching\(true\);\s*try \{\s*if \(result\.lat && result\.lon\) \{\s*setCoordinates\(parseFloat\(result\.lat\), parseFloat\(result\.lon\)\);\s*const parts = result\.display_name \? result\.display_name\.split\(','\) : \[\];\s*const shortName = parts\.length > 2 \? `\$\{parts\[0\]\.trim\(\)\}, \$\{parts\[1\]\.trim\(\)\}` : \(result\.display_name \|\| "Location"\);\s*setCurrentLocation\(shortName\);\s*\}\s*\} catch \(err\) \{/,
    `const handleSelectLocation = async (result: any) => {
    setIsSearching(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(\`\${baseUrl}/location/geocode\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: result.title || result.description || result.display_name })
      });
      const data = await res.json();
      if (data.success) {
        setCoordinates(data.data.lat, data.data.lng);
        setCurrentLocation(result.title || data.data.address || result.display_name || "Location");
      }
    } catch (err) {`
);

code = code.replace(
    /<span className="font-bold text-sm text-text-primary line-clamp-1">\s*\{result\.display_name \? result\.display_name\.split\(","\)\.slice\(0,2\)\.join\(", "\) : "Location"\}\s*<\/span>\s*<span className="text-xs text-text-muted line-clamp-2 mt-0\.5">\s*\{result\.display_name\}\s*<\/span>/g,
    `<span className="font-bold text-sm text-text-primary line-clamp-1">{result.mainText || result.title || result.description}</span><span className="text-xs text-text-muted line-clamp-2 mt-0.5">{result.description}</span>`
);

// Fix the use current location
code = code.replace(
    /const res = await fetch\(`https:\/\/nominatim\.openstreetmap\.org\/reverse\?format=json&lat=\$\{latitude\}&lon=\$\{longitude\}&zoom=18`\);\s*const data = await res\.json\(\);\s*if \(data && data\.address\) \{\s*const addr = data\.address;\s*const localArea = addr\.neighbourhood \|\| addr\.suburb \|\| addr\.residential \|\| addr\.hamlet \|\| addr\.road \|\| data\.display_name\.split\(','\)\[0\];\s*const cityStr = addr\.city \|\| addr\.town \|\| addr\.village \|\| '';\s*const detailedName = \(cityStr && localArea && localArea !== cityStr\) \? `\$\{localArea\}, \$\{cityStr\}` : localArea;\s*setCurrentLocation\(detailedName\);\s*\} else \{\s*setCurrentLocation\(""\);\s*\/\/ force manual search if geocoding fails\s*\}/,
    `const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
            const res = await fetch(\`\${baseUrl}/location/reverse-geocode\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude })
            });
            const data = await res.json();
            if (data && data.data) {
              const locationName = data.data.city || data.data.address;
              setCurrentLocation(locationName || "Location found");
            } else {
              setCurrentLocation(""); // force manual search if geocoding fails
            }`
);

fs.writeFileSync(file, code);
console.log('Reverted to backend APIs');
