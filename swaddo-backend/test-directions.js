const { Client } = require('@googlemaps/google-maps-services-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Nikhil Raj/Desktop/SwaDDo/swaddo-backend/.env' });

const client = new Client({});
const key = process.env.GOOGLE_MAPS_API_KEY;

async function test() {
  try {
    const res = await client.directions({
      params: {
        origin: [25.611, 85.130],
        destination: [25.620, 85.140],
        key: key
      }
    });
    console.log("Success:", res.data.status);
  } catch (err) {
    console.log("Error Status:", err.response?.status);
    console.log("Error Data:", JSON.stringify(err.response?.data, null, 2));
  }
}

test();
