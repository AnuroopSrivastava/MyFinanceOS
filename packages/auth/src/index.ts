import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

export class AuthSessionManager {
  private activePin: string | null = null;
  private _supabase: SupabaseClient | null = null;

  constructor(injectedClient?: SupabaseClient) {
    if (injectedClient) {
      this._supabase = injectedClient;
    }
  }

  public get supabase(): SupabaseClient | null {
    if (this._supabase) {
      return this._supabase;
    }

    if ((globalThis as any).__FINANCEOS_SUPABASE_CLIENT__) {
      this._supabase = (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__;
      return this._supabase;
    }

    // We expect the consumer app to inject standard NEXT_PUBLIC_* env vars
    const supabaseUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
    const supabaseAnonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

    if (supabaseUrl && supabaseAnonKey && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
      try {
        this._supabase = createClient(supabaseUrl, supabaseAnonKey);
        (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__ = this._supabase;
      } catch {
        this._supabase = null;
      }
    }
    return this._supabase;
  }

  public set supabase(client: SupabaseClient | null) {
    this._supabase = client;
    if (client) {
      (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__ = client;
    }
  }

  // Allow replacing the client dynamically (e.g. in React components)
  public setClient(client: SupabaseClient) {
    this._supabase = client;
    (globalThis as any).__FINANCEOS_SUPABASE_CLIENT__ = client;
  }

  public async getSession(): Promise<Session | null> {
    if (!this.supabase) return null;
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) return session;

      // Fallback: If session is null initially, checking getUser() ensures @supabase/ssr parses cookies
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const { data: { session: refreshedSession } } = await this.supabase.auth.getSession();
        return refreshedSession;
      }
    } catch {
      // Safe fallback
    }
    return null;
  }

  public async getUser(): Promise<User | null> {
    if (!this.supabase) return null;
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }

  // Google OAuth Login
  public async loginWithGoogle(): Promise<void> {
    if (!this.supabase) throw new Error("Supabase not initialized");
    
    // Determine the callback URL based on environment
    // Next.js web app uses the API route for httpOnly cookies.
    const isNextJs = typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const redirectUrl = typeof window !== 'undefined'
      ? (isNextJs ? `${window.location.origin}/auth/callback` : window.location.origin)
      : undefined;

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) throw new Error("Authentication failed");
  }

  public setSessionPin(pin: string): void {
    this.activePin = pin;
  }

  public getSessionPin(): string | null {
    return this.activePin;
  }

  public async logout(): Promise<void> {
    this.activePin = null;
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
  }

  // Helper for backward compatibility in some components
  public async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  public onAuthStateChange(callback: (session: Session | null) => void): () => void {
    if (!this.supabase) return () => {};
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => {
      subscription?.unsubscribe();
    };
  }
}

export const authSession = new AuthSessionManager();
export default authSession;
