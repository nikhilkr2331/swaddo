import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from '../utils/logger';
import { pool } from '../db';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // If running on Render, the service account JSON might be passed as an env string
    // or we might need to load it from a file.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
      logger.info("Firebase Admin initialized successfully from env");
    } else {
      logger.warn("FIREBASE_SERVICE_ACCOUNT env variable is missing. Push notifications will not be sent.");
    }
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin:", error);
  }
}

export const notificationService = {
  
  /**
   * Send a notification to a specific user (Customer)
   */
  async sendToUser(userId: number, title: string, body: string, data?: any) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
      client.release();
      
      const token = result.rows[0]?.fcm_token;
      if (!token) {
        logger.info(`No FCM token found for user ${userId}`);
        return false;
      }
      
      return await this.sendPush(token, title, body, data);
    } catch (error) {
      logger.error(`Error sending push to user ${userId}:`, error);
      return false;
    }
  },

  /**
   * Send a notification to a specific vendor (Merchant)
   */
  async sendToVendor(vendorId: number, title: string, body: string, data?: any) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT fcm_token FROM vendors WHERE id = $1', [vendorId]);
      client.release();
      
      const token = result.rows[0]?.fcm_token;
      if (!token) {
        logger.info(`No FCM token found for vendor ${vendorId}`);
        return false;
      }
      
      return await this.sendPush(token, title, body, data);
    } catch (error) {
      logger.error(`Error sending push to vendor ${vendorId}:`, error);
      return false;
    }
  },

  /**
   * Send a notification to a specific delivery partner (Rider)
   */
  async sendToRider(riderId: number, title: string, body: string, data?: any) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT fcm_token FROM delivery_partners WHERE id = $1', [riderId]);
      client.release();
      
      const token = result.rows[0]?.fcm_token;
      if (!token) {
        logger.info(`No FCM token found for rider ${riderId}`);
        return false;
      }
      
      return await this.sendPush(token, title, body, data);
    } catch (error) {
      logger.error(`Error sending push to rider ${riderId}:`, error);
      return false;
    }
  },

  /**
   * Internal method to actually send the message via Firebase Admin
   */
  async sendPush(token: string, title: string, body: string, data?: any) {
    if (!getApps().length) return false;
    
    try {
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard for web/mobile click actions
        },
        token
      };

      const response = await getMessaging().send(message);
      logger.info(`Successfully sent message: ${response}`);
      return true;
    } catch (error) {
      logger.error('Error sending message:', error);
      return false;
    }
  }
};
