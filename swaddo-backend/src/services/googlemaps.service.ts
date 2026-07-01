import { Client } from '@googlemaps/google-maps-services-js';
import { logger } from '../utils/logger';

const client = new Client({});

const getKey = () => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    logger.warn('GOOGLE_MAPS_API_KEY is missing. Location services will fail.');
  }
  return key || '';
};

export const googleGeocode = async (address: string) => {
  try {
    const res = await client.geocode({
      params: {
        address,
        components: 'country:in',
        key: getKey()
      }
    });
    const result = res.data.results[0];
    if (!result) return null;
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address,
      placeId: result.place_id,
      city: result.address_components.find(c => c.types.includes('locality' as any))?.long_name || '',
      state: result.address_components.find(c => c.types.includes('administrative_area_level_1' as any))?.long_name || '',
      pincode: result.address_components.find(c => c.types.includes('postal_code' as any))?.long_name || ''
    };
  } catch (err: any) {
    logger.error('Google Maps Geocode failed', err.response?.data || err.message);
    throw new Error('Google Maps Geocode failed');
  }
};

export const googleReverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await client.reverseGeocode({
      params: {
        latlng: [lat, lng],
        key: getKey()
      }
    });
    const result = res.data.results[0];
    if (!result) return null;
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address,
      placeId: result.place_id,
      city: result.address_components.find(c => c.types.includes('locality' as any))?.long_name || '',
      state: result.address_components.find(c => c.types.includes('administrative_area_level_1' as any))?.long_name || '',
      pincode: result.address_components.find(c => c.types.includes('postal_code' as any))?.long_name || ''
    };
  } catch (err: any) {
    logger.error('Google Maps Reverse Geocode failed', err.response?.data || err.message);
    throw new Error('Google Maps Reverse Geocode failed');
  }
};

export const googleAutosuggest = async (query: string, location?: string) => {
  try {
    let locationParam = undefined;
    if (location) {
      const [lat, lng] = location.split(',');
      if (lat && lng) {
        locationParam = [parseFloat(lat), parseFloat(lng)];
      }
    }
    const params: any = {
          input: query,
          components: 'country:in',
          key: getKey()
        };
        if (locationParam) {
          params.location = locationParam;
          params.radius = 50000;
        }
        const res = await client.placeAutocomplete({ params });
    return res.data.predictions.map(p => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting.main_text,
      secondaryText: p.structured_formatting.secondary_text
    }));
  } catch (err: any) {
    logger.error('Google Maps Autosuggest failed', err.response?.data || err.message);
    throw new Error('Google Maps Autosuggest failed');
  }
};

export const googleDistance = async (coordinates: string) => {
  try {
    // Expected coordinate format: lng,lat;lng,lat
    const parts = coordinates.split(';');
    if (parts.length < 2) throw new Error("Invalid coordinates format. Expected lng,lat;lng,lat");
    
    const coords = parts.map(p => p.split(',').map(Number));
    const [c1, c2] = coords;
    
    const origin = [c1[1], c1[0]]; // [lat, lng]
    const dest = [c2[1], c2[0]]; // [lat, lng]

    const res = await client.distancematrix({
      params: {
        origins: [origin as [number, number]],
        destinations: [dest as [number, number]],
        key: getKey()
      }
    });
    
    const element = res.data.rows[0]?.elements[0];
    if (element?.status === 'OK') {
      return {
        distanceKm: element.distance.value / 1000,
        durationMin: element.duration.value / 60
      };
    }
    return null;
  } catch (err: any) {
    logger.error('Google Maps Distance Matrix failed', err.response?.data || err.message);
    throw new Error('Google Maps Distance Matrix failed');
  }
};

export const googleRouteETA = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
  try {
    const res = await client.directions({
      params: {
        origin: [originLat, originLng],
        destination: [destLat, destLng],
        alternatives: true, // Request alternative routes to find the shortest distance
        key: getKey()
      }
    });
    
    if (!res.data.routes || res.data.routes.length === 0) return null;
    
    // Sort routes by shortest distance
    const sortedRoutes = res.data.routes.sort((a, b) => {
      const distA = a.legs[0]?.distance?.value || 0;
      const distB = b.legs[0]?.distance?.value || 0;
      return distA - distB;
    });

    const route = sortedRoutes[0];
    const leg = route.legs[0];
    
    return {
      distanceKm: leg.distance.value / 1000,
      durationMin: leg.duration.value / 60,
      polyline: route.overview_polyline.points,
    };
  } catch (err: any) {
    logger.error('Google Maps Directions failed', err.response?.data || err.message);
    throw new Error('Google Maps Directions failed');
  }
};
