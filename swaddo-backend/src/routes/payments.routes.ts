import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { orderQueue } from '../services/queue';
import { emitOrderStatusUpdate } from '../utils/socketEmitters';
import { logger } from '../utils/logger';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock'
});

// 1. Create Order (Swaddo Order + Razorpay Order)
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { stallId, totalAmount, deliveryAddress, items } = req.body;
    
    if (!stallId) return res.status(400).json({ message: 'Missing required field: stallId' });
    if (totalAmount === undefined) return res.status(400).json({ message: 'Missing required field: totalAmount' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing or empty required field: items' });
    }

    // Check Open Status
    const stallRes = await pool.query('SELECT is_open FROM stalls WHERE id = $1', [stallId]);
    if (stallRes.rows.length === 0) {
      return res.status(404).json({ message: 'Stall not found' });
    }
    if (!stallRes.rows[0].is_open) {
      return res.status(400).json({ message: 'Stall is currently not accepting orders' });
    }

    await client.query('BEGIN');

    // Create Swaddo Order with status payment_pending
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, stall_id, total_amount, delivery_address, status, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user!.id, stallId, totalAmount, deliveryAddress, 'payment_pending', 'upi']
    );
    const swaddoOrder = orderRes.rows[0];

    // Insert Order Items
    const itemValuesList: any[] = [];
    const placeholders: string[] = [];
    items.forEach((item: any, index: number) => {
      if (!item.id || item.quantity === undefined || item.price === undefined) {
        throw new Error(`Item at index ${index} is missing required fields (id, quantity, or price)`);
      }
      const menuId = parseInt(item.id.toString().split('-')[0], 10);
      if (isNaN(menuId)) throw new Error(`Invalid menu item ID format: ${item.id}`);

      const baseIndex = index * 4;
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
      itemValuesList.push(swaddoOrder.id, menuId, item.quantity, item.price);
    });

    await client.query(`INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ${placeholders.join(',')}`, itemValuesList);

    // Create Razorpay Order
    const options = {
      amount: Math.round(Number(totalAmount) * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `rcpt_${swaddoOrder.id}`
    };
    
    const rzpOrder = await razorpay.orders.create(options);

    // Save to payments table
    await client.query(
      `INSERT INTO payments (order_id, razorpay_order_id, amount, status) 
       VALUES ($1, $2, $3, $4)`,
      [swaddoOrder.id, rzpOrder.id, totalAmount, 'created']
    );

    await client.query('COMMIT');

    res.status(201).json({
      order_id: swaddoOrder.id,
      razorpay_order_id: rzpOrder.id,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    logger.error('Payment Create Order Failed', { error: err.message, stack: err.stack, body: req.body });
    
    if (err.message?.includes('missing required fields') || err.message?.includes('Invalid menu item ID')) {
      return res.status(400).json({ message: 'Invalid order payload format', error: err.message });
    }
    res.status(500).json({ message: 'Internal server error', error: err.message || String(err) });
  } finally {
    client.release();
  }
});

// 2. Verify Payment
router.post('/verify', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { swaddo_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!swaddo_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    // Verify HMAC signature securely
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    await client.query('BEGIN');

    // Update payments table
    await client.query(
      `UPDATE payments SET razorpay_payment_id = $1, status = $2, verified_at = CURRENT_TIMESTAMP 
       WHERE razorpay_order_id = $3`,
      [razorpay_payment_id, 'captured', razorpay_order_id]
    );

    // Update orders table
    const orderRes = await client.query(
      `UPDATE orders SET status = 'placed' WHERE id = $1 RETURNING *`,
      [swaddo_order_id]
    );
    const order = orderRes.rows[0];

    // Trigger Notifications & Assignment
    const itemsRes = await client.query(`
      SELECT oi.quantity, mi.name 
      FROM order_items oi 
      JOIN menu_items mi ON oi.menu_item_id = mi.id 
      WHERE oi.order_id = $1
    `, [order.id]);
    
    let itemsDescription = itemsRes.rows.map(i => `${i.quantity}x ${i.name}`).join(', ');
    if (!itemsDescription) itemsDescription = "1x Custom Item";

    await orderQueue.add('process-order', { orderId: order.id, stallId: order.stall_id });

    const userRes = await client.query('SELECT name, phone FROM users WHERE id = $1', [req.user!.id]);
    const customerFullName = userRes.rows[0]?.name || 'Customer';
    const customerPhone = userRes.rows[0]?.phone || 'N/A';

    await client.query('COMMIT');

    const merchantPayload = {
      customer: customerFullName.split(' ')[0],
      phone: customerPhone,
      address: order.delivery_address || "Customer Location",
      items: itemsDescription,
      total: order.total_amount,
      time: new Date(order.created_at).toLocaleTimeString(),
      date: new Date(order.created_at).toLocaleDateString(),
      created_at: order.created_at
    };
    emitOrderStatusUpdate(req.app, order.id, order.stall_id, 'pending', merchantPayload);

    res.status(200).json({ message: 'Payment verified successfully' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    logger.error('Payment Verification Failed', { error: err.message, stack: err.stack, body: req.body });
    res.status(500).json({ message: 'Internal server error', error: err.message });
  } finally {
    client.release();
  }
});

// 3. Webhook (Async backup)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'mock';
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (signature) {
      const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
      if (expectedSignature !== signature) {
        return res.status(400).send('Invalid signature');
      }
    }

    if (req.body.event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      // const razorpay_order_id = paymentEntity.order_id;
      const razorpay_payment_id = paymentEntity.id;

      // Note: Full logic for updating order would go here if not already verified by frontend
      logger.info(`Webhook received captured payment: ${razorpay_payment_id}`);
    }

    res.status(200).send('OK');
  } catch (err: any) {
    logger.error('Webhook Error', { error: err.message });
    res.status(500).send('Webhook Error');
  }
});

// 4. Refund
router.post('/:id/refund', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // swaddo order ID
    const paymentRes = await pool.query('SELECT * FROM payments WHERE order_id = $1 AND status = $2', [id, 'captured']);
    
    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: 'No captured payment found for this order' });
    }

    const payment = paymentRes.rows[0];
    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: req.body.amount ? Math.round(Number(req.body.amount) * 100) : undefined // optional partial amount
    });

    await pool.query('UPDATE payments SET status = $1 WHERE id = $2', ['refunded', payment.id]);
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['cancelled', id]);

    res.status(200).json({ message: 'Refund initiated successfully', refund });
  } catch (err: any) {
    logger.error('Refund Failed', { error: err.message });
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

export default router;
