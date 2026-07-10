import { Application } from 'express';
import { pool } from '../db';
import { notificationService } from '../services/notification';

/**
 * Standardized Order Status Enum
 */
export type OrderStatus = 
  | "placed" 
  | "pending"
  | "accepted" 
  | "preparing" 
  | "ready" 
  | "assigned"
  | "heading_to_stall"
  | "at_stall"
  | "heading_to_customer"
  | "at_customer"
  | "delivered" 
  | "cancelled"
  | "declined";

/**
 * Centralized function to emit order status updates consistently across all channels.
 */
export const emitOrderStatusUpdate = (
  app: Application,
  orderId: string | number,
  stallId: string | number,
  status: OrderStatus | string,
  extraData: any = {}
) => {
  const payload = {
    id: orderId.toString(), // Legacy support
    orderId: orderId.toString(),
    status,
    updatedAt: new Date().toISOString(),
    ...extraData
  };

  const io = app.get('io');
  if (io) {
    // 1. Emit to Customer's specific channel
    io.emit(`order:${orderId}`, payload);
    
    // 2. Emit to Merchant's specific channel
    io.emit(`stall:${stallId}:orders`, payload);
    
    console.log(`[Socket Emit] Centralized Status Update (${status}) -> order:${orderId} AND stall:${stallId}:orders`);
  } else {
    console.warn(`[Socket Warn] Could not find 'io' on express app to emit order status update.`);
  }

  // --- FCM Push Notifications ---
  // Look up user IDs asynchronously so we don't block the socket emit
  setImmediate(async () => {
    try {
      // Get order to find customer ID
      const orderRes = await pool.query('SELECT customer_id FROM orders WHERE id = $1', [orderId]);
      const customerId = orderRes.rows[0]?.customer_id;

      // Get stall to find vendor user ID
      const stallRes = await pool.query(`
        SELECT v.user_id 
        FROM stalls s
        JOIN vendors v ON s.vendor_id = v.id
        WHERE s.id = $1
      `, [stallId]);
      const vendorUserId = stallRes.rows[0]?.user_id;

      if (customerId && (status === 'accepted' || status === 'out_for_delivery' || status === 'delivered' || status === 'declined' || status === 'cancelled')) {
        let title = 'Order Update';
        let body = `Your order status is now: ${status}`;
        if (status === 'accepted') { title = 'Order Accepted'; body = 'The merchant has started preparing your order!'; }
        else if (status === 'out_for_delivery') { title = 'Out for Delivery'; body = 'Your food is on the way!'; }
        else if (status === 'delivered') { title = 'Delivered'; body = 'Enjoy your meal!'; }
        
        await notificationService.sendToUser(customerId, title, body, { type: 'order_update', orderId: orderId.toString() });
      }

      if (vendorUserId && (status === 'placed' || status === 'payment_pending')) {
        await notificationService.sendToUser(vendorUserId, 'New Order Received', 'You have a new order waiting to be accepted.', { type: 'new_order', orderId: orderId.toString() });
      }

      // Delivery partner push notification is usually triggered when a job is assigned.
      // E.g. in services/assignment.ts. We will add a simple trigger here if status === 'assigned'
      if (status === 'assigned') {
        const assignRes = await pool.query(`
          SELECT dp.user_id 
          FROM delivery_assignments da
          JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
          WHERE da.order_id = $1 AND da.status = 'assigned'
        `, [orderId]);
        
        // If it's a broadcast assignment, we'd need to notify all available riders.
        // For simplicity, we just notify the explicitly assigned one if we found it.
        const riderUserId = assignRes.rows[0]?.user_id;
        if (riderUserId) {
          await notificationService.sendToUser(riderUserId, 'New Delivery Assigned', 'You have a new order to pick up.', { type: 'new_delivery', orderId: orderId.toString() });
        }
      }

    } catch (error) {
      console.error('[FCM Warn] Error sending push notification from status update:', error);
    }
  });
};
