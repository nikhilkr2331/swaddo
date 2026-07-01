const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db' });

pool.query('ALTER TABLE stalls ADD COLUMN IF NOT EXISTS is_pure_veg BOOLEAN DEFAULT false;')
  .then(() => {
    console.log("is_pure_veg column added to stalls");
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
