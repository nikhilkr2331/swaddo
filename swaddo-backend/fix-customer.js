const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db' });

async function run() {
  await pool.query("INSERT INTO users (id, phone, name, role) VALUES (2, '0987654321', 'Nikhil', 'customer') ON CONFLICT (id) DO NOTHING");
  console.log('Customer inserted!');
  process.exit(0);
}
run();
