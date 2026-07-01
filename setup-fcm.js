const fs = require('fs');
const path = require('path');

const apps = ['swaddo-customer-app', 'swaddo-merchant-app', 'swaddo-delivery-app'];

const firebaseTs = `import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
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
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
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
`;

const swJs = `importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// IMPORTANT: These values need to be manually replaced by the user after Firebase setup
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

// Check if valid config before initializing to prevent crashes in local dev
if (firebaseConfig.apiKey !== "REPLACE_ME") {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icon.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
`;

apps.forEach(appDir => {
  const libDir = path.join(__dirname, appDir, 'src', 'lib');
  const publicDir = path.join(__dirname, appDir, 'public');
  
  if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(libDir, 'firebase.ts'), firebaseTs);
  fs.writeFileSync(path.join(publicDir, 'firebase-messaging-sw.js'), swJs);
});

console.log("FCM files generated for all 3 apps.");
