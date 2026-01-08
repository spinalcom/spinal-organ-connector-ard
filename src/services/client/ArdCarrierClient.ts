import * as soap from 'soap';

export class ArdCarrierClient {
  private static instance: ArdCarrierClient;
  private client!: soap.Client;

  private constructor() {}

  static async getInstance(): Promise<ArdCarrierClient> {
    if (!this.instance) {
      this.instance = new ArdCarrierClient();
      await this.instance.init();
    }
    return this.instance;
  }

  private async init() {
    if (!process.env.CLIENT_BASE_URL) {
      throw new Error('Missing CLIENT_BASE_URL');
    }

    const wsdlUrl =
      `${process.env.CLIENT_BASE_URL}/WS/V3/ArdDesktop/Carrier?WSDL`;

    this.client = await soap.createClientAsync(wsdlUrl);
  }

  getClient(): soap.Client {
    return this.client;
  }
}