import * as soap from 'soap';

export class ArdSoapClient {
  private static instance: ArdSoapClient;
  private sessionClient!: soap.Client;

  private constructor() {}

  static async getInstance(): Promise<ArdSoapClient> {
    if (!this.instance) {
      this.instance = new ArdSoapClient();
      await this.instance.init();
    }
    return this.instance;
  }

  private async init() {
    if (!process.env.CLIENT_BASE_URL) {
      throw new Error('Missing CLIENT_BASE_URL');
    }

    const wsdlUrl = `${process.env.CLIENT_BASE_URL}/WS/V2/ArdMcm/Session?WSDL`;
    this.sessionClient = await soap.createClientAsync(wsdlUrl);
  }

  getSessionClient(): soap.Client {
    return this.sessionClient;
  }
}