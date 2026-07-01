const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});
client.placeAutocomplete({
  params: {
    input: 'etwari',
    components: ['country:in'],
    key: 'AIzaSyCWCamop9wncbx18Sb-ONg21Yx_o_qCECY'
  }
}).then(r => console.log('OK', r.data)).catch(e => console.log('ERROR', e.response?.data || e.message));
