import type { UserProfile } from '@financeos/shared';
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
    if (!this._supabase) {
      // We expect the consumer app (e.g. Next/Vite) to inject these env vars
      const supabaseUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL 
        : (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL 
          ? process.env.VITE_SUPABASE_URL 
          : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL));
        
      const supabaseAnonKey = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        : (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY 
          ? process.env.VITE_SUPABASE_ANON_KEY 
          : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY));

      if (supabaseUrl && supabaseAnonKey) {
        this._supabase = createClient(supabaseUrl, supabaseAnonKey);
      }
    }
    return this._supabase;
  }

  public set supabase(client: SupabaseClient | null) {
    this._supabase = client;
  }

  // Allow replacing the client dynamically (e.g. in React components)
  public setClient(client: SupabaseClient) {
    this._supabase = client;
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
    // TEMP-INSPECT-ONLY: remove before commit
    if (typeof window !== 'undefined' && window.location.search.includes('__inspect=1')) return true;
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
