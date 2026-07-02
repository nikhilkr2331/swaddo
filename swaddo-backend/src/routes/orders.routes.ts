import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { orderQueue } from '../services/queue';
import { rateLimit } from 'express-rate-limit';
import { assignmentManager } from '../services/assignment';
import { emitOrderStatusUpdate } from '../utils/socketEmitters';
import { googleRouteETA } from '../services/googlemaps.service';
import { logger } from '../utils/logger';

const router = Router();

// Helper for IDOR checks
async function verifyOrderAccess(orderId: string, user: { id: number, role: string }): Promise<{ authorized: boolean, message?: string, status?: number }> {
  if (user.role === 'admin') return { authorized: true };
  
  const res = await pool.query(`
    SELECT o.customer_id, s.vendor_id, da.delivery_partner_id 
    FROM orders o 
    LEFT JOIN stalls s ON o.stall_id = s.id 
    LEFT JOIN delivery_assignments da ON da.order_id = o.id 
    WHERE o.id = $1
  `, [orderId]);
  
  if (res.rows.length === 0) return { authorized: false, message: "We couldn't find the order you're looking for.", status: 404 };
  const order = res.rows[0];
  
  if (user.role === 'customer') {
    if (order.customer_id !== user.id) return { authorized: false, message: "This order doesn't seem to belong to you. Please check your active orders.", status: 403 };
  } else if (user.role === 'vendor') {
    const vRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1 LIMIT 1', [user.id]);
    if (vRes.rows.length === 0 || vRes.rows[0].id !== order.vendor_id) return { authorized: false, message: "You don't have permission to view or modify this stall's order.", status: 403 };
  } else if (user.role === 'delivery') {
    const dRes = await pool.query('SELECT id FROM delivery_partners WHERE user_id = $1 LIMIT 1', [user.id]);
    if (dRes.rows.length === 0 || dRes.rows[0].id !== order.delivery_partner_id) return { authorized: false, message: "This order is not assigned to you.", status: 403 };
  }
  
  return { authorized: true };
}

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { message: 'Too many orders placed, please wait.' }
});

router.post('/', authenticate, orderLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { stallId, totalAmount, deliveryAddress, items, paymentMethod, deliveryLat, deliveryLng, customerPhone, deliveryInstructions, restaurantInstructions } = req.body;
    
    // 1. Validate payload
    if (!stallId) return res.status(400).json({ message: 'Missing required field: stallId' });
    if (totalAmount === undefined) return res.status(400).json({ message: 'Missing required field: totalAmount' });
    if (!deliveryLat || !deliveryLng) return res.status(400).json({ message: 'Missing required field: deliveryLat or deliveryLng' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing or empty required field: items' });
    }
    
    const isCod = paymentMethod === 'cod';
    const initialStatus = isCod ? 'placed' : 'payment_pending';
    
    // Haversine Distance Check and Open Status
    const stallRes = await client.query('SELECT latitude, longitude, is_open FROM stalls WHERE id = $1', [stallId]);
    if (stallRes.rows.length === 0) {
      return res.status(404).json({ message: 'Stall not found' });
    }
    const stallLoc = stallRes.rows[0];
    
    if (!stallLoc.is_open) {
      return res.status(400).json({ message: 'Stall is currently not accepting orders' });
    }
    
    if (stallLoc.latitude && stallLoc.longitude) {
      const R = 6371; // km
      const dLat = (deliveryLat - stallLoc.latitude) * Math.PI / 180;
      const dLon = (deliveryLng - stallLoc.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(stallLoc.latitude * Math.PI / 180) * Math.cos(deliveryLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance > 12) {
        return res.status(400).json({ message: 'Delivery is unavailable for this location. Distance exceeds 12 km.' });
      }
    }
    
    await client.query('BEGIN');
    
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, stall_id, total_amount, delivery_address, delivery_lat, delivery_lng, status, payment_method, customer_phone, delivery_instructions, restaurant_instructions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.user!.id, stallId, totalAmount, deliveryAddress, deliveryLat, deliveryLng, initialStatus, paymentMethod || 'upi', customerPhone || null, deliveryInstructions || null, restaurantInstructions || null]
    );
    const order = orderRes.rows[0];

    // If items are provided, insert them into order_items
    let itemsDescription = "1x Custom Item";
    
    // Parameterized batch insert
    const itemValuesList: any[] = [];
    const placeholders: string[] = [];
    
    items.forEach((item: any, index: number) => {
      if (!item.id || item.quantity === undefined || item.price === undefined) {
        throw new Error(`Item at index ${index} is missing required fields (id, quantity, or price)`);
      }
      
      // Extract the integer ID (e.g., "2-large" becomes 2) to fix the 'column does not exist' variant issue
      const menuId = parseInt(item.id.toString().split('-')[0], 10);
      
      if (isNaN(menuId)) {
         throw new Error(`Invalid menu item ID format: ${item.id}`);
      }

      const baseIndex = index * 4;
      placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
      itemValuesList.push(order.id, menuId, item.quantity, item.price);
    });

    await client.query(`INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ${placeholders.join(',')}`, itemValuesList);
    
    itemsDescription = items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');

    // Background job: Send to BullMQ for notifications and assignment
    await orderQueue.add('process-order', { orderId: order.id, stallId });

    // Retrieve customer details for privacy-focused payload
    const userRes = await client.query('SELECT name, phone FROM users WHERE id = $1', [req.user!.id]);
    const customerFullName = userRes.rows[0]?.name || 'Customer';
    const customerFirstName = customerFullName.split(' ')[0];
    const dbCustomerPhone = userRes.rows[0]?.phone || 'N/A';

    await client.query('COMMIT');
    
    // Only emit to targeted channels if it's COD (placed). For UPI, we emit after payment verification.
    if (isCod) {
      const merchantPayload = {
        customer: customerFirstName,
        phone: customerPhone || dbCustomerPhone,
        address: deliveryAddress || "Customer Location",
        deliveryInstructions: deliveryInstructions || null,
        restaurantInstructions: restaurantInstructions || null,
        items: itemsDescription,
        total: totalAmount,
        time: new Date(order.created_at).toLocaleTimeString(),
        date: new Date(order.created_at).toLocaleDateString(),
        created_at: order.created_at
      };
      emitOrderStatusUpdate(req.app, order.id, stallId, 'pending', merchantPayload);
    }

    // Respond immediately, don't wait for background jobs
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err: any) {
    await client.query('ROLLBACK');
    logger.error('Order Creation Failed', { 
      error: err.message, 
      stack: err.stack,
      body: req.body 
    });

    // 400 Bad Request for validation errors caught manually
    if (err.message?.includes('missing required fields') || err.message?.includes('Invalid menu item ID')) {
      return res.status(400).json({ 
        message: 'Invalid order payload format', 
        error: err.message 
      });
    }

    res.status(500).json({ message: 'Internal server error', error: err.message || String(err) });
  } finally {
    client.release();
  }
});

router.get('/:id/locations', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // IDOR Check
    const access = await verifyOrderAccess(id, req.user!);
    if (!access.authorized) return res.status(access.status || 403).json({ message: access.message });
    
    // Check if order exists and fetch stall coordinates
    const result = await pool.query(`
      SELECT o.id, s.latitude, s.longitude 
      FROM orders o
      JOIN stalls s ON o.stall_id = s.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: "We couldn't find the order you're looking for." });
    
    const stall = result.rows[0];

    const stallLocation = { 
      lat: Number(stall.latitude) || 25.611, 
      lng: Number(stall.longitude) || 85.130 
    };
    
    const customerLocation = { 
      lat: 25.590, 
      lng: 85.140 
    };

    res.json({
      stallLocation,
      customerLocation
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // IDOR Check
    const access = await verifyOrderAccess(id, req.user!);
    if (!access.authorized) return res.status(access.status || 403).json({ message: access.message });

    if (req.user!.role === 'customer') {
      return res.status(403).json({ message: 'Customers are not permitted to update order statuses.' });
    }
    
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ message: "We couldn't find the order you're looking for." });
    const order = result.rows[0];

    // If status is ready, emit job_offer to delivery riders
    if (status === 'ready') {
      const stallRes = await pool.query('SELECT name, location, latitude, longitude FROM stalls WHERE id = $1', [order.stall_id]);
      const stall = stallRes.rows[0];
      
      let dropoffDistance = 3.5; // fallback
      let dropoffText = "3.5 km";
      if (stall && stall.latitude && stall.longitude && order.delivery_lat && order.delivery_lng) {
        try {
          const googleRes = await googleRouteETA(stall.latitude, stall.longitude, order.delivery_lat, order.delivery_lng);
          if (googleRes && googleRes.distanceKm) {
            dropoffDistance = googleRes.distanceKm;
            dropoffText = dropoffDistance.toFixed(1) + " km";
          }
        } catch (error) {
          console.error("Google Maps Route failed for job dispatch, using fallback", error);
        }
      }

      // Calculate earnings based on slab logic
      function calculateEarnings(dist: number) {
          let fee = 15;
          if (dist <= 1.4) {
            fee = 15;
          } else if (dist <= 2.0) {
            fee = 15 + ((dist - 1.4) / 0.6) * 4;
          } else if (dist <= 3.0) {
            fee = 19 + ((dist - 2.0) / 1.0) * 5;
          } else if (dist <= 4.0) {
            fee = 24 + ((dist - 3.0) / 1.0) * 6;
          } else {
            fee = 30 + ((dist - 4.0) / 1.0) * 6;
          }
          return Math.round(fee * 100) / 100;
        }

        const earnings = calculateEarnings(dropoffDistance);
        
        function calculateReturnPayout(dist: number) {
            let pay = 0;
            if (dist > 3.0 && dist <= 3.5) {
              pay = ((dist - 3.0) / 0.5) * 3;
            } else if (dist > 3.5) {
              // 3rs for up to 3.5km, plus up to 10rs for the 3.5-4.5km bracket
              const extraDist = Math.min(dist, 4.5) - 3.5;
              pay = 3 + (extraDist / 1.0) * 10; 
            }
            return Math.round(pay * 100) / 100;
          }
        
        const returnPayout = calculateReturnPayout(dropoffDistance);

      const payload = {
        id: 'job_' + order.id,
        orderId: order.id,
        stallName: stall?.name || ("Stall #" + order.stall_id),
        stallAddress: stall?.location || "Food Court",
        stallLat: stall?.latitude,
        stallLng: stall?.longitude,
        pickupDistance: null, // This will be injected by AssignmentManager based on exact GPS
        customerAddress: order.delivery_address || "Customer Location",
        deliveryInstructions: order.delivery_instructions,
        restaurantInstructions: order.restaurant_instructions,
        dropoffDistance: parseFloat(dropoffDistance.toFixed(1)),
        earnings: earnings,
        returnPayout: returnPayout
      };
      
      // Start the staggered ringing process (120000ms = 2 mins per rider)
      assignmentManager.startJobRing(payload, 120000);
      console.log(`[AssignmentManager] Job ring started for order ${order.id} with earnings ${earnings}`);
    }

    // Emit to targeted channels
    emitOrderStatusUpdate(req.app, order.id, order.stall_id, status);

    // If status is delivered, update the assignment earnings
    if (status === 'delivered') {
      await pool.query(
        `UPDATE delivery_assignments 
         SET status = 'completed', 
             delivered_at = CURRENT_TIMESTAMP,
             earnings_amount = CASE 
                WHEN delivery_distance_km <= 2.4 THEN 20.00
                WHEN delivery_distance_km <= 3.0 THEN 25.00
                WHEN delivery_distance_km <= 4.0 THEN 30.00
                WHEN delivery_distance_km <= 5.0 THEN 35.00
                ELSE 35.00 + CEIL(delivery_distance_km - 5.0) * 5.00
             END
         WHERE order_id = $1`,
        [order.id]
      );
      console.log(`[Database] Delivery assignment for order ${order.id} marked completed with earnings.`);
    }

    if (status === 'delivered' || status === 'cancelled') {
      // Find the rider id (user_id) for this order and free them
      try {
        const assignmentRes = await pool.query(
          `SELECT dp.user_id 
           FROM delivery_assignments da 
           JOIN delivery_partners dp ON da.delivery_partner_id = dp.id 
           WHERE da.order_id = $1`, 
          [order.id]
        );
        if (assignmentRes.rows.length > 0) {
          const riderUserId = assignmentRes.rows[0].user_id;
          assignmentManager.markRiderAvailable(riderUserId);
        }
      } catch (err) {
        console.error("Error freeing rider:", err);
      }
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/confirm-cash-collected', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if the order is COD
    const orderRes = await pool.query('SELECT payment_method FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ message: "We couldn't find the order you're looking for." });
    
    if (orderRes.rows[0].payment_method !== 'cod') {
      return res.status(400).json({ message: 'Order is not Cash on Delivery' });
    }

    // Update delivery assignments cash_collected flag
    await pool.query(
      `UPDATE delivery_assignments 
       SET cash_collected = true 
       WHERE order_id = $1 AND delivery_partner_id = (SELECT id FROM delivery_partners WHERE user_id = $2 LIMIT 1)`,
      [id, req.user!.id]
    );

    // Note: payment_status is not a column in orders table, we rely on cash_collected flag

    res.json({ message: 'Cash collection confirmed' });
  } catch (err) {
    next(err);
  }
});
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // IDOR Check
    const access = await verifyOrderAccess(id, req.user!);
    if (!access.authorized) return res.status(access.status || 403).json({ message: access.message });
    
    const query = `
      SELECT o.*, 
             s.name as stall_name, s.latitude as stall_lat, s.longitude as stall_lng, u_vendor.phone as stall_phone, s.location as stall_address,
             u.name as customer_name, u.phone as customer_phone,
             (
               SELECT string_agg(oi.quantity || 'x ' || mi.name, ', ')
               FROM order_items oi
               LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
               WHERE oi.order_id = o.id
             ) as items_summary,
             da.earnings_amount,
             u2.name as rider_name, u2.phone as rider_phone, dp.vehicle_details as rider_vehicle, u2.id as rider_user_id
      FROM orders o
      LEFT JOIN stalls s ON o.stall_id = s.id
      LEFT JOIN users u_vendor ON s.vendor_id = u_vendor.id
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN delivery_assignments da ON o.id = da.order_id
      LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
      LEFT JOIN users u2 ON dp.user_id = u2.id
      WHERE o.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "We couldn't find the order you're looking for." });
    }
    
    const r = result.rows[0];
    
    const formatted = {
      id: r.id.toString(),
      status: r.status,
      total: r.total_amount,
      items: r.items_summary || 'Order Items',
      deliveryAddress: r.delivery_address,
      deliveryLat: Number(r.delivery_lat),
      deliveryLng: Number(r.delivery_lng),
      paymentMethod: r.payment_method,
      totalAmount: r.total_amount,
      earnings: r.earnings_amount || 45,
      customer: {
        name: r.customer_name || 'Customer',
        phone: r.customer_phone || 'N/A',
        instructions: r.delivery_instructions
      },
      stall: {
        name: r.stall_name || 'Stall',
        address: r.stall_address || 'Food Court',
        phone: r.stall_phone || 'N/A',
        lat: Number(r.stall_lat) || 25.611,
        lng: Number(r.stall_lng) || 85.130
      },
      rider: r.rider_name ? {
        name: r.rider_name,
        phone: r.rider_phone || 'N/A',
        vehicle: r.rider_vehicle || 'Not provided'
      } : null,
      riderLocation: null as any
    };

    if (r.rider_name && r.rider_user_id) {
       try {
         const { redis } = require('../redis');
         const locStr = await redis.get(`rider_loc:${r.rider_user_id}`);
         if (locStr) {
           const parsed = JSON.parse(locStr);
           formatted.riderLocation = { lat: parsed.latitude, lng: parsed.longitude };
         }
       } catch (e) {
           console.error("Redis fetch error for rider_loc", e);
       }
    }

    res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    let query = '';
    let params: any[] = [];

    if (req.user!.role === 'customer') {
      query = `
        SELECT o.*, s.name as stall_name, s.location as stall_location,
        (
          SELECT string_agg(oi.quantity || 'x ' || mi.name, ', ')
          FROM order_items oi
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = o.id
        ) as items_summary
        FROM orders o
        LEFT JOIN stalls s ON o.stall_id = s.id
        WHERE o.customer_id = $1
        ORDER BY o.created_at DESC LIMIT $2 OFFSET $3
      `;
      params = [req.user!.id, limit, offset];
    } else if (req.user!.role === 'vendor') {
      query = `
        SELECT o.*, u.name as customer_name, u.phone as customer_phone, s.name as stall_name,
        (
          SELECT string_agg(oi.quantity || 'x ' || mi.name, ', ')
          FROM order_items oi
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = o.id
        ) as items_summary,
        u2.name as rider_name, u2.phone as rider_phone, dp.vehicle_details as rider_vehicle
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN stalls s ON o.stall_id = s.id
        LEFT JOIN delivery_assignments da ON o.id = da.order_id
        LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
        LEFT JOIN users u2 ON dp.user_id = u2.id
        WHERE o.stall_id = (SELECT s2.id FROM stalls s2 JOIN vendors v ON s2.vendor_id = v.id WHERE v.user_id = $1 LIMIT 1)
        ORDER BY o.created_at DESC LIMIT $2 OFFSET $3
      `;
      params = [req.user!.id, limit, offset];
    } else if (req.user!.role === 'delivery') {
      query = `
        SELECT o.*, u.name as customer_name, u.phone as customer_phone, s.name as stall_name, s.location as stall_address,
        (
          SELECT string_agg(oi.quantity || 'x ' || mi.name, ', ')
          FROM order_items oi
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = o.id
        ) as items_summary,
        u2.name as rider_name, u2.phone as rider_phone, dp.vehicle_details as rider_vehicle
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN stalls s ON o.stall_id = s.id
        LEFT JOIN delivery_assignments da ON o.id = da.order_id
        LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
        LEFT JOIN users u2 ON dp.user_id = u2.id
        WHERE dp.user_id = $1
        ORDER BY o.created_at DESC LIMIT $2 OFFSET $3
      `;
      params = [req.user!.id, limit, offset];
    } else {
      // Admin gets all orders
      query = `
        SELECT o.*, u.name as customer_name, u.phone as customer_phone, s.name as stall_name,
        (
          SELECT string_agg(oi.quantity || 'x ' || mi.name, ', ')
          FROM order_items oi
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = o.id
        ) as items_summary,
        u2.name as rider_name, u2.phone as rider_phone, dp.vehicle_details as rider_vehicle
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        LEFT JOIN stalls s ON o.stall_id = s.id
        LEFT JOIN delivery_assignments da ON o.id = da.order_id
        LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
        LEFT JOIN users u2 ON dp.user_id = u2.id
        ORDER BY o.created_at DESC LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    
    // Format for dashboard and customer profile
    const formatted = result.rows.map(r => ({
      id: r.id.toString(),
      customer: (r.customer_name || 'Customer').split(' ')[0],
      phone: r.customer_phone || 'N/A',
      stall: r.stall_name || 'Stall',
      items: r.items_summary || '1x Custom Item',
      status: r.status === 'placed' ? 'pending' : r.status,
      total: r.total_amount,
      time: new Date(r.created_at).toLocaleTimeString(),
      date: new Date(r.created_at).toLocaleDateString(),
      created_at: r.created_at,
      address: r.delivery_address || 'Customer Location',
      deliveryInstructions: r.delivery_instructions,
      restaurantInstructions: r.restaurant_instructions,
      ...(r.rider_name ? {
        deliveryPartner: {
          name: r.rider_name,
          phone: r.rider_phone || 'N/A',
          vehicle: r.rider_vehicle || 'Not provided'
        }
      } : {})
    }));

    res.json({ data: formatted, page, limit });
  } catch (err) {
    next(err);
  }
});

export default router;
