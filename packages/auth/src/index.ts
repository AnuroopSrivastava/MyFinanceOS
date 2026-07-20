import { hashPin, deriveKey, generateSalt } from '@financeos/shared';

class AuthSessionManager {
  private activeKey: CryptoKey | null = null;
  private currentPin: string | null = null;

  /**
   * Initialize a new PIN on first startup.
   * Returns the salt and double-hashed verifier to be stored in settings/DB.
   */
  public async setupPin(pin: string): Promise<{ salt: string; verifier: string }> {
    const salt = generateSalt(16);
    const verifier = await hashPin(pin, salt);
    
    // Derive and cache active key
    this.activeKey = await deriveKey(pin, salt);
    this.currentPin = pin;

    return { salt, verifier };
  }

  /**
   * Authenticate the user with their PIN.
   * Derives the key and matches the verifier hash.
   */
  public async login(pin: string, salt: string, storedVerifier: string): Promise<boolean> {
    const calculatedVerifier = await hashPin(pin, salt);
    if (calculatedVerifier === storedVerifier) {
      this.activeKey = await deriveKey(pin, salt);
      this.currentPin = pin;
      return true;
    }
    return false;
  }

  /**
   * Clear the active session key from memory.
   */
  public logout(): void {
    this.activeKey = null;
    this.currentPin = null;
  }

  /**
   * Verify if a valid session key is present.
   */
  public isAuthenticated(): boolean {
    return this.activeKey !== null;
  }

  /**
   * Get the active CryptoKey. Throws an error if the user is not authenticated.
   */
  public getActiveKey(): CryptoKey {
    if (!this.activeKey) {
      throw new Error('Unauthorized: Session is locked.');
    }
    return this.activeKey;
  }

  /**
   * Retrieve the current pin (for local vault or export needs)
   */
  public getCurrentPin(): string {
    if (!this.currentPin) {
      throw new Error('Unauthorized: Session is locked.');
    }
    return this.currentPin;
  }
}

export const authSession = new AuthSessionManager();
export default authSession;
