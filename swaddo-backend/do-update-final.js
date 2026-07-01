const fs = require('fs');
const file = 'src/routes/orders.routes.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /function calculateEarnings\(dist: number\) \{[\s\S]*?return Math\.round\(fee \* 100\) \/ 100;\s*\}/g;

const newCode = `function calculateEarnings(dist: number) {
          let fee = 15;
          if (dist <= 1.4) {
            fee = 15;
          } else if (dist <= 2.0) {
            fee = 15 + ((dist - 1.4) / 0.6) * 4;
          } else if (dist <= 3.0) {
            fee = 19 + ((dist - 2.0) / 1.0) * 5;
          } else if (dist <= 4.0) {
            fee = 24 + ((dist - 3.0) / 1.0) * 6;
          } else {
            fee = 30 + ((dist - 4.0) / 1.0) * 6;
          }
          return Math.round(fee * 100) / 100;
        }`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(file, code);
    console.log('Successfully updated file!');
} else {
    console.log('Regex failed, trying alternative matching...');
}
