import { ArdSession } from '../ArdSession';
import { ArdSupervisionClient } from '../ArdSupervisionClient';


export async function listEvents() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const supervisionClient = await ArdSupervisionClient.getInstance();
  const client = supervisionClient.getClient();

  const [res] = await client.ListEventsAsync({
    sessionId,
    criteria: {
    item: [
      {
        field: 'date',
        operator : "!=",
        value:  String(Math.floor(Date.now()/1000))
      }
    ],
  },
    pagination: {
      page: 1,
      pageSize: 100,
    },
  });

  console.log('ListEvents response:', res);

  const result = res.listEventsReturn;
  return result;
}