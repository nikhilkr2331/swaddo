import { config } from 'dotenv';
config();
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Truncating orders, order_items, delivery_assignments, rider_daily_stats...");
    await pool.query(`
      TRUNCATE TABLE 
        orders, 
        order_items, 
        delivery_assignments, 
        rider_daily_stats 
      RESTART IDENTITY CASCADE;
    `);
    console.log("Successfully truncated tables!");
  } catch (err) {
    console.error("Error truncating tables:", err);
  } finally {
    pool.end();
  }
}

run();
