import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
  googleGeocode,
  googleReverseGeocode,
  googleAutosuggest,
  googleDistance,
  googleRouteETA
} from '../services/googlemaps.service';

export const getMapToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const frontendKey = process.env.GOOGLE_MAPS_FRONTEND_API_KEY || '';
    res.json({
      success: true,
      token: frontendKey,
      mapboxToken: frontendKey
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch map token' });
  }
};

export const geocode = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ status: 'error', message: 'Address is required' });
    }
    const data = await googleGeocode(address);
    res.json({ status: 'success', data });
  } catch (error: any) {
    logger.error('Geocode controller error', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const reverseGeocode = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ status: 'error', message: 'lat and lng are required' });
    }
    const data = await googleReverseGeocode(Number(lat), Number(lng));
    res.json({ status: 'success', data });
  } catch (error: any) {
    logger.error('Reverse Geocode controller error', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const autosuggest = async (req: Request, res: Response) => {
  try {
    const { query, location } = req.query;
    if (!query) {
      return res.status(400).json({ status: 'error', message: 'query is required' });
    }
    const data = await googleAutosuggest(String(query), location ? String(location) : undefined);
    res.json({ status: 'success', data });
  } catch (error: any) {
    logger.error('Autosuggest controller error', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const nearbyStalls = async (req: Request, res: Response) => {
  try {
    const { keywords, refLocation } = req.query;
    if (!refLocation) {
      return res.status(400).json({ status: 'error', message: 'refLocation is required' });
    }
    
    // Simulate PostGIS query for nearby stalls from our database
    // SELECT * FROM stalls WHERE ST_DWithin(location, ST_MakePoint(lon, lat), radius)
    const mockStalls = [
      { id: 1, name: "Stall A", distance: 1.2 },
      { id: 2, name: "Stall B", distance: 2.4 }
    ];
    
    res.json({ status: 'success', data: mockStalls });
  } catch (error: any) {
    logger.error('Nearby controller error', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const distance = async (req: Request, res: Response) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates) {
      return res.status(400).json({ status: 'error', message: 'coordinates (lon,lat;lon,lat) are required' });
    }
    const data = await googleDistance(coordinates);
    res.json({ status: 'success', data });
  } catch (error: any) {
    logger.error('Distance controller error', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const routeETA = async (req: Request, res: Response) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.body;
    if (originLat == null || originLng == null || destLat == null || destLng == null) {
      return res.status(400).json({ status: 'error', message: 'originLat, originLng, destLat, and destLng are required' });
    }
    const data = await googleRouteETA(originLat, originLng, destLat, destLng);
    res.json({ status: 'success', data });
  } catch (error: any) {
    logger.error('Route ETA controller error', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
