import { Router, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticate, requireDelivery, AuthRequest } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { redis } from '../redis';
import { assignmentManager } from '../services/assignment';
import { googleRouteETA } from '../services/googlemaps.service';
import { emitOrderStatusUpdate } from '../utils/socketEmitters';

const router = Router();
router.get('/profile', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partnerRes = await pool.query(
      `SELECT dp.*, u.name, u.phone 
       FROM delivery_partners dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.user_id = $1 LIMIT 1`, 
      [userId]
    );
    
    if (partnerRes.rows.length === 0) {
      return res.json({ active: false });
    }
    
    const partner = partnerRes.rows[0];
    const partnerId = partner.id;

    // Fetch deposit history
    const depositRes = await pool.query(`
      SELECT amount, created_at as date, status
      FROM deposit_history
      WHERE delivery_partner_id = $1
      ORDER BY created_at DESC LIMIT 10
    `, [partnerId]);

    // Fetch online sessions
    const sessionRes = await pool.query(`
      SELECT date, online_minutes
      FROM rider_daily_stats
      WHERE delivery_partner_id = $1
      ORDER BY date DESC LIMIT 7
    `, [partnerId]);

    res.json({ data: {
      name: partner.name,
      phone: partner.phone,
      vehicle: partner.vehicle_details || 'Bike',
      active: partner.is_active,
      kycStatus: partner.is_active ? 'verified' : 'pending',
      documents: {
        aadhar: partner.id_proof_status || 'verified',
        license: partner.dl_status || 'verified',
        rc: partner.rc_status || 'verified'
      },
      bankDetails: {
        bankName: partner.bank_name || '',
        accountName: partner.account_name || '',
        accountNumber: partner.account_number || '',
        ifscCode: partner.ifsc_code || ''
      },
      depositHistory: depositRes.rows,
      onlineSessions: sessionRes.rows
    }});
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, vehicle, bankDetails } = req.body;
    
    // Update name in users
    if (name) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
    }
    
    // Update vehicle in delivery_partners
    if (vehicle) {
      await pool.query('UPDATE delivery_partners SET vehicle_details = $1 WHERE user_id = $2', [vehicle, userId]);
    }
    
    if (bankDetails) {
      await pool.query(
        'UPDATE delivery_partners SET bank_name = $1, account_name = $2, account_number = $3, ifsc_code = $4 WHERE user_id = $5',
        [bankDetails.bankName, bankDetails.accountName, bankDetails.accountNumber, bankDetails.ifscCode, userId]
      );
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
});

const gpsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60, // 1 ping per second
  message: { message: 'GPS ping rate limit exceeded' }
});

router.post('/ping', authenticate, requireDelivery, gpsLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, orderId } = req.body;
    
    // Store latest GPS in Redis for fast access by Socket.io
    await redis.set(`rider_loc:${req.user!.id}`, JSON.stringify({ latitude: lat, longitude: lng, updated_at: new Date() }), { EX: 60 });

    // In a real app, you would publish this to Socket.io here or via a Redis PubSub channel
    
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});


router.patch('/assignments/:id/accept', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.id;
    const { riderId, lat, lng } = req.body;

    if (!riderId) {
      return res.status(400).json({ message: 'Rider ID is required' });
    }

    const success = assignmentManager.acceptJob(jobId, riderId);
    
    if (!success) {
      return res.status(400).json({ message: 'Job no longer available or already accepted by someone else.' });
    }

    // Extract real order ID from job string (e.g. "job_11" -> "11")
    const orderId = jobId.split('_')[1];

    const { pool } = require('../db');

    // Calculate Distances if lat/lng are provided
    let pickupDistance = null;
    let deliveryDistance = null;

    if (lat && lng) {
      try {
        const orderCoordsRes = await pool.query(
          `SELECT o.delivery_lat, o.delivery_lng, s.latitude as stall_lat, s.longitude as stall_lng 
           FROM orders o 
           JOIN stalls s ON o.stall_id = s.id 
           WHERE o.id = $1`, [orderId]
        );
        if (orderCoordsRes.rows.length > 0) {
          const coords = orderCoordsRes.rows[0];
          if (coords.stall_lat && coords.stall_lng) {
             const r = await googleRouteETA(lat, lng, coords.stall_lat, coords.stall_lng);
             pickupDistance = r?.distanceKm || null;
          }
          if (coords.stall_lat && coords.stall_lng && coords.delivery_lat && coords.delivery_lng) {
             const r = await googleRouteETA(coords.stall_lat, coords.stall_lng, coords.delivery_lat, coords.delivery_lng);
             deliveryDistance = r?.distanceKm || null;
          }
        }
      } catch (e) {
        console.error("Error calculating distances:", e);
      }
    }

    // INSERT into delivery_assignments to track earnings and distances
    await pool.query(
      `INSERT INTO delivery_assignments (order_id, delivery_partner_id, status, pickup_distance_km, delivery_distance_km)
       VALUES ($1, (SELECT id FROM delivery_partners WHERE user_id = $2), 'accepted', $3, $4)
       ON CONFLICT DO NOTHING`,
      [orderId, req.user!.id, pickupDistance, deliveryDistance]
    );

    // Update database status
    const updateRes = await pool.query(
      `UPDATE orders SET status = 'heading_to_stall' WHERE id = $1 RETURNING *`,
      [orderId]
    );

    // Fetch real rider info
    const riderRes = await pool.query(
      `SELECT u.name, u.phone, dp.vehicle_details 
       FROM delivery_partners dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.user_id = $1`,
      [req.user!.id]
    );

    let riderName = "Rider";
    let riderPhone = "N/A";
    let riderVehicle = "Not provided";

    if (riderRes.rows.length > 0) {
      riderName = riderRes.rows[0].name;
      riderPhone = riderRes.rows[0].phone;
      riderVehicle = riderRes.rows[0].vehicle_details;
    }

    if (updateRes.rows.length > 0) {
      const order = updateRes.rows[0];
      const extraData = {
        deliveryPartner: { name: riderName, phone: riderPhone, vehicle: riderVehicle }
      };
      
      // Emit to targeted channels via central helper!
      emitOrderStatusUpdate(req.app, order.id, order.stall_id, 'heading_to_stall', extraData);
    }
    
    res.json({ message: 'Job accepted successfully' });
  } catch (err) {
    next(err);
  }
});
// GET Dashboard Stats
router.get('/dashboard', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    const statsRes = await pool.query(`
      SELECT 
        COUNT(id) as total_deliveries,
        COALESCE(SUM(earnings_amount), 0) as total_earnings
      FROM delivery_assignments
      WHERE delivery_partner_id = $1 AND status = 'completed' AND DATE(delivered_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
    `, [partnerId]);

    // Floating Cash (All completed COD deliveries where cash_collected is true, assuming rider hasn't deposited yet)
    // In reality, you would subtract any deposits made by the rider.
    const floatRes = await pool.query(`
      SELECT COALESCE(SUM(o.total_amount), 0) as floating_cash
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.delivery_partner_id = $1 
        AND da.status = 'completed' 
        AND da.cash_collected = true 
        AND da.cash_deposited = false
        AND o.payment_method = 'cod'
    `, [partnerId]);

    // Get Online Minutes from rider_daily_stats
    const sessionRes = await pool.query(`
      SELECT online_minutes 
      FROM rider_daily_stats 
      WHERE delivery_partner_id = $1 AND date = CURRENT_DATE
    `, [partnerId]);
    
    let totalMinutes = sessionRes.rows.length > 0 ? sessionRes.rows[0].online_minutes : 0;
    
    res.json({
      deliveries: parseInt(statsRes.rows[0].total_deliveries),
      earnings: parseFloat(statsRes.rows[0].total_earnings),
      floatingCash: parseFloat(floatRes.rows[0].floating_cash),
      hours: totalMinutes, // Frontend will interpret this as total minutes and format it
    });
  } catch (err) {
    next(err);
  }
});

// POST Deposit Floating Cash
router.post('/deposit', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    // First, find how much cash is floating right now
    const floatRes = await pool.query(`
      SELECT COALESCE(SUM(o.total_amount), 0) as floating_cash
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.delivery_partner_id = $1 
        AND da.status = 'completed' 
        AND da.cash_collected = true 
        AND da.cash_deposited = false
        AND o.payment_method = 'cod'
    `, [partnerId]);

    const amount = parseFloat(floatRes.rows[0].floating_cash);

    if (amount > 0) {
      // Mark all currently collected but un-deposited cash as deposited
      const updateRes = await pool.query(`
        UPDATE delivery_assignments da
        SET cash_deposited = true
        FROM orders o
        WHERE da.order_id = o.id
          AND da.delivery_partner_id = $1
          AND da.status = 'completed'
          AND da.cash_collected = true
          AND da.cash_deposited = false
          AND o.payment_method = 'cod'
        RETURNING da.id
      `, [partnerId]);

      // Add to deposit history
      await pool.query(`
        INSERT INTO deposit_history (delivery_partner_id, amount, status)
        VALUES ($1, $2, 'completed')
      `, [partnerId, amount]);
    }

    res.json({ message: 'Cash successfully marked as deposited' });
  } catch (err) {
    next(err);
  }
});

// POST Ping Time
router.post('/ping-time', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    await pool.query(`
      INSERT INTO rider_daily_stats (delivery_partner_id, date, online_minutes) 
      VALUES ($1, CURRENT_DATE, 1) 
      ON CONFLICT (delivery_partner_id, date) 
      DO UPDATE SET online_minutes = rider_daily_stats.online_minutes + 1
    `, [partnerId]);

    res.json({ message: 'Ping recorded' });
  } catch (err) {
    next(err);
  }
});


// GET Earnings
router.get('/earnings', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    
    // Get Rider's delivery partner ID safely
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    // Fetch all completed assignments for this rider
    const earningsQuery = `
      SELECT da.id, da.earnings_amount, da.delivered_at, da.pickup_distance_km, da.delivery_distance_km, da.cash_collected,
             o.stall_id, o.payment_method, o.total_amount, s.name as stall_name
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      JOIN stalls s ON o.stall_id = s.id
      WHERE da.delivery_partner_id = $1 AND da.status = 'completed'
      ORDER BY da.delivered_at DESC
    `;
    const result = await pool.query(earningsQuery, [partnerId]);
    const deliveries = result.rows;

    const now = new Date();
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;

    // Daily breakdown for the past 7 days (including today)
    const dailyBreakdown = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split('T')[0], dayName: ['S','M','T','W','T','F','S'][d.getDay()], earnings: 0 };
    });

    const deliveryHistory = deliveries.map((d: any) => {
      const dDate = new Date(d.delivered_at || Date.now());
      const diffTime = Math.abs(now.getTime() - dDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const amount = parseFloat(d.earnings_amount || '0');

      if (diffDays === 0 && dDate.getDate() === now.getDate()) todayEarnings += amount;
      if (diffDays < 7) weekEarnings += amount;
      if (dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()) monthEarnings += amount;

      const dateStr = dDate.toISOString().split('T')[0];
      const dayData = dailyBreakdown.find(day => day.date === dateStr);
      if (dayData) dayData.earnings += amount;

      const pickupKm = parseFloat(d.pickup_distance_km || '0');
      const deliveryKm = parseFloat(d.delivery_distance_km || '0');
      const totalDist = (pickupKm + deliveryKm).toFixed(1);
      
      const pickupFee = Math.max(5, Math.round(pickupKm * 3));
      const dropFee = Math.max(10, Math.round(deliveryKm * 5));
      const returnFee = 0; // standard placeholder
      
      const isCod = d.payment_method === 'cod';

      return {
        id: d.id.toString(),
        date: diffDays === 0 ? `Today, ${dDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : dDate.toLocaleDateString(),
        stall: d.stall_name,
        amount: amount,
        distance: `${totalDist} km`,
        breakdown: {
          pickup: pickupFee,
          drop: dropFee,
          return: returnFee
        },
        codAmount: isCod && d.cash_collected ? parseFloat(d.total_amount) : 0
      };
    });

    res.json({
      todayEarnings,
      weekEarnings,
      monthEarnings,
      dailyBreakdown: dailyBreakdown,
      deliveryHistory: deliveryHistory.slice(0, 20) // Pagination could be added here
    });

  } catch (err) {
    next(err);
  }
});

export default router;
