const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db' });

async function run() {
  try {
    await pool.query("ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'All'");
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 15");
    console.log("DB altered successfully");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
