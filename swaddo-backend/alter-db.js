const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`ALTER TABLE stalls ADD COLUMN IF NOT EXISTS cover_image TEXT;`);
    await pool.query(`ALTER TABLE stalls ADD COLUMN IF NOT EXISTS opening_time VARCHAR(10) DEFAULT '09:00 AM';`);
    await pool.query(`ALTER TABLE stalls ADD COLUMN IF NOT EXISTS closing_time VARCHAR(10) DEFAULT '10:00 PM';`);
    console.log('Database altered successfully.');
  } catch (err) {
    console.error('Error altering DB:', err);
  } finally {
    await pool.end();
  }
}

run();
