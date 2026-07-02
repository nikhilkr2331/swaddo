const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres'
});

async function run() {
  try {
    await pool.query('ALTER TABLE stalls ADD COLUMN prep_time VARCHAR(50);').catch(()=>null);
    await pool.query('ALTER TABLE menu_items ADD COLUMN category VARCHAR(100);').catch(()=>null);
    await pool.query('ALTER TABLE delivery_partners ADD COLUMN kyc_status VARCHAR(50);').catch(()=>null);
    await pool.query('ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(20);').catch(()=>null);
    await pool.query('ALTER TABLE delivery_assignments ADD COLUMN delivered_at TIMESTAMP;').catch(()=>null);
    console.log('Fixed missing remote columns!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
