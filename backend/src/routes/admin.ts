import * as fs from "fs";
import dotenv from "dotenv";
import json2csv from "json2csv";

import { Router } from "express";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm } from "formidable";

import bot from "../bot";
import {
  eventInfoCol,
  userCol,
  bucket,
  tokenCol,
  drawInfoCol,
  subscribersCol,
} from "../database";

dotenv.config();

const adminToken = process.env.ADMIN_TOKEN;

const adminRouter = Router();

adminRouter.post("/token", async (req, res) => {
  if (req.body.token !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  res.send("Token verified");
});

adminRouter.post("/event", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const event = req.body;

  await eventInfoCol.insertOne({
    ...event,
    status: "created",
  });

  res.send("Event added");
});

adminRouter.patch("/event/:eventId", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const eventId = req.params.eventId;
  const event = req.body;

  await eventInfoCol.updateOne({ _id: new ObjectId(eventId) }, { $set: event });

  res.send("Event updated");
});

adminRouter.post("/event/:eventId/file/:type", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const form = new IncomingForm();
  const eventId = req.params.eventId;

  const [_, files] = await form.parse(req);

  if (!files.file) {
    return res.status(400).send("No file uploaded");
  }

  const file = files.file[0];

  const randomFileName = Math.random().toString(36).substring(7);

  const uploadedFile = fs.createReadStream(file.filepath).pipe(
    bucket.openUploadStream(
      file.originalFilename || `${file}${randomFileName}`,
      {
        chunkSizeBytes: file.size,
      }
    )
  );

  switch (req.params.type) {
    case "map":
      await eventInfoCol.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: { mapLink: `/files/${uploadedFile.filename.toString()}` } }
      );
      break;

    case "rules":
      await eventInfoCol.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: { rulesLink: `/files/${uploadedFile.filename.toString()}` } }
      );
      break;

    case "policy":
      await eventInfoCol.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: { policyLink: `/files/${uploadedFile.filename.toString()}` } }
      );
      break;

    case "prizeTable":
      await eventInfoCol.updateOne(
        { _id: new ObjectId(eventId) },
        {
          $set: {
            prizeTableLink: `/files/${uploadedFile.filename.toString()}`,
          },
        }
      );
      break;

    default:
      res.status(400).send("Invalid file type");
      break;
  }

  res.send("File uploaded");
});

adminRouter.patch("/operator", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const token = uuidv4();

  await tokenCol.updateOne(
    {
      role: "operator",
    },
    { $set: { token: token, updatedAt: new Date() } },
    {
      upsert: true,
    }
  );

  res.send("Operator token updated");
});

adminRouter.get("/operator", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const tokenDoc = await tokenCol.findOne({ role: "operator" });

  if (!tokenDoc) {
    return res.status(404).send("Token not found");
  }

  res.send(tokenDoc);
});

adminRouter.post("/event/:eventId/notification", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const { message } = req.body;
  const eventId = req.params.eventId;

  const users = await userCol
    .find({ eventId: new ObjectId(eventId) })
    .toArray();

  const subscribers = await subscribersCol
    .find({ _id: { $in: users.map((user) => user.subscriberId) } })
    .toArray();

  subscribers.forEach((subscriber) => {
    bot.telegram.sendMessage(subscriber.telegramId, message);
  });

  res.send("Notification sent");
});

adminRouter.patch("/event/:eventId/status", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const eventId = req.params.eventId;
  const { status } = req.body;

  await eventInfoCol.updateOne(
    { _id: new ObjectId(eventId) },
    { $set: { status } }
  );

  if (status === "active") {
    const event = await eventInfoCol.findOne({ _id: new ObjectId(eventId) });
    if (!event) return;

    const subscribers = await subscribersCol.find().toArray();

    for (const subscriber of subscribers) {
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
              [{ text: "Участвовать", callback_data: `event_${event._id}` }],
            ],
          },
        }
      );
    }
  }

  res.send("Event status updated");
});

adminRouter.get("/event/:eventId/users/csv", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const eventId = req.params.eventId;

  const users = await userCol
    .find({ eventId: new ObjectId(eventId) })
    .toArray();

  const csvData = json2csv.parse(users);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");

  res.send(csvData);
});

adminRouter.patch("/event/:eventId/draw", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const eventId = req.params.eventId;
  const drawInfo = req.body;

  await drawInfoCol.updateOne(
    { eventId: new ObjectId(eventId) },
    { $set: drawInfo },
    { upsert: true }
  );

  res.send("Draw info updated");
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

adminRouter.get("/event/:eventId/draw/start", async (req, res) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).send("Unauthorized");
  }

  const eventId = req.params.eventId;

  const draw = await drawInfoCol.findOne({ eventId: new ObjectId(eventId) });

  if (!draw) {
    return res.status(404).send("Draw info not found");
  }

  const drawInterval = draw.drawInterval;
  const numberOfDraws = draw.drawDuration;
  const numberOfWinners = draw.winnerNumber;

  // Start the draw
  let drawCount = 0;
  const drawIntervalId = setInterval(async () => {
    const winners = await selectWinners(eventId, numberOfWinners);

    const subscribers = await subscribersCol
      .find({
        _id: { $in: winners.map((winner) => winner.subscriberId) },
      })
      .toArray();

    subscribers.forEach((s) => {
      bot.telegram.sendMessage(s.telegramId, draw.winnersMessage);
    });

    drawCount++;
    if (drawCount >= numberOfDraws) {
      clearInterval(drawIntervalId);
    }
  }, drawInterval * 60 * 60 * 1000);

  await drawInfoCol.updateOne(
    { eventId: new ObjectId(eventId) },
    { $set: { completed: true } }
  );

  res.send("Draw started");
});

export default adminRouter;
