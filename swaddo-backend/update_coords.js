const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db' }); 
pool.query('UPDATE stalls SET latitude = 25.611 + (random() * 0.04 - 0.02), longitude = 85.130 + (random() * 0.04 - 0.02)')
.then(res => { console.log("Updated", res.rowCount, "stalls"); pool.end(); })
.catch(console.error);
