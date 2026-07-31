import { useEffect, useState } from 'react';
import { dbService } from '@financeos/database';

export function useDbSyncCallback(callback: () => void) {
  useEffect(() => {
    return dbService.subscribe(callback);
  }, [callback]);
}

export function useDbVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    return dbService.subscribe(() => setVersion(v => v + 1));
  }, []);
  return version;
}
