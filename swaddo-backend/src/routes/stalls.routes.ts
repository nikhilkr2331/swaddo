import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticate, requireVendor, AuthRequest } from '../middleware/auth';

const router = Router();

// Merchant Stats (Vendor Only)
router.get('/merchant/stats', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    // Get vendor id for this user
    const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1 LIMIT 1', [userId]);
    if (vendorRes.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    const vendorId = vendorRes.rows[0].id;

    // Get stall for this vendor
    let stallRes = await pool.query('SELECT id FROM stalls WHERE vendor_id = $1 LIMIT 1', [vendorId]);
    
    // Auto-create stall if it doesn't exist (for older testing accounts)
    if (stallRes.rows.length === 0) {
      stallRes = await pool.query('INSERT INTO stalls (vendor_id, name, location, is_open) VALUES ($1, $2, $3, $4) RETURNING id', [vendorId, '', '', false]);
    }
    const stallId = stallRes.rows[0].id;
    
    // Calculate stats for today
    const statsRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders, 
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN (oi.price_at_time * oi.quantity) ELSE 0 END), 0) as total_revenue
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.stall_id = $1 
      AND o.created_at >= CURRENT_DATE
    `, [stallId]);
    
    // Get avg rating from stall itself
    const ratingRes = await pool.query('SELECT rating FROM stalls WHERE id = $1', [stallId]);
    const avgRating = ratingRes.rows.length > 0 ? ratingRes.rows[0].rating : 4.5;
    
    const stats = statsRes.rows[0];
    res.json({
      stallId: stallId,
      ordersToday: parseInt(stats.total_orders) || 0,
      revenueToday: parseFloat(stats.total_revenue) || 0,
      avgRating: parseFloat(avgRating) || 4.5
    });
  } catch (err) {
    next(err);
  }
});

// Merchant Insights (Vendor Only)
router.get('/merchant/insights', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1 LIMIT 1', [userId]);
    if (vendorRes.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    const vendorId = vendorRes.rows[0].id;
    
    const stallRes = await pool.query('SELECT id FROM stalls WHERE vendor_id = $1 LIMIT 1', [vendorId]);
    if (stallRes.rows.length === 0) return res.status(404).json({ message: 'Stall not found' });
    const stallId = stallRes.rows[0].id;

    const period = req.query.period as string || 'this_week';
    
    let dateFilter = 'CURRENT_DATE'; // default today
    let prevDateFilterStart = "CURRENT_DATE - INTERVAL '1 day'";
    let prevDateFilterEnd = "CURRENT_DATE - INTERVAL '1 day'";

    if (period === 'this_week') {
      dateFilter = "CURRENT_DATE - INTERVAL '6 days'";
      prevDateFilterStart = "CURRENT_DATE - INTERVAL '13 days'";
      prevDateFilterEnd = "CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'this_month') {
      dateFilter = "CURRENT_DATE - INTERVAL '29 days'";
      prevDateFilterStart = "CURRENT_DATE - INTERVAL '59 days'";
      prevDateFilterEnd = "CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === 'today') {
      dateFilter = "CURRENT_DATE";
      prevDateFilterStart = "CURRENT_DATE - INTERVAL '1 day'";
      prevDateFilterEnd = "CURRENT_DATE - INTERVAL '1 day'";
    }

    const statsRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders, 
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN (oi.price_at_time * oi.quantity) ELSE 0 END), 0) as total_revenue
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.stall_id = $1 AND DATE(o.created_at) >= ${dateFilter}
    `, [stallId]);

    const prevStatsRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders, 
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN (oi.price_at_time * oi.quantity) ELSE 0 END), 0) as total_revenue
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.stall_id = $1 AND DATE(o.created_at) >= ${prevDateFilterStart} AND DATE(o.created_at) <= ${prevDateFilterEnd}
    `, [stallId]);

    // For chart data (group by date)
    const chartRes = await pool.query(`
      SELECT 
        TO_CHAR(o.created_at, 'Mon DD') as label,
        COALESCE(SUM(oi.price_at_time * oi.quantity), 0) as revenue
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.stall_id = $1 AND o.status = 'delivered' AND DATE(o.created_at) >= ${dateFilter}
      GROUP BY TO_CHAR(o.created_at, 'Mon DD'), DATE(o.created_at)
      ORDER BY DATE(o.created_at) ASC
    `, [stallId]);

    // Top selling items
    const topItemsRes = await pool.query(`
      SELECT m.name, SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.stall_id = $1 AND DATE(o.created_at) >= ${dateFilter}
      GROUP BY m.id, m.name
      ORDER BY total_quantity DESC
      LIMIT 3
    `, [stallId]);

    const stats = statsRes.rows[0];
    const prevStats = prevStatsRes.rows[0];
    
    const currRev = parseFloat(stats.total_revenue) || 0;
    const prevRev = parseFloat(prevStats.total_revenue) || 0;
    const revGrowth = prevRev === 0 ? (currRev > 0 ? 100 : 0) : Math.round(((currRev - prevRev) / prevRev) * 100);

    const currOrders = parseInt(stats.total_orders) || 0;
    const prevOrders = parseInt(prevStats.total_orders) || 0;
    const ordersGrowth = prevOrders === 0 ? (currOrders > 0 ? 100 : 0) : Math.round(((currOrders - prevOrders) / prevOrders) * 100);

    res.json({
      totalRevenue: currRev,
      totalOrders: currOrders,
      growthRevenue: revGrowth,
      growthOrders: ordersGrowth,
      chartData: chartRes.rows.map(r => ({ label: r.label, value: parseFloat(r.revenue) })),
      topItems: topItemsRes.rows.map(r => ({ name: r.name, orders: parseInt(r.total_quantity) }))
    });
  } catch (err) {
    next(err);
  }
});

// Merchant Profile (Vendor Only)
router.get('/merchant/my-stall', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const vendorRes = await pool.query('SELECT * FROM vendors WHERE user_id = $1 LIMIT 1', [userId]);
    if (vendorRes.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    const vendor = vendorRes.rows[0];

    const stallRes = await pool.query('SELECT * FROM stalls WHERE vendor_id = $1 LIMIT 1', [vendor.id]);
    if (stallRes.rows.length === 0) return res.status(404).json({ message: 'Stall not found' });
    
    // Combine stall data with vendor business details
    const profile = {
      ...stallRes.rows[0],
      merchant_id: `MERCH-${vendor.id.toString().padStart(4, '0')}`,
      business_name: vendor.business_name,
      fssai_license: vendor.fssai_license,
      gst_number: vendor.gst_number,
      bank_account_name: vendor.bank_account_name,
      bank_account_number: vendor.bank_account_number,
      bank_ifsc: vendor.bank_ifsc,
      pan_number: vendor.pan_number,
      aadhaar_number: vendor.aadhaar_number
    };
    
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Update Merchant Settings (Vendor Only)
router.put('/merchant/profile', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { fssai_license, gst_number, bank_account_name, bank_account_number, bank_ifsc, pan_number, aadhaar_number } = req.body;
    
    const vendorRes = await pool.query(
      `UPDATE vendors 
       SET fssai_license = COALESCE($1, fssai_license), 
           gst_number = COALESCE($2, gst_number),
           bank_account_name = COALESCE($3, bank_account_name),
           bank_account_number = COALESCE($4, bank_account_number),
           bank_ifsc = COALESCE($5, bank_ifsc),
           pan_number = COALESCE($6, pan_number),
           aadhaar_number = COALESCE($7, aadhaar_number)
       WHERE user_id = $8 RETURNING *`,
      [fssai_license, gst_number, bank_account_name, bank_account_number, bank_ifsc, pan_number, aadhaar_number, userId]
    );

    if (vendorRes.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendorRes.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Merchant Payouts (Vendor Only)
router.get('/merchant/payouts', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1 LIMIT 1', [userId]);
    if (vendorRes.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    const vendorId = vendorRes.rows[0].id;

    const stallRes = await pool.query('SELECT id FROM stalls WHERE vendor_id = $1 LIMIT 1', [vendorId]);
    if (stallRes.rows.length === 0) return res.status(404).json({ message: 'Stall not found' });
    const stallId = stallRes.rows[0].id;
    
    const period = req.query.period as string || 'this_week';
    let dateFilter = "date_trunc('week', CURRENT_DATE)"; // default
    if (period === 'this_month') {
      dateFilter = "date_trunc('month', CURRENT_DATE)";
    } else if (period === 'today') {
      dateFilter = "CURRENT_DATE";
    }

    // Get order history grouped by date for the period
    const historyRes = await pool.query(`
      SELECT DATE(o.created_at) as date, COALESCE(SUM(oi.price_at_time * oi.quantity), 0) as amount, COUNT(DISTINCT o.id) as orders
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.stall_id = $1 AND o.status = 'delivered' AND o.created_at >= ${dateFilter}
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `, [stallId]);
    
    // Total available balance (sum of all un-paid-out orders)
    // Using mock logic: just sum all delivered
    const balRes = await pool.query(`
      SELECT SUM(oi.price_at_time * oi.quantity) as total 
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.stall_id=$1 AND o.status='delivered'
    `, [stallId]);
    const balance = parseFloat(balRes.rows[0]?.total || 0) * 0.8; // 80% payout (20% platform fee)

    res.json({
      availableBalance: balance,
      history: historyRes.rows.map(r => ({
        date: r.date,
        amount: parseFloat(r.amount) * 0.8,
        orders: parseInt(r.orders),
        status: 'completed'
      }))
    });
  } catch(err) {
    next(err);
  }
});

// Request Payout
router.post('/merchant/payouts/request', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Mocking payout request
    res.json({ message: "Payout request submitted successfully. It will be processed in 1-2 business days." });
  } catch(err) {
    next(err);
  }
});

// Search (Public)
router.get('/search/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string || '').toLowerCase();
    if (!q) return res.json({ restaurants: [], dishes: [] });

    const stallsRes = await pool.query(
      "SELECT id, name, tags, cover_image, rating, rating_count, location, is_open FROM stalls WHERE LOWER(name) LIKE $1 OR LOWER(tags) LIKE $1 LIMIT 10",
      [`%${q}%`]
    );

    const dishesRes = await pool.query(
      "SELECT m.id, m.name, m.price, m.is_veg, m.description, m.stall_id, s.name as stall_name, s.cover_image as stall_image, s.location, s.rating, s.rating_count, s.is_open FROM menu_items m JOIN stalls s ON m.stall_id = s.id WHERE LOWER(m.name) LIKE $1 LIMIT 30",
      [`%${q}%`]
    );

    res.json({
      restaurants: stallsRes.rows,
      dishes: dishesRes.rows
    });
  } catch (err) {
    next(err);
  }
});

// List Stalls (Public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    const { lat, lng, vegOnly } = req.query;

    let whereClause = vegOnly === 'true' ? 'WHERE is_pure_veg = true' : '';

    let query = `SELECT * FROM stalls ${whereClause} ORDER BY is_open DESC LIMIT $1 OFFSET $2`;
    let params: any[] = [limit, offset];

    if (lat && lng) {
      query = `
        SELECT *, 
        (6371 * acos(cos(radians($3)) * cos(radians(latitude)) * cos(radians(longitude) - radians($4)) + sin(radians($3)) * sin(radians(latitude)))) AS distance
        FROM stalls
        ${whereClause}
        ORDER BY is_open DESC, distance ASC
        LIMIT $1 OFFSET $2
      `;
      params.push(parseFloat(lat as string), parseFloat(lng as string));
    }

    const result = await pool.query(query, params);
    res.json({ data: result.rows, page, limit });
  } catch (err) { 
    next(err); 
  }
});

// Get Single Stall (Public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM stalls WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stall not found' });
    
    // Format to match frontend expectations
    const stall = result.rows[0];
    res.json({
      name: stall.name,
      rating: stall.rating || 4.5, // Fallback if 0
      ratingsCount: stall.rating_count ? `${stall.rating_count} RATINGS` : "120+ RATINGS",
      isOpen: stall.is_open,
      hours: `${stall.opening_time} - ${stall.closing_time}`,
      address: stall.location,
      latitude: stall.latitude,
      longitude: stall.longitude,
      image: stall.cover_image || `https://picsum.photos/seed/${stall.id}/800/400`,
      openingTime: stall.opening_time,
      closingTime: stall.closing_time,
      tags: stall.tags,
      prepTime: stall.prep_time,
      isPureVeg: stall.is_pure_veg
    });
  } catch (err) {
    next(err);
  }
});

// Create Stall (Vendor Only)
router.post('/', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, location } = req.body;
    // Note: requires vendor_id logic in real app
    const vendorRes = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user!.id]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }
    const vendorId = vendorRes.rows[0].id;

    const result = await pool.query(
      `INSERT INTO stalls (vendor_id, name, location)
       VALUES ($1, $2, $3) RETURNING *`,
      [vendorId, name, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// Update Stall (Vendor Only)
router.put('/:id', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, location, latitude, longitude, is_open, cover_image, opening_time, closing_time, prep_time, tags, offer_text, is_pure_veg } = req.body;
    
    // Verify ownership
    const check = await pool.query('SELECT s.* FROM stalls s JOIN vendors v ON s.vendor_id = v.id WHERE s.id = $1 AND v.user_id = $2', [id, req.user!.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pool.query(
      'UPDATE stalls SET name = COALESCE($1, name), location = COALESCE($2, location), latitude = COALESCE($3, latitude), longitude = COALESCE($4, longitude), is_open = COALESCE($5, is_open), cover_image = COALESCE($6, cover_image), opening_time = COALESCE($7, opening_time), closing_time = COALESCE($8, closing_time), prep_time = COALESCE($10, prep_time), tags = COALESCE($11, tags), offer_text = COALESCE($12, offer_text), is_pure_veg = COALESCE($13, is_pure_veg) WHERE id = $9 RETURNING *',
      [
        name ?? null, 
        location ?? null, 
        latitude ?? null, 
        longitude ?? null, 
        is_open ?? null, 
        cover_image ?? null, 
        opening_time ?? null, 
        closing_time ?? null, 
        id, 
        prep_time ?? null, 
        tags ?? null,
        offer_text ?? null,
        is_pure_veg ?? null
      ]
    );
    
    // Emit socket event to all clients
    req.app.get('io').emit('stall_update', result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (err) { 
    next(err); 
  }
});

// Get Menu Items for a Stall
router.get('/:id/menu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM menu_items WHERE stall_id = $1 ORDER BY id DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Add Menu Item (Vendor Only)
router.post('/:id/menu', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, price, is_veg, is_available, category } = req.body;
    
    // Verify ownership
    const check = await pool.query('SELECT s.* FROM stalls s JOIN vendors v ON s.vendor_id = v.id WHERE s.id = $1 AND v.user_id = $2', [id, req.user!.id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pool.query(
      'INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, description, price, is_veg, is_available ?? true, category]
    );
    
    const payload = {
      type: "item_added",
      item: result.rows[0],
      stallId: id
    };
    req.app.get('io').emit(`stall:${id}:menu`, payload);
    console.log(`[Socket Emit] Channel: stall:${id}:menu`, payload);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update Menu Item (Vendor Only)
router.put('/:id/menu/:itemId', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: stallId, itemId } = req.params;
    const { name, description, price, is_veg, is_available, category } = req.body;
    
    // Verify ownership using vendors table
    const check = await pool.query('SELECT s.* FROM stalls s JOIN vendors v ON s.vendor_id = v.id WHERE s.id = $1 AND v.user_id = $2', [stallId, req.user!.id]);
    if (check.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });

    const result = await pool.query(
      'UPDATE menu_items SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), is_veg = COALESCE($4, is_veg), is_available = COALESCE($5, is_available), category = COALESCE($8, category) WHERE id = $6 AND stall_id = $7 RETURNING *',
      [name, description, price, is_veg, is_available, itemId, stallId, category]
    );
    
    if (result.rows.length > 0) {
      // Determine if it was just a stock change based on request body
      const isStockOnly = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('is_available');
      const payload = {
        type: isStockOnly ? "stock_changed" : "item_updated",
        item: result.rows[0],
        stallId: stallId
      };
      req.app.get('io').emit(`stall:${stallId}:menu`, payload);
      console.log(`[Socket Emit] Channel: stall:${stallId}:menu`, payload);
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete Menu Item (Vendor Only)
router.delete('/:id/menu/:itemId', authenticate, requireVendor, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, itemId } = req.params;
    
    // Verify ownership using vendors table
    const check = await pool.query('SELECT s.* FROM stalls s JOIN vendors v ON s.vendor_id = v.id WHERE s.id = $1 AND v.user_id = $2', [id, req.user!.id]);
    if (check.rows.length === 0) return res.status(403).json({ message: 'Unauthorized' });

    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 AND stall_id = $2 RETURNING *',
      [itemId, id]
    );
    
    if (result.rows.length > 0) {
      const payload = {
        type: "item_deleted",
        item: result.rows[0],
        stallId: id
      };
      req.app.get('io').emit(`stall:${id}:menu`, payload);
      console.log(`[Socket Emit] Channel: stall:${id}:menu`, payload);
    }
    res.json({ message: 'Menu item deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
