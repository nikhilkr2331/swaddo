const { Pool } = require('pg'); const pool = new Pool(); pool.query('SELECT ::text', [undefined]).then(console.log).catch(e => console.log('ERROR:', e.message));
