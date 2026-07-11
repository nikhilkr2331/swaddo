import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireAdmin);

// 1. Dashboard Stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersRes = await pool.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= $1 AND status != 'cancelled'", [today]);
    const vendorsRes = await pool.query("SELECT COUNT(*) as count FROM vendors WHERE status = 'active'");
    const ridersRes = await pool.query("SELECT COUNT(*) as count FROM delivery_partners WHERE kyc_status = 'verified'");
    const disputesRes = await pool.query("SELECT COUNT(*) as count FROM disputes WHERE status = 'open'");

    res.json({
      ordersToday: parseInt(ordersRes.rows[0].count),
      revenueToday: parseFloat(ordersRes.rows[0].revenue),
      activeVendors: parseInt(vendorsRes.rows[0].count),
      activeRiders: parseInt(ridersRes.rows[0].count),
      pendingDisputes: parseInt(disputesRes.rows[0].count)
    });
  } catch (error) {
    logger.error('Admin Stats Error', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// 2. Vendors
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await pool.query(`
      SELECT v.*, u.name, u.phone 
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      ORDER BY v.id DESC
    `);
    res.json(vendors.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors' });
  }
});

router.patch('/vendors/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const vendor = await pool.query('UPDATE vendors SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(vendor.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor' });
  }
});

// 3. Orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await pool.query(`
      SELECT o.*, u.name as customer_name, s.name as stall_name 
      FROM orders o 
      LEFT JOIN users u ON o.customer_id = u.id 
      LEFT JOIN stalls s ON o.stall_id = s.id 
      ORDER BY o.created_at DESC LIMIT 100
    `);
    res.json(orders.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// 4. Disputes
router.get('/disputes', async (req: Request, res: Response) => {
  try {
    const disputes = await pool.query(`
      SELECT d.*, o.total_amount, u.name as customer_name, u.phone as customer_phone
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN users u ON d.customer_id = u.id
      ORDER BY d.created_at DESC
    `);
    res.json(disputes.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching disputes' });
  }
});

router.patch('/disputes/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'resolved' or 'refunded'
    const dispute = await pool.query('UPDATE disputes SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(dispute.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error resolving dispute' });
  }
});

// 5. Riders
router.get('/riders', async (req: Request, res: Response) => {
  try {
    const riders = await pool.query(`
      SELECT d.*, u.name, u.phone 
      FROM delivery_partners d 
      JOIN users u ON d.user_id = u.id 
      ORDER BY d.id DESC
    `);
    res.json(riders.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching riders' });
  }
});

router.patch('/riders/:id/kyc', async (req: Request, res: Response) => {
  try {
    const { id_proof_status, dl_status, rc_status, is_active } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    let idx = 1;

    if (id_proof_status !== undefined) {
      updateFields.push(`id_proof_status = $${idx++}`);
      updateValues.push(id_proof_status);
    }
    if (dl_status !== undefined) {
      updateFields.push(`dl_status = $${idx++}`);
      updateValues.push(dl_status);
    }
    if (rc_status !== undefined) {
      updateFields.push(`rc_status = $${idx++}`);
      updateValues.push(rc_status);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${idx++}`);
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(req.params.id);
    const query = `UPDATE delivery_partners SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const rider = await pool.query(query, updateValues);
    res.json(rider.rows[0]);
  } catch (error) {
    logger.error('Error updating kyc', error);
    res.status(500).json({ message: 'Error updating kyc' });
  }
});

// 6. Broadcast Notifications
import { notificationService } from '../services/notification';

router.post('/notifications/send', async (req: Request, res: Response) => {
  try {
    const { title, message, segment, imageUrl } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    let query = '';
    // Select users based on segment
    if (segment === 'customers') {
      query = `SELECT id, fcm_token FROM users`;
    } else if (segment === 'merchants') {
      query = `SELECT u.id, u.fcm_token FROM users u JOIN vendors v ON u.id = v.user_id`;
    } else if (segment === 'riders') {
      query = `SELECT u.id, u.fcm_token FROM users u JOIN delivery_partners dp ON u.id = dp.user_id`;
    } else {
      // all
      query = `SELECT id, fcm_token FROM users`;
    }

    const result = await pool.query(query);
    const users = result.rows;

    if (users.length === 0) {
      return res.status(200).json({ success: true, message: 'No users found to broadcast.', count: 0 });
    }

    // Insert notifications in DB with 24h expiry
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertQuery = `
        INSERT INTO notifications (user_id, title, body, type, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
      `;
      for (const u of users) {
        await client.query(insertQuery, [u.id, title, message, 'promo']);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('DB Insert failed for broadcast', err);
    } finally {
      client.release();
    }

    // Send push via Firebase (fire and forget for now, but ideally background job)
    const tokens = users.map(u => u.fcm_token).filter(Boolean);
    if (tokens.length > 0) {
       notificationService.broadcastToTokens(tokens, title, message, {
         type: 'broadcast',
         imageUrl: imageUrl || ''
       }).catch(console.error);
    }

    // Also broadcast via socket for those who have the app open
    req.app.get('io').emit('admin_notification', { title, message });
    
    res.json({ success: true, message: 'Notification broadcasted successfully', count: tokens.length });
  } catch (error) {
    logger.error('Error broadcasting notification', error);
    res.status(500).json({ message: 'Error broadcasting notification' });
  }
});

// 7. Support System
router.get('/support/tickets', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as user_name, u.phone_number 
      FROM support_tickets t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.updated_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching admin tickets', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

router.post('/support/tickets/:id/reply', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Ensure ticket exists
    const ticketRes = await pool.query('SELECT status FROM support_tickets WHERE id = $1', [ticketId]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const result = await pool.query(
      'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES ($1, $2, $3) RETURNING *',
      [ticketId, 'admin', message]
    );

    await pool.query('UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [ticketId]);

    // Broadcast to the support room so the user sees it instantly
    req.app.get('io').to(`support_${ticketId}`).emit('support_message', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error sending admin reply', error);
    res.status(500).json({ message: 'Error sending reply' });
  }
});

router.patch('/support/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body; // 'open' or 'closed'
    
    await pool.query('UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, ticketId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

export default router;
