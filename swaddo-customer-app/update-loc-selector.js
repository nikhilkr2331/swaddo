const fs = require('fs');
const file = 'src/components/LocationSelector.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace handleSearch logic
code = code.replace(
    /const baseUrl = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5005\/api';\s*const res = await fetch\(`\$\{baseUrl\}\/location\/autosuggest\?query=\$\{encodeURIComponent\(query\)\}`\);\s*const data = await res\.json\(\);\s*setResults\(data\.data \|\| \[\]\);/,
    `const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query)}&countrycodes=in&limit=5\`);
          const data = await res.json();
          setResults(data || []);`
);

// Replace handleSelectLocation logic
code = code.replace(
    /const handleSelectLocation = async \(result: any\) => \{[\s\S]*?try \{[\s\S]*?const baseUrl = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5005\/api';[\s\S]*?const res = await fetch\(`\$\{baseUrl\}\/location\/geocode`, \{[\s\S]*?method: 'POST',[\s\S]*?headers: \{ 'Content-Type': 'application\/json' \},[\s\S]*?body: JSON\.stringify\(\{ address: result\.title \|\| result\.description \|\| result\.display_name \}\)[\s\S]*?\}\);[\s\S]*?const data = await res\.json\(\);[\s\S]*?if \(data\.success\) \{[\s\S]*?setCoordinates\(data\.data\.lat, data\.data\.lng\);[\s\S]*?setCurrentLocation\(result\.title \|\| data\.data\.address \|\| result\.display_name \|\| "Location"\);[\s\S]*?\}[\s\S]*?\} catch \(err\) \{/,
    `const handleSelectLocation = async (result: any) => {
    setIsSearching(true);
    try {
      if (result.lat && result.lon) {
        setCoordinates(parseFloat(result.lat), parseFloat(result.lon));
        const parts = result.display_name ? result.display_name.split(',') : [];
        const shortName = parts.length > 2 ? \`\${parts[0].trim()}, \${parts[1].trim()}\` : (result.display_name || "Location");
        setCurrentLocation(shortName);
      }
    } catch (err) {`
);

// Fix the render in the results mapping
// The old map was probably rendering result.title and result.description. Nominatim just gives display_name
code = code.replace(
    /<span className="font-bold text-sm text-text-primary line-clamp-1">.*?<\/span>\s*<span className="text-xs text-text-muted line-clamp-1">.*?<\/span>/g,
    `<span className="font-bold text-sm text-text-primary line-clamp-2">{result.display_name}</span>`
);


fs.writeFileSync(file, code);
console.log('Successfully updated LocationSelector to use Nominatim directly');
