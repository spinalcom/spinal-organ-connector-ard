import { ArdSession } from '../ArdSession';
import { ArdDeviceClient } from '../ArdDeviceClient';
import { ardPaginatedFetch } from '../../../utils/ardPaginatedFetch';

export async function listDeviceReaders() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const deviceClient = await ArdDeviceClient.getInstance();
  const client = deviceClient.getClient();


  const items: any[] = await ardPaginatedFetch(
      async (page, pageSize) => {
        const [res] = await client.ListReadersAsync({
          sessionId,
          criteria: [],
          pagination: {
            page,
            pageSize,
          },
        });
  
        return res.listReadersReturn;
      },
      100
    );
  
    return {
      count: items.length,
      records: {
        item: items,
      },
    };
  
  const [res] = await client.ListReadersAsync({
    sessionId,
    criteria: [], // REQUIRED, even empty
    pagination: {
      page: 1,
      pageSize: 100,
    },
  });

  const result = res.listReadersReturn;
  return result;
}