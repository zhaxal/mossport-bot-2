import * as fs from "fs";
import json2csv from "json2csv";
import { Router, Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm } from "formidable";


import {
  eventInfoCol,
  userCol,
  bucket,
  tokenCol,
  drawInfoCol,
  subscribersCol,
  userPrizeStatusCol,
} from "../database";

import agenda from "../agenda";
import { adminToken } from "../config";

const adminRouter = Router();


const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization !== adminToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

adminRouter.post(
  "/token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.token !== adminToken) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.json({ message: "Token verified" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  "/event",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = req.body;
      await eventInfoCol.insertOne({
        ...event,
        status: "created",
      });
      res.json({ message: "Event added" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.patch(
  "/event/:eventId",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const event = req.body;
      await eventInfoCol.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: event }
      );
      res.json({ message: "Event updated" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  "/event/:eventId/file/:type",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const form = new IncomingForm();
      const eventId = req.params.eventId;
      const [fields, files] = await form.parse(req);
      if (!files.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const file = files.file[0];
      const randomFileName = Math.random().toString(36).substring(7);
      const uploadStream = bucket.openUploadStream(
        file.originalFilename || `${file}${randomFileName}`,
        {
          chunkSizeBytes: file.size,
        }
      );
      fs.createReadStream(file.filepath).pipe(uploadStream);

      // Wait for upload to finish
      uploadStream.on("finish", async () => {
        const fileLink = `/files/${uploadStream.filename.toString()}`;
        switch (req.params.type) {
          case "map":
            await eventInfoCol.updateOne(
              { _id: new ObjectId(eventId) },
              { $set: { mapLink: fileLink } }
            );
            break;
          case "rules":
            await eventInfoCol.updateOne(
              { _id: new ObjectId(eventId) },
              { $set: { rulesLink: fileLink } }
            );
            break;
          case "policy":
            await eventInfoCol.updateOne(
              { _id: new ObjectId(eventId) },
              { $set: { policyLink: fileLink } }
            );
            break;
          case "prizeTable":
            await eventInfoCol.updateOne(
              { _id: new ObjectId(eventId) },
              { $set: { prizeTableLink: fileLink } }
            );
            break;
          default:
            return res.status(400).json({ error: "Invalid file type" });
        }
        res.json({ message: "File uploaded" });
      });
      uploadStream.on("error", (err) => {
        next(err);
      });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.patch(
  "/operator",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = uuidv4();
      await tokenCol.updateOne(
        { role: "operator" },
        { $set: { token: token, updatedAt: new Date() } },
        { upsert: true }
      );
      res.json({ message: "Operator token updated" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/operator",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenDoc = await tokenCol.findOne({ role: "operator" });
      if (!tokenDoc) {
        return res.status(404).json({ error: "Token not found" });
      }
      res.json(tokenDoc);
    } catch (err) {
      next(err);
    }
  }
);


adminRouter.post(
  "/event/:eventId/notification",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = req.body;
      const eventId = req.params.eventId;
      await agenda.now("send event notification", { eventId, message });
      res.json({ message: "Notification scheduled" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.patch(
  "/event/:eventId/status",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const { status } = req.body;
      await eventInfoCol.updateOne(
        { _id: new ObjectId(eventId) },
        { $set: { status } }
      );

      if (status === "active") {
        agenda.now("send notifications", { eventId });
      }
      res.json({ message: "Event status updated" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/event/:eventId/users/csv",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const users = await userCol
        .find({ eventId: new ObjectId(eventId) })
        .toArray();
      const csvData = json2csv.parse(users);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");
      res.send(csvData);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.patch(
  "/event/:eventId/draw",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const drawInfo = req.body;
      await drawInfoCol.updateOne(
        { eventId: new ObjectId(eventId) },
        { $set: drawInfo },
        { upsert: true }
      );
      res.json({ message: "Draw info updated" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/event/:eventId/draw/start",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const draw = await drawInfoCol.findOne({
        eventId: new ObjectId(eventId),
      });
      if (!draw) {
        return res.status(404).json({ error: "Draw info not found" });
      }
      const {
        drawInterval,
        drawDuration: numberOfDraws,
        winnerNumber: numberOfWinners,
        introMessage,
      } = draw;


      await agenda.now("send draw intro", { eventId, introMessage });

      for (let i = 1; i <= numberOfDraws; i++) {
        const scheduledTime = new Date(
          Date.now() + drawInterval * 60 * 60 * 1000 * i
        );
        agenda.schedule(scheduledTime, "draw", {
          eventId,
          numberOfWinners,
          winnersMessage: draw.winnersMessage,
        });
      }
      await drawInfoCol.updateOne(
        { eventId: new ObjectId(eventId) },
        { $set: { completed: true } }
      );
      res.json({ message: "Draw started" });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/event/:eventId/draw/winners",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const winnersIds = await userPrizeStatusCol
        .find({ eventId: new ObjectId(eventId) })
        .toArray();
      interface WinnersInfo {
        firstName: string;
        lastName: string;
        shortId: number;
        prizeClaimed: boolean;
      }
      const winnersInfo: WinnersInfo[] = [];
      for (const winner of winnersIds) {
        const user = await userCol.findOne({
          shortId: winner.shortId,
          eventId: new ObjectId(eventId),
        });
        if (user) {
          winnersInfo.push({
            firstName: user.firstName,
            lastName: user.lastName,
            shortId: user.shortId,
            prizeClaimed: winner.claimed,
          });
        }
      }
      res.json(winnersInfo);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/event/:eventId/csv",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = req.params.eventId;
      const users = await userCol
        .find({ eventId: new ObjectId(eventId) })
        .toArray();
      interface UserCSV {
        num: number;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        winner: boolean;
        prizeClaimed: boolean;
      }
      const usersCSV: UserCSV[] = [];
      for (const user of users) {
        const prizeStatus = await userPrizeStatusCol.findOne({
          shortId: user.shortId,
          eventId: user.eventId,
        });
        usersCSV.push({
          num: usersCSV.length + 1,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          winner: !!prizeStatus,
          prizeClaimed: prizeStatus?.claimed || false,
        });
      }
      const csvData = json2csv.parse(usersCSV);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");
      res.send(csvData);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.get(
  "/csv",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userCol
        .aggregate([
          {
            $group: {
              _id: "$subscriberId",
              doc: { $first: "$$ROOT" },
            },
          },
          { $replaceRoot: { newRoot: "$doc" } },
        ])
        .toArray();
      const usersCSV = users.map((user, i) => ({
        num: i + 1,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      }));
      const csvData = json2csv.parse(usersCSV);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");
      res.send(csvData);
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.post(
  "/announce",
  verifyAdminToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, image } = req.body;
      await agenda.now("send announcement", { message, image });
      res.json({ message: "Announcement scheduled" });
    } catch (err) {
      next(err);
    }
  }
);

export default adminRouter;
