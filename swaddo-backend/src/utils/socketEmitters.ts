import { Application } from 'express';
import { pool } from '../db';
import { notificationService } from '../services/notification';
import { getCustomerOrderNotification, getMerchantNotification, getRiderNotification } from './notificationTemplates';

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

      if (customerId) {
        // We get extra data from the DB to make the notification personalized
        const extraRes = await pool.query(`
          SELECT s.name as stall_name, dp.name as rider_name
          FROM orders o
          LEFT JOIN stalls s ON o.stall_id = s.id
          LEFT JOIN delivery_assignments da ON o.id = da.order_id AND da.status = 'assigned'
          LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
          WHERE o.id = $1
        `, [orderId]);
        
        const extraData = {
          stallName: extraRes.rows[0]?.stall_name,
          riderName: extraRes.rows[0]?.rider_name,
        };

        const payload = getCustomerOrderNotification(status, orderId.toString(), extraData);
        if (payload) {
          await notificationService.sendToUser(customerId, payload.title, payload.body, payload.data);
        }
      }

      if (vendorUserId) {
        const payload = getMerchantNotification(status, orderId.toString());
        if (payload) {
          await notificationService.sendToUser(vendorUserId, payload.title, payload.body, payload.data);
        }
      }

      // Delivery partner push notification
      if (status === 'assigned') {
        const assignRes = await pool.query(`
          SELECT dp.user_id 
          FROM delivery_assignments da
          JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
          WHERE da.order_id = $1 AND da.status = 'assigned'
        `, [orderId]);
        
        const riderUserId = assignRes.rows[0]?.user_id;
        if (riderUserId) {
          const payload = getRiderNotification(status, orderId.toString());
          if (payload) {
            await notificationService.sendToUser(riderUserId, payload.title, payload.body, payload.data);
          }
        }
      }

    } catch (error) {
      console.error('[FCM Warn] Error sending push notification from status update:', error);
    }
  });
};
