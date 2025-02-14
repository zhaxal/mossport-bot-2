import fs from "fs";
import { parse as json2csvParse } from "json2csv";
import { Router, Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { IncomingForm, Files, Fields } from "formidable";

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

// Utility function to wrap a callback-based form parsing in a promise
const parseForm = (req: Request): Promise<[Fields, Files]> =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve([fields, files]);
    });
  });

// Utility to promisify stream finish
const streamFinished = (stream: NodeJS.WritableStream): Promise<void> =>
  new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

const toObjectId = (id: string): ObjectId => new ObjectId(id);

const verifyAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.headers.authorization !== adminToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
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
      await eventInfoCol.insertOne({ ...event, status: "created" });
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
      const { eventId } = req.params;
      const event = req.body;
      await eventInfoCol.updateOne(
        { _id: toObjectId(eventId) },
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
      const { eventId, type } = req.params;
      const [fields, files] = await parseForm(req);
      if (!files.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      // File may be an array or single file instance; we pick the first one if needed.
      const fileData = Array.isArray(files.file) ? files.file[0] : files.file;
      const randomFileName = Math.random().toString(36).substring(7);
      const filename =
        fileData.originalFilename ||
        `${fileData.newFilename}-${randomFileName}`;
      const uploadStream = bucket.openUploadStream(filename, {
        chunkSizeBytes: fileData.size,
      });
      fs.createReadStream(fileData.filepath).pipe(uploadStream);
      await streamFinished(uploadStream);

      const fileLink = `/files/${uploadStream.filename.toString()}`;
      const updateField: Record<string, string> = {};
      switch (type) {
        case "map":
          updateField.mapLink = fileLink;
          break;
        case "rules":
          updateField.rulesLink = fileLink;
          break;
        case "policy":
          updateField.policyLink = fileLink;
          break;
        case "prizeTable":
          updateField.prizeTableLink = fileLink;
          break;
        default:
          return res.status(400).json({ error: "Invalid file type" });
      }
      await eventInfoCol.updateOne(
        { _id: toObjectId(eventId) },
        { $set: updateField }
      );
      res.json({ message: "File uploaded" });
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
        { $set: { token, updatedAt: new Date() } },
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
      const { eventId } = req.params;
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
      const { eventId } = req.params;
      const { status } = req.body;
      await eventInfoCol.updateOne(
        { _id: toObjectId(eventId) },
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
      const { eventId } = req.params;
      const users = await userCol
        .find({ eventId: toObjectId(eventId) })
        .toArray();
      const csvData = json2csvParse(users);
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
      const { eventId } = req.params;
      const drawInfo = req.body;
      await drawInfoCol.updateOne(
        { eventId: toObjectId(eventId) },
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
      const { eventId } = req.params;
      const draw = await drawInfoCol.findOne({ eventId: toObjectId(eventId) });
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
        { eventId: toObjectId(eventId) },
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
      const { eventId } = req.params;
      const winnersDocs = await userPrizeStatusCol
        .find({ eventId: toObjectId(eventId) })
        .toArray();

      interface WinnersInfo {
        firstName: string;
        lastName: string;
        shortId: number;
        prizeClaimed: boolean;
      }
      const winnersInfo: WinnersInfo[] = [];
      for (const winner of winnersDocs) {
        const user = await userCol.findOne({
          shortId: winner.shortId,
          eventId: toObjectId(eventId),
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
      const { eventId } = req.params;
      const users = await userCol
        .find({ eventId: toObjectId(eventId) })
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
          winner: Boolean(prizeStatus),
          prizeClaimed: prizeStatus?.claimed || false,
        });
      }
      const csvData = json2csvParse(usersCSV);
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
      const usersCSV = users.map((user: any, i: number) => ({
        num: i + 1,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      }));
      const csvData = json2csvParse(usersCSV);
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
