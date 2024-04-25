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

  await eventInfoCol.insertOne(event);

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

  users.forEach((user) => {
    bot.telegram.sendMessage(user.userId, message, {
      parse_mode: "HTML",
    });
  });

  res.send("Notification sent");
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

export default adminRouter;
