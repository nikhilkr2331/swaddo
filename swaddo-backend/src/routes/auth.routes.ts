import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { message: 'Too many OTP requests from this IP, please try again after 15 minutes' }
});

router.get('/check-user', async (req: Request, res: Response) => {
  const identifier = req.query.identifier as string;
  
  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required' });
  }

  try {
    const client = await pool.connect();
    const userRes = await client.query('SELECT * FROM users WHERE phone = $1', [identifier]);
    client.release();

    if (userRes.rows.length > 0) {
      return res.status(200).json({
        user_found: true,
        identifier: identifier
      });
    } else {
      // Return 200 with user_found: false (or you can return 404, depending on MSG91 strictness, 
      // but returning 200 with user_found: false is safer as per their JSON schema)
      return res.status(200).json({
        user_found: false,
        identifier: identifier,
        message: 'User not found!!!'
      });
    }
  } catch (error) {
    logger.error('Error checking user existence:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/request-otp', authLimiter, (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }
  
  // Mock OTP logic
  const mockOtp = '1234';
  logger.info(`[MOCK SMS] Sending OTP ${mockOtp} to ${phone}`);
  
  res.json({ message: 'OTP sent successfully' });
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp, role = 'customer' } = req.body;
  
  if (otp !== '1234') {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    
    // 1. Get or Create User
    // Use an upsert or check. Since phone is unique across roles? Wait, phone is UNIQUE in users table!
    // If a customer tries to login as vendor with same phone, it might clash if role is different.
    // For local dev, let's just fetch by phone.
    let userRes = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user;
    if (userRes.rows.length === 0) {
      userRes = await client.query('INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING *', [phone, `New ${role}`, role]);
      user = userRes.rows[0];
    } else {
      user = userRes.rows[0];
      // If role mismatch, update the role to what they are trying to login as, or just accept it.
      // Usually phone numbers are tied to 1 identity.
      if (user.role !== role) {
        await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, user.id]);
        user.role = role;
      }
    }

    // 2. Role-specific DB entries
    if (role === 'vendor') {
      let vendorRes = await client.query('SELECT * FROM vendors WHERE user_id = $1', [user.id]);
      if (vendorRes.rows.length === 0) {
        vendorRes = await client.query('INSERT INTO vendors (user_id, business_name, status) VALUES ($1, $2, $3) RETURNING *', [user.id, '', 'active']);
        const newVendorId = vendorRes.rows[0].id;
        // Auto-create a stall for this vendor so the app doesn't 404
        await client.query('INSERT INTO stalls (vendor_id, name, location, is_open) VALUES ($1, $2, $3, $4)', [newVendorId, '', '', false]);
      }
      const vendor = vendorRes.rows[0];
      
      // Auto-approve existing pending vendors for development
      if (vendor.status === 'pending_approval') {
        await client.query("UPDATE vendors SET status = 'active' WHERE id = $1", [vendor.id]);
        vendor.status = 'active';
      }
    } else if (role === 'delivery') {
      let riderRes = await client.query('SELECT * FROM delivery_partners WHERE user_id = $1', [user.id]);
      if (riderRes.rows.length === 0) {
        await client.query('INSERT INTO delivery_partners (user_id, is_active, id_proof_status) VALUES ($1, false, $2)', [user.id, 'pending']);
      }
    }

    await client.query('COMMIT');

    const token = jwt.sign({ id: user.id, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, phone, role, name: user.name } });
  } catch (error: any) {
    if (client) await client.query('ROLLBACK');
    logger.error('Login error', error);
    res.status(500).json({ message: 'Server error: ' + (error.message || 'unknown error'), stack: error.stack, fullError: String(error) });
  } finally {
    if (client) client.release();
  }
});

import { authenticate, AuthRequest } from '../middleware/auth';

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const client = await pool.connect();
    const result = await client.query('SELECT id, name, phone, role, created_at FROM users WHERE id = $1', [userId]);
    client.release();
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phone } = req.body;
    
    const client = await pool.connect();
    
    if (phone) {
      // Check if phone already in use by another user
      const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [phone, userId]);
      if (phoneCheck.rows.length > 0) {
        client.release();
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }
    
    const result = await client.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, name, phone, role',
      [name, phone, userId]
    );
    client.release();
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const client = await pool.connect();
    
    // Auto-create table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tag VARCHAR(50),
        name VARCHAR(150),
        phone VARCHAR(20),
        house_number VARCHAR(100),
        full_address TEXT,
        lat DECIMAL(10,8),
        lng DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    const result = await client.query('SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    client.release();
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { tag, name, phone, house_number, full_address, lat, lng } = req.body;
    
    const client = await pool.connect();
    
    // Auto-create table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tag VARCHAR(50),
        name VARCHAR(150),
        phone VARCHAR(20),
        house_number VARCHAR(100),
        full_address TEXT,
        lat DECIMAL(10,8),
        lng DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    const result = await client.query(
      'INSERT INTO user_addresses (user_id, tag, name, phone, house_number, full_address, lat, lng) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, tag, name, phone, house_number, full_address, lat, lng]
    );
    client.release();
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error saving address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const addressId = req.params.id;
    
    const client = await pool.connect();
    await client.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    client.release();
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    logger.error('Error deleting address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/fcm-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }
    
    const client = await pool.connect();
    await client.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [token, userId]);
    client.release();
    
    res.json({ message: 'FCM token saved successfully' });
  } catch (error) {
    logger.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
