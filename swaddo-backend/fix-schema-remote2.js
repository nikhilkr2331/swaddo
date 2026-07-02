const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres'
});

async function run() {
  try {
    await pool.query('ALTER TABLE stalls ADD COLUMN tags JSONB;').catch(()=>null);
    await pool.query('ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;').catch(()=>null);
    console.log('Fixed additional missing remote columns!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
