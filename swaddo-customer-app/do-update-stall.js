const fs = require('fs');
const file = 'src/app/stall/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add import if not present
if (!code.includes('useLocation')) {
    code = code.replace(
        /import \{ useCart \} from "@\/context\/CartContext";/,
        `import { useCart } from "@/context/CartContext";\nimport { useLocation } from "@/context/LocationContext";`
    );
}

// Add getDistance inside StallDetailContent
if (!code.includes('const getDistance =')) {
    code = code.replace(
        /function StallDetailContent\(\) \{\n\s*const router = useRouter\(\);/g,
        `function StallDetailContent() {\n  const router = useRouter();\n  const { latitude, longitude } = useLocation();\n  \n  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {\n    const R = 6371;\n    const dLat = (lat2 - lat1) * Math.PI / 180;\n    const dLon = (lon2 - lon1) * Math.PI / 180;\n    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);\n    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));\n    return R * c;\n  };\n  \n  let itemMarkup = 0;\n  if (stallData?.latitude && stallData?.longitude && latitude && longitude) {\n    const dist = getDistance(parseFloat(stallData.latitude), parseFloat(stallData.longitude), latitude, longitude);\n    if (dist > 4.0) {\n      itemMarkup = 20;\n    }\n  }\n`
    );
}

// Replace Number(item.price) with Number(item.price) + itemMarkup
code = code.replace(/Number\(item\.price\)/g, "(Number(item.price) + itemMarkup)");
code = code.replace(/\{item\.price\}/g, "{Number(item.price) + itemMarkup}");

fs.writeFileSync(file, code);
console.log('Successfully updated stall page with markup');
