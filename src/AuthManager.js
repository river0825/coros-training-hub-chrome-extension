// 認證管理器
export class AuthManager {
  constructor() {
    this.tokenKey = 'CPL-coros-token';
  }
  async getAuthToken() {
    const match = document.cookie.match(new RegExp(`${this.tokenKey}=([^;]+)`));
    return match ? match[1] : null;
  }
}
