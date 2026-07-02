const { Pool } = require('pg');

const localUrl = 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db';
const remoteUrl = 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres';

const localPool = new Pool({ connectionString: localUrl });
const remotePool = new Pool({ connectionString: remoteUrl });

const tables = [
  'users',
  'vendors',
  'stalls',
  'menu_items',
  'customers',
  'delivery_partners',
  'orders',
  'order_items',
  'delivery_assignments'
];

async function copyData() {
  try {
    for (const table of tables) {
      console.log(`Copying table: ${table}`);
      
      let localRes;
      try {
        localRes = await localPool.query(`SELECT * FROM ${table}`);
      } catch (e) {
        console.log(`Skipping ${table} (not found)`);
        continue;
      }
      
      const rows = localRes.rows;
      if (rows.length === 0) {
        console.log(`No data in ${table}`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        
        try {
          await remotePool.query(query, values);
        } catch (e) {
          console.error(`Error inserting into ${table}:`, e.message);
        }
      }
      console.log(`Copied ${rows.length} rows to ${table}`);
    }
    
    // Fix sequences
    for (const table of tables) {
        try {
            await remotePool.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id)+1 FROM ${table}), 1), false);`);
        } catch (e) {}
    }
    console.log('Copy complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    localPool.end();
    remotePool.end();
  }
}

copyData();
