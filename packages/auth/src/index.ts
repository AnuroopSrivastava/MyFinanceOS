class AuthSessionManager {
  private accessToken: string | null = null;
  private userProfile: any | null = null;

  public login(token: string, profile?: any): void {
    this.accessToken = token;
    if (profile) this.userProfile = profile;
  }

  public logout(): void {
    this.accessToken = null;
    this.userProfile = null;
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
