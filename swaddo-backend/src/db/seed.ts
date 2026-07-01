import { pool } from './index';
import { logger } from '../utils/logger';

const seedData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create mock user
    const userRes = await client.query(`
      INSERT INTO users (phone, name, role) 
      VALUES ('1234567890', 'Mock Vendor User', 'vendor') 
      ON CONFLICT (phone) DO NOTHING
      RETURNING id;
    `);
    
    let userId = 1;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      const existing = await client.query(`SELECT id FROM users WHERE phone = '1234567890'`);
      if (existing.rows.length > 0) userId = existing.rows[0].id;
    }

    // Create mock vendor
    const vendorRes = await client.query(`
      INSERT INTO vendors (id, user_id, business_name) 
      VALUES (1, $1, 'Mock Business') 
      ON CONFLICT (id) DO NOTHING
    `, [userId]);

    // Create mock stall
    await client.query(`
      INSERT INTO stalls (id, vendor_id, name, location, is_open) 
      VALUES (1, 1, 'Mock Stall', 'Food Court', true) 
      ON CONFLICT (id) DO NOTHING
    `);

    // Create some initial menu items
    await client.query(`
      INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available)
      VALUES 
        (1, 'Paneer Tikka', 'Starters', 180, true, true),
        (1, 'Chicken Biryani', 'Main Course', 250, false, true)
    `);

    await client.query('COMMIT');
    logger.info('Database seeded with mock stall 1!');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to seed:', error);
    throw error;
  } finally {
    client.release();
  }
};

seedData().then(() => process.exit(0)).catch(() => process.exit(1));
