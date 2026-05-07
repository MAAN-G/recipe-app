import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Tracks online/offline status and shows a toast when the connection changes.
 * Returns true while the browser is offline.
 */
export function useOffline() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function handleOffline() {
      setOffline(true);
      toast.warning('You are offline. Showing cached data where available.', {
        id: 'offline-toast',
        duration: Infinity,
      });
    }

    function handleOnline() {
      setOffline(false);
      toast.success('Back online!', { id: 'offline-toast', duration: 3000 });
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Show toast immediately if already offline on mount
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return offline;
}
