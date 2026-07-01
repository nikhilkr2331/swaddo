const fs = require('fs');
const file = 'src/app/home/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Pickup Payout \/ Bonus \*\/\}[\s\S]*?<span className="text-2xl font-bold text-green-600">?\{\(newJob\.earnings \|\| 45\) \+ \(newJob\.pickupPayout \|\| 0\)\}<\/span>\s*<\/div>/g;

const newCode =               {/* Itemized Payout Section */}
              <div className="flex flex-col gap-2 mt-2">
                {/* Pickup Payout */}
                {newJob.pickupPayout !== undefined && newJob.pickupPayout > 0 && (
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-800">
                      <span className="text-sm font-bold">Pickup Distance Pay</span>
                    </div>
                    <span className="font-bold text-green-700">+ ?{newJob.pickupPayout}</span>
                  </div>
                )}
                
                {/* Delivery Base Payout */}
                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 text-orange-800">
                    <span className="text-sm font-bold">Delivery Distance Pay</span>
                  </div>
                  <span className="font-bold text-orange-700">?{newJob.earnings || 45}</span>
                </div>

                {/* Return Payout */}
                {newJob.returnPayout !== undefined && newJob.returnPayout > 0 && (
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800">
                      <span className="text-sm font-bold">Return Earning</span>
                    </div>
                    <span className="font-bold text-blue-700">+ ?{newJob.returnPayout}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-border-subtle pt-4 mt-2">
                <span className="text-text-muted font-bold text-lg">Total Earning</span>
                <span className="text-3xl font-heading font-black text-green-600">?{(newJob.earnings || 45) + (newJob.pickupPayout || 0) + (newJob.returnPayout || 0)}</span>
              </div>;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync(file, code);
    console.log('Successfully updated file');
} else {
    console.log('Regex did not match!');
}
