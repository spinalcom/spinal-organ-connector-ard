import { ArdSession } from '../ArdSession';
import { ArdSupervisionClient } from '../ArdSupervisionClient';


export async function listAlarms() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const supervisionClient = await ArdSupervisionClient.getInstance();
  const client = supervisionClient.getClient();

  const [res] = await client.ListAlarmsAsync({
    sessionId,
    criteria: {
      item: [
        {
          field: 'lastdatetime',
          operator: "<=",
          value: String(Math.floor(Date.now() / 1000))
        }
      ],
    },
    pagination: {
      page: 1,
      pageSize: 100,
    },
  });

  console.log('ListAlarms response:', res);

  const result = res.listAlarmsReturn;
  return result;
}