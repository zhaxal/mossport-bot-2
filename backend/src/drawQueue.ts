import Queue from "bull";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";

import { userCol, subscribersCol, userPrizeStatusCol } from "./database";
import bot from "./bot";

import logEvent from "./utils/logger";

dotenv.config();

const drawQueue = new Queue("draw", {
  redis: process.env.REDIS_URL || {
    host: "localhost",
    port: 6379,
  },
});

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

  await logEvent("Job processing started", {
    jobId: job.id,
    eventId,
    numberOfWinners,
  });

  const winners = await selectWinners(eventId, numberOfWinners);

  await logEvent("Winners selected", { jobId: job.id, winners });

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

  await logEvent("Prize status updated", { jobId: job.id });

  subscribers.forEach((s) => {
    bot.telegram.sendMessage(s.telegramId, winnersMessage);
  });

  await logEvent("Messages sent to winners", { jobId: job.id });
});

export default drawQueue;
