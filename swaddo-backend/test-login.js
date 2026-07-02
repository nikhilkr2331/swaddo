const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await client.connect();
    await client.query('BEGIN');
    const phone = '9999999999';
    const role = 'vendor';
    let userRes = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user;
    if (userRes.rows.length === 0) {
      userRes = await client.query('INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING *', [phone, `New ${role}`, role]);
      user = userRes.rows[0];
    } else {
      user = userRes.rows[0];
    }
    console.log('user', user);

    let vendorRes = await client.query('SELECT * FROM vendors WHERE user_id = $1', [user.id]);
    if (vendorRes.rows.length === 0) {
      vendorRes = await client.query('INSERT INTO vendors (user_id, business_name, status) VALUES ($1, $2, $3) RETURNING *', [user.id, '', 'active']);
      const newVendorId = vendorRes.rows[0].id;
      await client.query('INSERT INTO stalls (vendor_id, name, location, is_open) VALUES ($1, $2, $3, $4)', [newVendorId, '', '', false]);
    }
    console.log('vendor', vendorRes.rows[0]);
    await client.query('ROLLBACK');
    console.log('Success');
  } catch (e) {
    console.error('FAILED', e);
    await client.query('ROLLBACK');
  } finally {
    client.end();
  }
}
test();
