import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    const token = localStorage.getItem('swaddo_delivery_token');
    
    // Derive WS URL smartly: if WS_URL is absent, derive it from API_URL by removing '/api'
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl && process.env.NEXT_PUBLIC_API_URL) {
      wsUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
    }

    socket = io(wsUrl || 'http://localhost:5005', {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'], // Resilient connection
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
