import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './utils/logger';
import { rateLimit } from 'express-rate-limit';
import { pool } from './db';
import { redis } from './redis';

import authRoutes from './routes/auth.routes';
import stallRoutes from './routes/stalls.routes';
import orderRoutes from './routes/orders.routes';
import deliveryRoutes from './routes/delivery.routes';
import paymentRoutes from './routes/payments.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notifications.routes';
import locationRoutes from './routes/location.routes';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.url} - Auth: ${req.headers.authorization ? 'Present' : 'None'}`);
  res.on('finish', () => {
    console.log(`[RES] ${req.method} ${req.url} -> Status: ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Basic Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use(generalLimiter);

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/location', locationRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT 1 as result');
    const redisResult = await redis.ping();
    res.json({
      status: 'ok',
      db: dbResult.rows[0].result === 1 ? 'connected' : 'error',
      redis: redisResult === 'PONG' ? 'connected' : 'error'
    });
  } catch (err) {
    logger.error('Health check failed', err);
    res.status(500).json({ status: 'error', message: 'Service degradation' });
  }
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled Exception:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
