const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db'
});

async function runMigration() {
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
      ADD COLUMN IF NOT EXISTS restaurant_instructions TEXT;
    `);
    console.log("Migration successful: Added customer_phone, delivery_instructions, restaurant_instructions to orders table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
