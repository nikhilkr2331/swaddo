import { pool } from './src/db';
async function fix() {
  try {
    await pool.query("UPDATE delivery_assignments SET cash_collected = true WHERE status = 'completed'");
    console.log('cash_collected fixed in db');
  } catch(e: any) {
    console.error('error', e.message);
  } finally {
    process.exit();
  }
}
fix();
