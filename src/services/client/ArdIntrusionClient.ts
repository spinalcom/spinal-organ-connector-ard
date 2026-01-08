import * as soap from 'soap';

export class ArdIntrusionClient {
  private static instance: ArdIntrusionClient;
  private client!: soap.Client;

  private constructor() {}

  static async getInstance(): Promise<ArdIntrusionClient> {
    if (!this.instance) {
      this.instance = new ArdIntrusionClient();
      await this.instance.init();
    }
    return this.instance;
  }

  private async init() {
    if (!process.env.CLIENT_BASE_URL) {
      throw new Error('Missing CLIENT_BASE_URL');
    }

    const wsdlUrl =
      `${process.env.CLIENT_BASE_URL}/WS/V4/ArdAccess/Intrusion?WSDL`;

    this.client = await soap.createClientAsync(wsdlUrl);
  }

  getClient(): soap.Client {
    return this.client;
  }
}
