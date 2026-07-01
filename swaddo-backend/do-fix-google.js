const fs = require('fs');
const file = 'src/services/googlemaps.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /const res = await client\.placeAutocomplete\(\{\s*params: \{\s*input: query,\s*location: locationParam as any,\s*radius: locationParam \? 50000 : undefined,\s*components: \['country:in'\],\s*key: getKey\(\)\s*\}\s*\}\);/,
    `const params: any = {
          input: query,
          components: ['country:in'],
          key: getKey()
        };
        if (locationParam) {
          params.location = locationParam;
          params.radius = 50000;
        }
        const res = await client.placeAutocomplete({ params });`
);

fs.writeFileSync(file, code);
console.log('Fixed googleAutosuggest undefined crash');
