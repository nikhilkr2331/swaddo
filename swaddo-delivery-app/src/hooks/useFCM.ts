import { useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';
import api from '../lib/api';

export const useFCM = () => {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('FCM Token generated:', token);
          // Send to backend
          await api.post('/auth/fcm-token', { token }).catch(() => {
            console.warn("Could not save FCM token to backend");
          });
        }
      } catch (err) {
        console.error('Failed to setup FCM:', err);
      }
    };

    setupFCM();

    onForegroundMessage((payload) => {
      console.log('Foreground push notification received:', payload);
      if (payload.notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
           new Notification(payload.notification.title, { body: payload.notification.body });
        } else {
           alert(`${payload.notification.title}\n${payload.notification.body}`);
        }
      }
    });
  }, []);
};
