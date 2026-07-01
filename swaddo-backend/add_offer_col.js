const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db' }); 
pool.query('ALTER TABLE stalls ADD COLUMN IF NOT EXISTS offer_text VARCHAR(100);')
.then(res => { console.log("Added offer_text column"); pool.end(); })
.catch(console.error);
