import { ArdSession } from '../ArdSession';
import { ArdCarrierClient } from '../ArdCarrierClient';

export async function listCarrierGroups() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const carrierClient = await ArdCarrierClient.getInstance();
  const client = carrierClient.getClient();

  const [res] = await client.ListCarrierGroupsAsync({
    sessionId,
    criteria: [], // REQUIRED, even empty
    pagination: {
      page: 1,
      pageSize: 100,
    },
  });

  const result = res.listCarrierGroupsReturn;
  return result;
}