import { ArdSession } from '../ArdSession';
import { ArdAccessClient } from '../ArdAccessClient';


export async function listReaders() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const accessClient = await ArdAccessClient.getInstance();
  const client = accessClient.getClient();

  const [res] = await client.ListAccessPointsAsync({
    sessionId,
    criteria: [],
    pagination: {
      page: 1,
      pageSize: 100,
    },
  });

  const result = res.listAccessPointsReturn;

  console.log('Total access points:', result.count);
  console.log('Records:', result.records);
  return result;
}