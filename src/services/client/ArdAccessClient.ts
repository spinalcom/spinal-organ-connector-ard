import * as soap from 'soap';

export class ArdAccessClient {
  private static instance: ArdAccessClient;
  private client!: soap.Client;

  private constructor() {}

  static async getInstance(): Promise<ArdAccessClient> {
    if (!this.instance) {
      this.instance = new ArdAccessClient();
      await this.instance.init();
    }
    return this.instance;
  }

  private async init() {
    if (!process.env.CLIENT_BASE_URL) {
      throw new Error('Missing CLIENT_BASE_URL');
    }

    const wsdlUrl =
      `${process.env.CLIENT_BASE_URL}/WS/V2/ArdAccess/Device?WSDL`;

    this.client = await soap.createClientAsync(wsdlUrl);
  }

  getClient(): soap.Client {
    return this.client;
  }
}