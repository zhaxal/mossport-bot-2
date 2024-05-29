import { Agenda } from "@hokify/agenda";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";

import { userCol, subscribersCol, userPrizeStatusCol } from "./database";
import bot from "./bot";

import logEvent from "./utils/logger";

dotenv.config();

const agenda = new Agenda({
  db: {
    address:
      process.env.MONGO_URL || "mongodb://0.0.0.0:27017/mossport-database-2",
  },
});

async function selectWinners(eventId: string, numberOfWinners: number) {
  let participants = await userCol
    .find({ eventId: new ObjectId(eventId) })
    .toArray();

  const alreadyWon = await userPrizeStatusCol
    .find({ eventId: new ObjectId(eventId) })
    .toArray();

  participants = participants.filter(
    (p) => !alreadyWon.some((w) => w.shortId === p.shortId)
  );

  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  const winners = participants.slice(0, numberOfWinners);

  return winners;
}

agenda.define("draw", async (job) => {
  const { eventId, numberOfWinners, winnersMessage } = job.attrs.data;

  await logEvent("Job processing started", {
    jobId: job.attrs._id,
    eventId,
    numberOfWinners,
  });

  const winners = await selectWinners(eventId, numberOfWinners);

  await logEvent("Winners selected", { jobId: job.attrs._id, winners });

  const subscribers = await subscribersCol
    .find({
      _id: { $in: winners.map((winner) => winner.subscriberId) },
    })
    .toArray();

  await userPrizeStatusCol.insertMany(
    winners.map((winner) => ({
      shortId: winner.shortId,
      claimed: false,
      eventId: new ObjectId(eventId),
    }))
  );

  await logEvent("Prize status updated", { jobId: job.attrs._id });

  subscribers.forEach((s) => {
    bot.telegram.sendMessage(s.telegramId, winnersMessage);
  });

  await logEvent("Messages sent to winners", { jobId: job.attrs._id });
});

agenda.on("ready", () => {
  agenda.start();
});

export default agenda;
