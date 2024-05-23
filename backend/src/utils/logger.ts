import { logMessagesCol } from "../database";

export default async function logEvent(eventName: string, data: any) {
  const log = {
    eventName,
    data,
    timestamp: new Date(),
  };

  console.log(JSON.stringify(log));

  await logMessagesCol.insertOne(log);
}
