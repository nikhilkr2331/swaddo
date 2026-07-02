const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres'
});

async function run() {
  try {
    await pool.query('ALTER TABLE stalls ALTER COLUMN tags TYPE TEXT;');
    console.log('Fixed tags column type');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
