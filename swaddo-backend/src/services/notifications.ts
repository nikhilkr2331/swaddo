import * as adminNamespace from 'firebase-admin';
const admin: any = adminNamespace;
import { logger } from '../utils/logger';
import { pool } from '../db';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin SDK
// You must have service-account.json in the backend root directory.
try {
  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath))
    });
    logger.info('Firebase Admin initialized successfully');
  } else {
    logger.warn('service-account.json not found! Firebase Admin is NOT initialized. Push notifications will fail.');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin', error);
}

/**
 * Send a push notification to a specific user.
 * Looks up all their registered FCM tokens and sends to them.
 */
export const sendPushNotification = async (
  userId: number, 
  title: string, 
  body: string, 
  data: any = {}
) => {
  try {
    if (!admin.apps.length) {
      logger.warn('Skipping push notification because Firebase Admin is not initialized.');
      return;
    }

    const tokensRes = await pool.query('SELECT token FROM fcm_tokens WHERE user_id = $1', [userId]);
    const tokens = tokensRes.rows.map(row => row.token);

    if (tokens.length === 0) {
      logger.info(`No FCM tokens found for user ${userId}. Skipping push notification.`);
      return;
    }

    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // often needed for cross-platform
      },
      tokens: tokens // Send multicast to all devices
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    logger.info(`Sent push notification to user ${userId} (${response.successCount} successes, ${response.failureCount} failures)`);

    // Optionally cleanup failed/expired tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      if (failedTokens.length > 0) {
        // Delete expired/invalid tokens from DB
        await pool.query('DELETE FROM fcm_tokens WHERE token = ANY($1)', [failedTokens]);
        logger.info(`Cleaned up ${failedTokens.length} invalid FCM tokens for user ${userId}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending push notification to user ${userId}`, error);
  }
};
