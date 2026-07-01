const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db',
});

async function run() {
  const client = await pool.connect();
  try {
    const sequencesToFix = [
      { table: 'users', seq: 'users_id_seq' },
      { table: 'vendors', seq: 'vendors_id_seq' },
      { table: 'delivery_partners', seq: 'delivery_partners_id_seq' },
      { table: 'orders', seq: 'orders_id_seq' },
      { table: 'stalls', seq: 'stalls_id_seq' },
      { table: 'menu_items', seq: 'menu_items_id_seq' }
    ];

    for (let { table, seq } of sequencesToFix) {
      await client.query(`
        SELECT setval('${seq}', COALESCE((SELECT MAX(id)+1 FROM ${table}), 1), false);
      `);
      console.log(`Reset sequence ${seq} for table ${table}`);
    }
    
    console.log("All database sequences fixed successfully!");
  } catch (error) {
    console.error("Error fixing sequences:", error);
  } finally {
    client.release();
    pool.end();
  }
}

run();
