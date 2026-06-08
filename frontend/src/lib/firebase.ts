'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let messaging: any = null;

function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

export const initFirebase = (): any => {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;
  if (messaging) return messaging;

  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch (e) {
    console.warn('Firebase 초기화 실패:', e);
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  try {
    const m = messaging || initFirebase();
    if (!m) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(m, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token || null;
  } catch (e) {
    console.warn('[FCM] 토큰 발급 실패:', e);
    return null;
  }
};

/** Header.tsx 하위 호환용 alias */
export const requestFcmToken = requestNotificationPermission;

export const onForegroundMessage = (callback: (payload: any) => void): (() => void) => {
  if (!messaging) return () => {};
  try {
    return onMessage(messaging, callback);
  } catch {
    return () => {};
  }
};
