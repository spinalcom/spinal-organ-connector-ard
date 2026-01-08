import { ArdSession } from '../ArdSession';
import { ArdIntrusionClient } from '../ArdIntrusionClient';

export async function isSiteMonitored() {
  const session = ArdSession.getInstance();
  const sessionId = await session.getSessionId();

  const intrusionClient = await ArdIntrusionClient.getInstance();
  const client = intrusionClient.getClient();

  const [res] = await client.isSiteMonitoredAsync({
    sessionId
  });

  const result = res.isSiteMonitoredReturn;
  return result;
}