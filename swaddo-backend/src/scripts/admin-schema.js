const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db',
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create Disputes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open', -- open, resolved, refunded
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // The status column on vendors actually exists, but let's just make sure
    // it defaults to 'pending_approval' for new ones.
    // Actually the prompt says vendors table has `status VARCHAR(20) DEFAULT 'active'`
    await client.query(`
      ALTER TABLE vendors ALTER COLUMN status SET DEFAULT 'pending_approval';
    `);

    // Add kyc_status to delivery_partners if not exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE delivery_partners ADD COLUMN kyc_status VARCHAR(50) DEFAULT 'pending';
      EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);

    await client.query('COMMIT');
    console.log("Admin schema updates applied successfully!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error applying schema updates:", error);
  } finally {
    client.release();
    pool.end();
  }
}

run();
