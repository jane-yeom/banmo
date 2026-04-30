// Firebase Messaging Service Worker
// 백그라운드 푸시 메시지 처리

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// 환경변수는 SW에서 사용 불가 → 빌드 시 또는 별도 설정 필요
// Firebase 콘솔에서 발급한 실제 config 값을 입력하세요
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ || '',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || '',
  projectId: self.__FIREBASE_PROJECT_ID__ || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '',
  appId: self.__FIREBASE_APP_ID__ || '',
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? '반모 알림';
    const body = payload.notification?.body ?? '';
    const link = payload.data?.link ?? '/';

    self.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { link },
    });
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const link = event.notification.data?.link ?? '/';
    event.waitUntil(clients.openWindow(link));
  });
}
