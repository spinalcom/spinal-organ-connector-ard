import { ArdSession } from '../ArdSession';
import { ArdSupervisionClient } from '../ArdSupervisionClient';
import { ardPaginatedFetch } from '../../../utils/ardPaginatedFetch';


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
          operator: "<",
          value: String(Date.now())
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

export async function getAllEvents(after: number = 0) {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const supervisionClient = await ArdSupervisionClient.getInstance();
  const client = supervisionClient.getClient();

  const items: any[] = await ardPaginatedFetch(
    async (page, pageSize) => {
      const [res] = await client.ListEventsAsync({
        sessionId,
        criteria: {
          item: [
            {
              field: 'date',
              operator: ">",
              value: String(after)
            },
            {
              field: 'accesslog',
              operator: "=",
              value: 1
            }


          ],
        },
        pagination: {
          page,
          pageSize,
        },
      });

      return res.listEventsReturn;
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
