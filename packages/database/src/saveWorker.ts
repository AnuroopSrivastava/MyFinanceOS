/**
 * MyFinanceOS save worker — offloads JSON serialization + vault encryption
 * off the main thread. Crypto comes from @financeos/shared so the worker and
 * the main-thread fallback can never drift apart.
 */
import { encryptData } from '@financeos/shared';

interface SaveRequest {
  msgId: number;
  db: unknown;
  pin?: string;
}

interface SaveResponse {
  msgId: number;
  success: boolean;
  storagePayload?: string;
  error?: string;
}

const post = (msg: SaveResponse): void => {
  (self as unknown as { postMessage: (m: SaveResponse) => void }).postMessage(msg);
};

self.onmessage = async (e: MessageEvent<SaveRequest>) => {
  const { msgId, db, pin } = e.data;
  try {
    const plainPayload = JSON.stringify(db);
    let storagePayload = plainPayload;
    if (pin) {
      storagePayload = await encryptData(plainPayload, pin);
    }
    post({ msgId, success: true, storagePayload });
  } catch (err) {
    post({ msgId, success: false, error: err instanceof Error ? (err.stack || err.message) : String(err) });
  }
};