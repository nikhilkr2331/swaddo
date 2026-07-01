const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});
client.placeAutocomplete({
  params: {
    input: 'etwari',
    location: undefined,
    radius: undefined,
    components: ['country:in'],
    key: 'AIzaSyCWCamop9wncbx18Sb-ONg21Yx_o_qCECY'
  }
}).then(r => console.log('OK')).catch(e => console.log('ERROR:', e.response?.data?.error_message || e.message));
