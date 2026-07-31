import type { UserProfile } from '@financeos/shared';

export class AuthSessionManager {
  private accessToken: string | null = null;
  private userProfile: UserProfile | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const storedToken = sessionStorage.getItem('financeos_access_token');
      const storedProfile = sessionStorage.getItem('financeos_user_profile');
      if (storedToken) {
        this.accessToken = storedToken;
        if (storedProfile) {
          try {
            this.userProfile = JSON.parse(storedProfile);
          } catch {
            // Ignore malformed sessionStorage payload
          }
        }
      }
    }
  }

  public login(token: string, profile?: UserProfile): void {
    this.accessToken = token;
    if (profile) this.userProfile = profile;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('financeos_access_token', token);
      if (profile) {
        sessionStorage.setItem('financeos_user_profile', JSON.stringify(profile));
      }
    }
  }

  public logout(): void {
    this.accessToken = null;
    this.userProfile = null;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('financeos_access_token');
      sessionStorage.removeItem('financeos_user_profile');
    }
  }

  public isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  public getAccessToken(): string {
    if (!this.accessToken) {
      throw new Error('Unauthorized: No Google access token available.');
    }
    return this.accessToken;
  }

  public getUserProfile(): UserProfile | null {
    return this.userProfile;
  }
}

export const authSession = new AuthSessionManager();
export default authSession;
