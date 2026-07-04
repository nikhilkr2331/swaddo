const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        tag VARCHAR(50),
        name VARCHAR(100),
        phone VARCHAR(20),
        house_number VARCHAR(100),
        full_address TEXT,
        lat DECIMAL(10,8),
        lng DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Remote table user_addresses created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    process.exit(0);
  }
}

run();
