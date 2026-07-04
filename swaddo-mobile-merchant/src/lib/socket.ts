import { io, Socket } from 'socket.io-client';
import { storage } from './api';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = storage.getString('swaddo_merchant_token');
    
    // Hardcode WS URL for now or use environment variables tailored for React Native
    let wsUrl = 'http://localhost:5005';
    
    socket = io(wsUrl, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket'], // Force websocket for 0.1s speed (no polling fallback)
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (s && !s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
};
