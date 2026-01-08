import { ArdSession } from '../ArdSession';
import { ArdCarrierClient } from '../ArdCarrierClient';
import { ardPaginatedFetch } from '../../../utils/ardPaginatedFetch';

export async function listCarriers() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const carrierClient = await ArdCarrierClient.getInstance();
  const client = carrierClient.getClient();

  const items: any[] = await ardPaginatedFetch(
    async (page, pageSize) => {
      const [res] = await client.ListCarriersAsync({
        sessionId,
        criteria: [],
        pagination: {
          page,
          pageSize,
        },
      });

      return res.listCarriersReturn;
    },
    100
  );

  return {
    count: items.length,
    records: {
      item: items,
    },
  };

  
}