import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { logger } from './utils/logger';
import { setupWorkers } from './services/queue';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io setup (In-memory, no Redis adapter required for local testing)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import { assignmentManager } from './services/assignment';

app.set('io', io);
assignmentManager.init(io);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('rider_online', (data) => {
    // For local testing, we expect the client to send their ID. 
    // If none provided, we mock it using the socket ID.
    const riderId = data?.riderId || `mock_rider_${socket.id.substring(0,5)}`;
    assignmentManager.registerRider(riderId, socket.id, data?.lat, data?.lng);
  });

  socket.on('rider_sync_location', (data) => {
    const riderId = data?.riderId;
    if (riderId && data?.lat && data?.lng) {
      assignmentManager.updateRiderLocation(riderId, data.lat, data.lng);
    }
  });

  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('rider_location_update', (data) => {
    if (data.orderId) {
      // Relay to the specific customer tracking this order
      socket.to(`room_${data.orderId}`).emit('rider_location_update', data);
    }
  });

  socket.on('disconnect', () => {
    assignmentManager.unregisterSocket(socket.id);
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Setup mock background workers
setupWorkers();

// Auto-migrate FCM columns on startup to fix Render DB issues
const migrateDB = async () => {
  try {
    const client = await pool.connect();
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;`);
    await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fcm_token TEXT;`);
    await client.query(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS fcm_token TEXT;`);
    client.release();
    logger.info('Database FCM columns migrated successfully.');
  } catch (error) {
    logger.error('Database migration failed:', error);
  }
};

migrateDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
