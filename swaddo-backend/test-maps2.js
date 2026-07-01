const { Client } = require('@googlemaps/google-maps-services-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'c:/Users/Nikhil Raj/Desktop/SwaDDo/swaddo-backend/.env' });

const client = new Client({});
const key = process.env.GOOGLE_MAPS_API_KEY;

async function test() {
  try {
    const res = await client.placeAutocomplete({
      params: {
        input: 'etwari bazar',
        components: ['country:in'],
        key: key
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error Status:", err.response?.status);
    console.log("Error Data:", JSON.stringify(err.response?.data, null, 2));
  }
}

test();
