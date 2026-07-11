import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export const useFCM = () => {
  const router = useRouter();

  useEffect(() => {
    const setupFCM = async () => {
      // Only attempt to setup FCM if we are logged in (have a token)
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('swaddo_customer_token') : null;
      if (!authToken) return;

      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('FCM Token generated:', token);
          await api.post('/auth/fcm-token', { token }).catch(() => {
            console.warn("Could not save FCM token to backend");
          });
        }
      } catch (err) {
        console.error('Failed to setup FCM:', err);
      }
    };

    setupFCM();

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground push notification received:', payload);
      
      if (payload.notification) {
        const { title, body } = payload.notification;
        const clickAction = payload.data?.click_action;

        toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (clickAction) router.push(clickAction);
            }}
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm text-gray-500">{body}</p>
                </div>
              </div>
            </div>
          </div>
        ), { duration: 5000 });

        // Still show native notification if granted, for OS level visibility
        if ('Notification' in window && Notification.permission === 'granted') {
           const nativeNotif = new Notification(title, { body });
           nativeNotif.onclick = () => {
             window.focus();
             if (clickAction) router.push(clickAction);
             nativeNotif.close();
           };
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);
};
