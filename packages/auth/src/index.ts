class AuthSessionManager {
  private accessToken: string | null = null;
  private userProfile: any | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('financeos_access_token');
      const storedProfile = localStorage.getItem('financeos_user_profile');
      if (storedToken) {
        this.accessToken = storedToken;
        if (storedProfile) {
          try {
            this.userProfile = JSON.parse(storedProfile);
          } catch(e) {}
        }
      }
    }
  }

  public login(token: string, profile?: any): void {
    this.accessToken = token;
    if (profile) this.userProfile = profile;
    if (typeof window !== 'undefined') {
      localStorage.setItem('financeos_access_token', token);
      if (profile) {
        localStorage.setItem('financeos_user_profile', JSON.stringify(profile));
      }
    }
  }

  public logout(): void {
    this.accessToken = null;
    this.userProfile = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('financeos_access_token');
      localStorage.removeItem('financeos_user_profile');
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
  
  public getUserProfile(): any {
    return this.userProfile;
  }
}

export const authSession = new AuthSessionManager();
export default authSession;
