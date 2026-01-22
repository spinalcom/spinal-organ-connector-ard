import * as soap from 'soap';

export class ArdSupervisionClient {
  private static instance: ArdSupervisionClient;
  private client!: soap.Client;

  private constructor() { }

  static async getInstance(): Promise<ArdSupervisionClient> {
    if (!this.instance) {
      this.instance = new ArdSupervisionClient();
      await this.instance.init();
    }
    return this.instance;
  }

  private async init() {
    if (!process.env.CLIENT_BASE_URL) {
      throw new Error('Missing CLIENT_BASE_URL');
    }

    const wsdlUrl =
      `${process.env.CLIENT_BASE_URL}/WS/V4/ArdAccess/Supervision?WSDL`;

    this.client = await soap.createClientAsync(wsdlUrl);
  }

  getClient(): soap.Client {
    return this.client;
  }
}
