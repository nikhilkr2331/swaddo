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

async function syncSchema() {
  try {
    for (const table of tables) {
      const localColsRes = await localPool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]
      );
      const remoteColsRes = await remotePool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]
      );
      
      const localCols = localColsRes.rows;
      const remoteCols = remoteColsRes.rows.map(r => r.column_name);

      for (const col of localCols) {
        if (!remoteCols.includes(col.column_name)) {
          let dt = col.data_type;
          if (dt === 'character varying') dt = 'VARCHAR(255)';
          if (dt === 'timestamp without time zone') dt = 'TIMESTAMP';
          console.log(`Adding missing column ${col.column_name} to ${table}`);
          await remotePool.query(`ALTER TABLE ${table} ADD COLUMN ${col.column_name} ${dt}`).catch(console.error);
        }
      }
    }
    console.log("Schema sync complete!");
  } catch (e) {
    console.error(e);
  } finally {
    localPool.end();
    remotePool.end();
  }
}
syncSchema();
