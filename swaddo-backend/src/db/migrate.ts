import { pool } from './index';

const migrate = async () => {
  try {
    await pool.query('ALTER TABLE stalls ADD COLUMN prep_time INTEGER DEFAULT 15');
    console.log('Added prep_time');
  } catch (e) {console.log(e)}
  try {
    await pool.query("ALTER TABLE stalls ADD COLUMN tags VARCHAR(255) DEFAULT 'North Indian, Biryani'");
    console.log('Added tags');
  } catch(e) {console.log(e)}
  try {
    await pool.query('ALTER TABLE stalls ADD COLUMN rating_count INTEGER DEFAULT 120');
    console.log('Added rating_count');
  } catch(e) {console.log(e)}
  process.exit(0);
};
migrate();
