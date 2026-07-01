import { pool } from './index';

const deleteDemo = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Find mock stalls
    const res = await client.query(`
      SELECT id, vendor_id FROM stalls 
      WHERE name ILIKE '%mock%' OR name ILIKE '%demo%' OR name ILIKE '%test%';
    `);
    
    const stallIds = res.rows.map(r => r.id);
    const vendorIds = res.rows.map(r => r.vendor_id);
    
    if (stallIds.length > 0) {
      console.log('Found mock stalls:', stallIds);
      // delete order items
      await client.query(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE stall_id = ANY($1))`, [stallIds]);
      // delete orders
      await client.query(`DELETE FROM orders WHERE stall_id = ANY($1)`, [stallIds]);
      // delete menu items
      await client.query(`DELETE FROM menu_items WHERE stall_id = ANY($1)`, [stallIds]);
      // delete stalls
      await client.query(`DELETE FROM stalls WHERE id = ANY($1)`, [stallIds]);
    }
    
    if (vendorIds.length > 0) {
      // delete vendors
      await client.query(`DELETE FROM vendors WHERE id = ANY($1)`, [vendorIds]);
    }

    await client.query('COMMIT');
    console.log('Successfully deleted mock stalls and associated data.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete:', error);
  } finally {
    client.release();
  }
};

deleteDemo().then(() => process.exit(0)).catch(() => process.exit(1));
