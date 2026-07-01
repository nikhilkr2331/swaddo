import { logger } from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Exporting a dummy Redis object so it doesn't crash on Windows without a Redis server
export const redis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  on: () => {},
  duplicate: function() { return this; },
  connect: async () => {}
} as any;

logger.info('Redis disabled locally to prevent connection errors.');
