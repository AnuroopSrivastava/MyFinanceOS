import { useEffect, useRef, useState } from 'react';
import { dbService } from '@financeos/database';

/**
 * Re-runs `callback` on every DB change notification. The callback is kept in
 * a ref and the subscription is established exactly once, so callers can pass
 * an unstable inline function (e.g. a fresh `refreshData` closure per render)
 * without churning subscriptions on every render.
 */
export function useDbSyncCallback(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return dbService.subscribe(() => callbackRef.current());
  }, []);
}

/** Bumps a counter on every DB change notification, for `useMemo` dependency arrays. */
export function useDbVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    return dbService.subscribe(() => setVersion(v => v + 1));
  }, []);
  return version;
}
