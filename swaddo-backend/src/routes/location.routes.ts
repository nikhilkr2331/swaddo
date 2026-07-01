import { Router } from 'express';
import {
  geocode,
  reverseGeocode,
  autosuggest,
  nearbyStalls,
  distance,
  routeETA,
  getMapToken
} from '../controllers/location.controller';
import { authenticate } from '../middleware/auth'; // Using existing auth middleware if applicable

const router = Router();

router.get('/map-token', getMapToken);

// We can choose to secure these endpoints so that only authenticated users/riders/merchants can call them.
// For now, we will leave them open or apply minimal auth depending on existing architecture.
// Assuming we apply authenticate middleware to prevent public abuse:

router.post('/geocode', geocode);
router.post('/reverse-geocode', reverseGeocode);
router.get('/autosuggest', autosuggest);
router.get('/nearby-stalls', nearbyStalls);
router.post('/distance', distance);
router.post('/route', routeETA);

export default router;
