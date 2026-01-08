import * as soap from 'soap';

export class ArdDeviceClient {
  private static instance: ArdDeviceClient;
  private client!: soap.Client;

  private constructor() {}

  static async getInstance(): Promise<ArdDeviceClient> {
    if (!this.instance) {
      this.instance = new ArdDeviceClient();
      await this.instance.init();
    }
    return this.instance;
  }

  private async init() {
    if (!process.env.CLIENT_BASE_URL) {
      throw new Error('Missing CLIENT_BASE_URL');
    }

    const wsdlUrl =
      `${process.env.CLIENT_BASE_URL}/WS/ArdAccess/Device?WSDL`;

    this.client = await soap.createClientAsync(wsdlUrl);
  }

  getClient(): soap.Client {
    return this.client;
  }
}
