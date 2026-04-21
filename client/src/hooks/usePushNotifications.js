import { useEffect } from 'react';
import { api } from '../api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(user) {
  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      try {
        const { publicKey } = await api.push.vapidKey();
        if (!publicKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await api.push.subscribe({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth:   btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
          },
        });
      } catch (err) {
        console.log('[push] Setup skipped:', err.message);
      }
    }).catch(() => {});
  }, [user]);
}
