importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAiZnlQUFy3cDkISfJkc8s1GRIUSrpxb5g',
  authDomain: 'banmo-eb05c.firebaseapp.com',
  projectId: 'banmo-eb05c',
  storageBucket: 'banmo-eb05c.firebasestorage.app',
  messagingSenderId: '579533449070',
  appId: '1:579533449070:web:f149e0e9eeabdf50cbc37f',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '반모 알림';
  const body = payload.notification?.body || '';
  const link = payload.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/banmo-logo.png',
    badge: '/banmo-logo.png',
    data: { link },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(clients.openWindow(link));
});
