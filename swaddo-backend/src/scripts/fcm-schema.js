const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://swaddo_user:swaddo_password@localhost:5432/swaddo_db',
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create FCM Tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log("FCM schema updates applied successfully!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error applying FCM schema updates:", error);
  } finally {
    client.release();
    pool.end();
  }
}

run();
