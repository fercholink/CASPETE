import { useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './useAuth';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

export function usePushNotification() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    // Solo para padres autenticados
    if (!user || user.role !== 'PARENT') return;
    if (subscribedRef.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function setup() {
      try {
        // 1. Registrar service worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        // 2. Pedir permiso (no intrusivo: solo si no ha decidido aún)
        if (Notification.permission === 'denied') return;
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') return;
        }

        // 3. Obtener clave VAPID del backend
        const { data } = await apiClient.get<{ data: { publicKey: string } }>('/push/vapid-key');
        const applicationServerKey = urlBase64ToUint8Array(data.data.publicKey);

        // 4. Suscribirse al Push Manager
        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }

        // 5. Enviar suscripción al backend
        const subJson = sub.toJSON() as {
          endpoint: string;
          keys: { p256dh: string; auth: string };
        };
        await apiClient.post('/push/subscribe', {
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
        });

        subscribedRef.current = true;
        console.log('[Push] Suscripción registrada correctamente');
      } catch (err) {
        console.warn('[Push] No se pudo registrar la suscripción:', err);
      }
    }

    setup();
  }, [user]);
}
