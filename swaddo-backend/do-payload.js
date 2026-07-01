const fs = require('fs');
const file = 'src/routes/orders.routes.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /earnings: earnings\s*\n\s*\};/g;
if (regex.test(code)) {
    code = code.replace(regex, "earnings: earnings,\n          returnPayout: returnPayout\n        };");
    fs.writeFileSync(file, code);
    console.log('Successfully added returnPayout to payload');
} else {
    console.log('It seems returnPayout is already in the payload or match failed');
}
