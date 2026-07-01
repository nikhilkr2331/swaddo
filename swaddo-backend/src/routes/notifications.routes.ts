import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Register a new FCM device token for the authenticated user
router.post('/register-token', authenticate, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { token, deviceType = 'web' } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const userId = req.user!.id;

    // Insert or update token
    await client.query(`
      INSERT INTO fcm_tokens (user_id, token, device_type) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, device_type = EXCLUDED.device_type, created_at = CURRENT_TIMESTAMP
    `, [userId, token, deviceType]);

    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    logger.error('Error registering FCM token', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
