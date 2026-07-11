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

// Fetch user notifications inbox
router.get('/inbox', authenticate, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = req.user!.id;
    
    // Fetch notifications that haven't expired
    const result = await client.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching notifications inbox', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// Mark notification as read
router.patch('/inbox/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await client.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification read', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
