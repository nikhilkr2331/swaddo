const fs = require('fs');
const file = 'src/app/checkout/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /let fee = 23;\s*if \(dist <= 2\.4\) fee = 23;\s*else if \(dist <= 3\.0\) fee = 28;\s*else if \(dist <= 4\.0\) fee = 34;\s*else if \(dist <= 5\.0\) fee = 41;\s*else fee = 41 \+ Math\.ceil\(dist - 5\.0\) \* 7;/g;

const newCode = `let fee = 18;
      if (dist <= 1.4) {
        fee = 18;
      } else if (dist <= 2.0) {
        fee = 18 + ((dist - 1.4) / 0.6) * 5;
      } else if (dist <= 3.0) {
        fee = 23 + ((dist - 2.0) / 1.0) * 6;
      } else if (dist <= 4.0) {
        fee = 29 + ((dist - 3.0) / 1.0) * 7;
      } else {
        fee = 36;
      }
      fee = Math.round(fee * 100) / 100;`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(file, code);
    console.log('Successfully updated checkout delivery fee logic');
} else {
    console.log('Regex failed');
}
