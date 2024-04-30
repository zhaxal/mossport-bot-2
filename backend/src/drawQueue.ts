import Queue from "bull";
import { ObjectId } from "mongodb";

import {
  userCol,
  drawInfoCol,
  subscribersCol,
  userPrizeStatusCol,
} from "./database";
import bot from "./bot";

const drawQueue = new Queue("draw");

async function selectWinners(eventId: string, numberOfWinners: number) {
  const participants = await userCol
    .find({ eventId: new ObjectId(eventId) })
    .toArray();

  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  const winners = participants.slice(0, numberOfWinners);

  return winners;
}

drawQueue.process(async (job) => {
  const { eventId, numberOfWinners, winnersMessage } = job.data;

  const winners = await selectWinners(eventId, numberOfWinners);

  const subscribers = await subscribersCol
    .find({
      _id: { $in: winners.map((winner) => winner.subscriberId) },
    })
    .toArray();

  await userPrizeStatusCol.updateMany(
    {
      shortId: { $in: winners.map((winner) => winner.shortId) },
      eventId: new ObjectId(eventId),
    },
    { $set: { claimed: false } },
    { upsert: true }
  );

  subscribers.forEach((s) => {
    bot.telegram.sendMessage(s.telegramId, winnersMessage);
  });
});

export default drawQueue;
