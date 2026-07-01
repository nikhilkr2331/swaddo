const jwt = require('jsonwebtoken');
const axios = require('axios');

const token = jwt.sign({ id: 1, role: 'vendor' }, 'super_secret_jwt_key_change_in_production');

axios.post('http://localhost:5005/api/stalls/1/menu', {
  name: 'Test Item',
  description: 'Test Category',
  price: 150,
  is_veg: true,
  is_available: true
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
}).then(res => {
  console.log('Success:', res.data);
}).catch(err => {
  console.log('Error:', err.response ? err.response.data : err.message);
});
