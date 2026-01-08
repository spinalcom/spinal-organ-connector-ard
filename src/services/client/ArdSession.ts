import { ArdSoapClient } from './ArdSoapClient';

export class ArdSession {
  private static instance: ArdSession;

  private sessionId: string | null = null;
  private lastLoginAt = 0;

  private constructor() {}

  static getInstance(): ArdSession {
    if (!this.instance) this.instance = new ArdSession();
    return this.instance;
  }

  private isSessionExpired(): boolean {
    // ARD default session timeout ~300s
    const TTL = 4 * 60 * 1000; // 4 minutes safe margin
    return !this.sessionId || Date.now() - this.lastLoginAt > TTL;
  }

  private async login(): Promise<string> {
    if (!process.env.CLIENT_USER || !process.env.CLIENT_PASSWORD) {
      throw new Error('Missing ARD credentials');
    }

    const soapClient = await ArdSoapClient.getInstance();
    const client = soapClient.getSessionClient();

    const [res] = await client.LoginAsync({
      user: process.env.CLIENT_USER,
      password: process.env.CLIENT_PASSWORD,
    });
    // console.log('ARD Login response:', res);
    const loginReturn = res?.loginReturn;
    if (!loginReturn || loginReturn.success !== 'true') {
        throw new Error('ARD login failed');
    }

    this.sessionId = loginReturn.sessionId;
    this.lastLoginAt = Date.now();
    client.clearSoapHeaders();
    client.addSoapHeader({
        sessionId: this.sessionId,
    });

    return this.sessionId;
  }

  async getSessionId(): Promise<string> {
    if (this.isSessionExpired()) {
      await this.login();
    }
    return this.sessionId!;
  }

  async logout(): Promise<void> {
    if (!this.sessionId) return;

    const soapClient = await ArdSoapClient.getInstance();
    const client = soapClient.getSessionClient();

    await client.LogoutAsync({ sessionId: this.sessionId });

    this.sessionId = null;
    this.lastLoginAt = 0;
  }
}