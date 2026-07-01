import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { logger } from './utils/logger';
import { setupWorkers } from './services/queue';
import dotenv from 'dotenv';

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

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
