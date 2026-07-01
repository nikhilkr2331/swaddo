const fs = require('fs');
const file = 'src/routes/orders.routes.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /function calculateEarnings\(dist: number\) \{[\s\S]*?const earnings = calculateEarnings\(dropoffDistance\);/g;

const newCode = unction calculateEarnings(dist: number) {
          let fee = 15;
          if (dist <= 1.4) {
            fee = 15;
          } else if (dist <= 2.0) {
            fee = 15 + ((dist - 1.4) / 0.6) * 5;
          } else if (dist <= 3.0) {
            fee = 20 + ((dist - 2.0) / 1.0) * 6;
          } else if (dist <= 4.0) {
            fee = 26 + ((dist - 3.0) / 1.0) * 7;
          } else if (dist <= 5.0) {
            fee = 33 + ((dist - 4.0) / 1.0) * 7;
          } else if (dist <= 6.0) {
            fee = 40 + ((dist - 5.0) / 1.0) * 7;
          } else {
            fee = 47 + ((dist - 6.0) / 1.0) * 7;
          }
          return Math.round(fee * 100) / 100;
        }

        const earnings = calculateEarnings(dropoffDistance);
        
        function calculateReturnPayout(dist: number) {
          let pay = 0;
          if (dist > 3.0 && dist <= 3.5) {
            pay = ((dist - 3.0) / 0.5) * 3;
          } else if (dist > 3.5) {
            pay = 3 + ((dist - 3.5) / 1.0) * 10;
          }
          return Math.round(pay * 100) / 100;
        }
        
        const returnPayout = calculateReturnPayout(dropoffDistance);;

code = code.replace(regex, newCode);

const payloadRegex = /dropoffDistance: parseFloat\(dropoffDistance.toFixed\(1\)\),\s*earnings: earnings\s*};/g;
const newPayload = dropoffDistance: parseFloat(dropoffDistance.toFixed(1)),\n          earnings: earnings,\n          returnPayout: returnPayout\n        };;

code = code.replace(payloadRegex, newPayload);

fs.writeFileSync(file, code);
console.log('Successfully updated backend file');
