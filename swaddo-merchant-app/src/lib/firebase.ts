import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBM8cWMeSbfQR9vg4G3DAitKSn1ABifKY4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "swaddo-pwa.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "swaddo-pwa",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "swaddo-pwa.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1083737771617",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1083737771617:web:2319df7e88ab29481c2420",
  measurementId: "G-1W29CB12K2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const requestNotificationPermission = async () => {
  try {
    const supported = await isSupported();
    if (!supported || !firebaseConfig.apiKey) {
      console.warn("FCM is not supported or missing config.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BI6vnkVEtGj64bmYXgqapOvQdzUhpBj0sWk4ikWRA7LPh5RU4kaJmAgwdTSyAwh8WNghmqdhCL2tVRv7bs0mLLo"
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("FCM Permission Error:", error);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!firebaseConfig.apiKey) return;
  isSupported().then((supported) => {
    if (supported) {
      const messaging = getMessaging(app);
      onMessage(messaging, callback);
    }
  });
};
