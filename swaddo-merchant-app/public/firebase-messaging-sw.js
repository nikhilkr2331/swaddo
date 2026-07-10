importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// IMPORTANT: These values need to be manually replaced by the user after Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyBM8cWMeSbfQR9vg4G3DAitKSn1ABifKY4",
  authDomain: "swaddo-pwa.firebaseapp.com",
  projectId: "swaddo-pwa",
  storageBucket: "swaddo-pwa.firebasestorage.app",
  messagingSenderId: "1083737771617",
  appId: "1:1083737771617:web:2319df7e88ab29481c2420",
  measurementId: "G-1W29CB12K2"
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
