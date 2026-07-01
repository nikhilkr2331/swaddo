async function test() {
  try {
    // 1. Get token
    const authRes = await fetch('http://localhost:5005/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        otp: '1234',
        role: 'vendor'
      })
    });
    const authData = await authRes.json();
    const token = authData.token;
    console.log('Got token:', token);

    // 2. Add menu item
    const res = await fetch('http://localhost:5005/api/stalls/1/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Item',
        description: 'Test Category',
        price: 150,
        is_veg: true,
        is_available: true
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      console.error('Error Status:', res.status);
      console.error('Error Data:', data);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

test();
