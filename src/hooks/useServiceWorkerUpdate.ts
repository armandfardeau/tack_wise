import { useCallback, useEffect, useState } from 'react';
import { SERVICE_WORKER_REGISTERED_EVENT } from '../utils/serviceWorker';

interface ServiceWorkerUpdateState {
  isUpdateAvailable: boolean;
  dismissUpdate: () => void;
  refresh: () => void;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    let isMounted = true;
    let currentRegistration: ServiceWorkerRegistration | null = null;
    let currentInstallingWorker: ServiceWorker | null = null;
    let handleInstallingWorkerStateChange: (() => void) | null = null;

    const showUpdate = () => {
      if (isMounted) setIsUpdateAvailable(true);
    };

    const watchInstallingWorker = () => {
      const installingWorker = currentRegistration?.installing;
      if (!installingWorker || installingWorker === currentInstallingWorker) return;

      if (currentInstallingWorker && handleInstallingWorkerStateChange) {
        currentInstallingWorker.removeEventListener('statechange', handleInstallingWorkerStateChange);
      }

      currentInstallingWorker = installingWorker;
      handleInstallingWorkerStateChange = () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdate();
        }
      };
      installingWorker.addEventListener('statechange', handleInstallingWorkerStateChange);
    };

    const handleUpdateFound = () => watchInstallingWorker();
    const checkForUpdate = () => {
      if (document.visibilityState !== 'visible' || !currentRegistration) return;
      void currentRegistration.update().catch((error: unknown) => {
        console.warn('Tack Wise could not check for an app update.', error);
      });
    };

    const attachRegistration = (nextRegistration: ServiceWorkerRegistration) => {
      if (!isMounted || currentRegistration === nextRegistration) return;

      currentRegistration = nextRegistration;
      setRegistration(nextRegistration);
      nextRegistration.addEventListener('updatefound', handleUpdateFound);

      if (nextRegistration.waiting && navigator.serviceWorker.controller) {
        showUpdate();
      }
      watchInstallingWorker();
    };

    const handleRegistrationEvent = (event: Event) => {
      const nextRegistration = (event as CustomEvent<ServiceWorkerRegistration>).detail;
      if (nextRegistration) attachRegistration(nextRegistration);
    };

    window.addEventListener(SERVICE_WORKER_REGISTERED_EVENT, handleRegistrationEvent);
    void navigator.serviceWorker.getRegistration('/sw.js').then((nextRegistration) => {
      if (nextRegistration) attachRegistration(nextRegistration);
    });

    document.addEventListener('visibilitychange', checkForUpdate);
    window.addEventListener('focus', checkForUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(SERVICE_WORKER_REGISTERED_EVENT, handleRegistrationEvent);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.removeEventListener('focus', checkForUpdate);
      currentRegistration?.removeEventListener('updatefound', handleUpdateFound);
      if (currentInstallingWorker && handleInstallingWorkerStateChange) {
        currentInstallingWorker.removeEventListener('statechange', handleInstallingWorkerStateChange);
      }
    };
  }, []);

  const dismissUpdate = useCallback(() => setIsUpdateAvailable(false), []);

  const refresh = useCallback(() => {
    const waitingWorker = registration?.waiting;
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  return { isUpdateAvailable, dismissUpdate, refresh };
}
