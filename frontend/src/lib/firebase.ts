'use client';

let messagingInstance: any = null;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.projectId && cfg.messagingSenderId && cfg.appId);
}

async function getMessagingInstance() {
  if (!isFirebaseConfigured()) return null;
  if (messagingInstance) return messagingInstance;

  const { initializeApp, getApps } = await import('firebase/app');
  const { getMessaging } = await import('firebase/messaging');

  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(getFirebaseConfig());
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/** 브라우저 알림 권한 요청 + FCM 토큰 발급 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const { getToken } = await import('firebase/messaging');
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (err) {
    console.warn('[FCM] 토큰 발급 실패:', err);
    return null;
  }
}

/** 포그라운드 메시지 수신 리스너 등록 */
export async function onForegroundMessage(
  callback: (payload: { title: string; body: string; link?: string }) => void,
): Promise<() => void> {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return () => {};

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return () => {};

    const { onMessage } = await import('firebase/messaging');
    const unsubscribe = onMessage(messaging, (payload) => {
      callback({
        title: payload.notification?.title ?? '',
        body: payload.notification?.body ?? '',
        link: (payload.data?.link as string) ?? undefined,
      });
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}
