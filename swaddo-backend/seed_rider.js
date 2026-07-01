const { pool } = require('./dist/db');
const jwt = require('jsonwebtoken');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let userId;
    const existingUser = await client.query(`SELECT id FROM users WHERE phone = '9876543210'`);
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);
      const resUser = await client.query(`
        INSERT INTO users (phone, name, role) 
        VALUES ('9876543210', 'Mock Rider User', 'delivery') 
        RETURNING id;
      `);
      userId = resUser.rows[0].id;
    }
    
    let dpId;
    const existingPartner = await client.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [userId]);
    if (existingPartner.rows.length > 0) {
      dpId = existingPartner.rows[0].id;
    } else {
      const resPartner = await client.query(`
        INSERT INTO delivery_partners (user_id, vehicle_details, current_status) 
        VALUES ($1, 'Bike MH12', 'online') 
        RETURNING id;
      `, [userId]);
      dpId = resPartner.rows[0].id;
    }

    await client.query('COMMIT');
    
    const token = jwt.sign({ id: userId, role: 'delivery', name: 'Mock Rider User' }, 'your-secret-key');
    console.log("RIDER_TOKEN=" + token);
    console.log("PARTNER_ID=" + dpId);
    console.log("USER_ID=" + userId);
  } catch (err) {
    console.error(err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    process.exit(0);
  }
})();
