import { Agenda } from "@hokify/agenda";
import { ObjectId } from "mongodb";

import {
  userCol,
  subscribersCol,
  userPrizeStatusCol,
  eventInfoCol,
} from "./database";
import bot from "./bot";
import { mongoUrl } from "./config";

const agenda = new Agenda({
  db: {
    address: mongoUrl,
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

  return participants.slice(0, numberOfWinners);
}

agenda.define("draw", async (job) => {
  try {
    const { eventId, numberOfWinners, winnersMessage } = job.attrs.data as {
      eventId: string;
      numberOfWinners: number;
      winnersMessage: string;
    };

    const winners = await selectWinners(eventId, numberOfWinners);

    const subscribers = await subscribersCol
      .find({
        _id: { $in: winners.map((winner) => winner.subscriberId) },
      })
      .toArray();

    try {
      // Using ordered: false ensures that even if some documents fail to insert due to duplicates,
      // the operation continues for the remaining documents
      await userPrizeStatusCol.insertMany(
        winners.map((winner) => ({
          shortId: winner.shortId,
          claimed: false,
          eventId: new ObjectId(eventId),
        })),
        { ordered: false }
      );
    } catch (error: any) {
      // MongoDB duplicate key error has code 11000
      if (error.code === 11000 || (error.writeErrors && error.writeErrors.some((err: any) => err.code === 11000))) {
        console.log("Some users were already in the winners list, skipping duplicates");
      } else {
        // If it's not a duplicate key error, rethrow
        throw error;
      }
    }

    await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        try {
          await bot.telegram.sendMessage(subscriber.telegramId, winnersMessage);
        } catch (error) {
          console.error(
            `Error sending message to subscriber ${subscriber._id}:`,
            error
          );
        }
      })
    );
  } catch (error) {
    console.error("Error in draw job:", error);
    throw error;
  }
});

agenda.define("send notifications", async (job) => {
  try {
    const { eventId } = job.attrs.data as { eventId: string };
    const event = await eventInfoCol.findOne({ _id: new ObjectId(eventId) });
    if (!event) throw new Error("Event not found");

    const subscribers = await subscribersCol.find().toArray();

    const sendMessages = async (subscriber: any) => {
      await bot.telegram.sendMessage(
        subscriber.telegramId,
        `Привет, ${subscriber.name}!\nОткрыта регистрация на ${event.title}!\nВперед!`
      );

      await bot.telegram.sendMessage(
        subscriber.telegramId,
        `${event.description}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Участвовать",
                  callback_data: `event_${event._id}`,
                },
              ],
            ],
          },
        }
      );
    };

    await Promise.allSettled(subscribers.map(sendMessages));
  } catch (error) {
    console.error("Error in send notifications job:", error);
    throw error;
  }
});

agenda.define("send event notification", async (job) => {
  try {
    const { eventId, message } = job.attrs.data as {
      eventId: string;
      message: string;
    };

    const users = await userCol
      .find({ eventId: new ObjectId(eventId) })
      .toArray();
    const subscribers = await subscribersCol
      .find({
        _id: { $in: users.map((user) => user.subscriberId) },
      })
      .toArray();

    await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        try {
          await bot.telegram.sendMessage(subscriber.telegramId, message);
        } catch (error) {
          console.error(
            `Error sending message to subscriber ${subscriber._id}:`,
            error
          );
        }
      })
    );
  } catch (error) {
    console.error("Error in send event notification job:", error);
    throw error;
  }
});

agenda.define("send draw intro", async (job) => {
  try {
    const { eventId, introMessage } = job.attrs.data as {
      eventId: string;
      introMessage: string;
    };
    const users = await userCol
      .find({ eventId: new ObjectId(eventId) })
      .toArray();
    const subscribers = await subscribersCol
      .find({ _id: { $in: users.map((user) => user.subscriberId) } })
      .toArray();

    await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        return bot.telegram.sendMessage(subscriber.telegramId, introMessage);
      })
    );
  } catch (error) {
    console.error("Error in send draw intro job:", error);
    throw error;
  }
});

agenda.define("send announcement", async (job) => {
  try {
    const { message, image } = job.attrs.data as {
      message: string;
      image?: string;
    };
    const subscribers = await subscribersCol.find().toArray();

    await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        try {
          await bot.telegram.sendMessage(subscriber.telegramId, message);
        } catch (error) {
          console.error(
            `Error sending message to subscriber ${subscriber._id}:`,
            error
          );
        }
        if (image) {
          try {
            await bot.telegram.sendPhoto(subscriber.telegramId, image);
          } catch (error) {
            console.error(
              `Error sending photo to subscriber ${subscriber._id}:`,
              error
            );
          }
        }
      })
    );
  } catch (error) {
    console.error("Error in send announcement job:", error);
    throw error;
  }
});

agenda.on("ready", () => {
  agenda
    .start()
    .then(() => console.log("Agenda started"))
    .catch((err) => console.error("Agenda failed to start:", err));
});

export default agenda;
