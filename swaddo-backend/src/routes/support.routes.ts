import express from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Get the current user's active/past support tickets
 */
router.get('/tickets', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

/**
 * Create a new support ticket
 */
router.post('/tickets', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { subject, initialMessage } = req.body;

    if (!subject || !initialMessage) {
      return res.status(400).json({ error: 'Subject and initial message are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const ticketRes = await client.query(
        'INSERT INTO support_tickets (user_id, subject) VALUES ($1, $2) RETURNING *',
        [userId, subject]
      );
      const ticket = ticketRes.rows[0];

      await client.query(
        'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES ($1, $2, $3)',
        [ticket.id, 'user', initialMessage]
      );

      await client.query('COMMIT');
      res.status(201).json(ticket);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

/**
 * Get messages for a specific ticket
 */
router.get('/tickets/:id/messages', authenticate, async (req: any, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;

    // Verify ownership
    const ticketRes = await pool.query('SELECT user_id FROM support_tickets WHERE id = $1', [ticketId]);
    if (ticketRes.rows.length === 0 || ticketRes.rows[0].user_id !== userId) {
      return res.status(404).json({ error: 'Ticket not found or unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Send a message to an existing ticket
 */
router.post('/tickets/:id/messages', authenticate, async (req: any, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify ownership
    const ticketRes = await pool.query('SELECT user_id, status FROM support_tickets WHERE id = $1', [ticketId]);
    if (ticketRes.rows.length === 0 || ticketRes.rows[0].user_id !== userId) {
      return res.status(404).json({ error: 'Ticket not found or unauthorized' });
    }

    if (ticketRes.rows[0].status === 'closed') {
      return res.status(400).json({ error: 'Cannot send message to a closed ticket' });
    }

    const result = await pool.query(
      'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES ($1, $2, $3) RETURNING *',
      [ticketId, 'user', message]
    );
    
    // Update ticket updated_at
    await pool.query('UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [ticketId]);

    // Broadcast to the support room so admin sees it instantly
    const io = req.app.get('io');
    if (io) {
      io.to(`support_${ticketId}`).emit('support_message', result.rows[0]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export const supportRoutes = router;
